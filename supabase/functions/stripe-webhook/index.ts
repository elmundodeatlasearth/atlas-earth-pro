import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12"
import {
  mutacionCheckoutCompletado,
  mutacionFacturaPagada,
  mutacionSuscripcionCancelada,
  sumarCreditosPagoUnico,
} from "./_shared/pagos.ts"

// ============================================================
// STRIPE WEBHOOK — v2 (eventos completos)
//   checkout.session.completed      → ULTRA (subscription) | PRO (payment)
//   invoice.paid                    → RENOVACIÓN mensual ULTRA (50 créditos)
//   customer.subscription.deleted   → revocar plan
//   customer.subscription.updated   → revocar si cancelado/pausado/degradado
//
// La lógica de negocio vive en _shared/pagos.ts (mismo código que el
// frontend testea con Jest). Aquí SOLO orquestamos la persistencia.
// ============================================================

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature")
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")

  if (!signature || !webhookSecret) {
    return new Response("Faltan firmas o secretos", { status: 400 })
  }

  try {
    const body = await req.text()

    // Verificar firma de Stripe
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    )

    console.log(`Evento recibido: ${event.type}`)

    // Inicializar cliente de Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      // 1. Verificar pago exitoso
      if (session.payment_status !== "paid") {
        console.log(`Pago no completado: ${session.payment_status}`)
        return new Response(JSON.stringify({ received: true, note: "Payment not completed" }), { status: 200 })
      }

      // 2. client_reference_id = userId
      const userId = session.client_reference_id
      if (!userId) {
        console.log("No client_reference_id — sesión:", session.id)
        return new Response(JSON.stringify({ received: true, note: "No user ID" }), { status: 200 })
      }

      // 3. Aplicar mutación calculada por la lógica pura
      const mutacion = mutacionCheckoutCompletado(
        {
          mode: session.mode || "",
          payment_status: session.payment_status || "",
          amount_total: session.amount_total,
          customer: (session.customer as string) || null,
        },
        new Date().toISOString(),
      )

      if (!mutacion) {
        return new Response(JSON.stringify({ received: true, note: "Nothing to apply" }), { status: 200 })
      }

      // 4. Asegurar fila de usuario (upsert)
      const { error: upsertError } = await supabase
        .from("usuarios_atlas")
        .upsert({
          user_id: userId,
          perfil_data: {},
          stripe_customer_id: (session.customer as string) || null,
        }, { onConflict: "user_id" })
      if (upsertError) {
        console.error("Error creando usuario en webhook:", upsertError)
        return new Response(JSON.stringify({ error: "User upsert failed" }), { status: 500 })
      }

      // 5. Para pago único, sumar a créditos existentes
      if (session.mode !== "subscription") {
        const { data: currentUser } = await supabase
          .from("usuarios_atlas")
          .select("ai_credits")
          .eq("user_id", userId)
          .single()
        const actuales = (currentUser?.ai_credits as number) || 0
        mutacion.ai_credits = sumarCreditosPagoUnico(actuales, session.amount_total || 0)
      }

      const { error } = await supabase
        .from("usuarios_atlas")
        .update(mutacion)
        .eq("user_id", userId)

      if (error) {
        console.error("Error aplicando beneficios:", error)
        return new Response(JSON.stringify({ error: "Update failed" }), { status: 500 })
      }

      console.log(`🎉 Beneficios aplicados a ${userId}:`, mutacion)
    }

    // ===== RENOVACIÓN MENSUAL ULTRA =====
    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = (invoice.customer as string) || ""
      if (!customerId) {
        return new Response(JSON.stringify({ received: true, note: "No customer" }), { status: 200 })
      }

      // Buscar el user_id asociado a este customer de Stripe
      const { data: userRow, error: findError } = await supabase
        .from("usuarios_atlas")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single()

      if (findError || !userRow) {
        console.log("Invoice paid sin usuario vinculado (customer:", customerId, ")")
        return new Response(JSON.stringify({ received: true, note: "No linked user" }), { status: 200 })
      }

      // La renovación es un RESET mensual: 50 créditos para ULTRA
      const mutacion = mutacionFacturaPagada()
      const { error: renewError } = await supabase
        .from("usuarios_atlas")
        .update({ ...mutacion, credits_updated_at: new Date().toISOString() })
        .eq("user_id", userRow.user_id)

      if (renewError) {
        console.error("Error renovando créditos:", renewError)
        return new Response(JSON.stringify({ error: "Update failed" }), { status: 500 })
      }
      console.log(`🔄 Créditos ULTRA renovados para ${userRow.user_id}`)
    }

    // ===== CANCELACIÓN / REVOCACIÓN =====
    if (event.type === "customer.subscription.deleted" ||
        event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      // Solamente revocar si la suscripción ya no está activa
      const active = subscription.status === "active" || subscription.status === "trialing"
      if (event.type === "customer.subscription.updated" && active) {
        return new Response(JSON.stringify({ received: true, note: "Subscription still active" }), { status: 200 })
      }

      const { data: userRow, error: findError } = await supabase
        .from("usuarios_atlas")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single()

      if (!findError && userRow) {
        const mutacion = mutacionSuscripcionCancelada()
        const { error: revokeError } = await supabase
          .from("usuarios_atlas")
          .update(mutacion)
          .eq("user_id", userRow.user_id)
        if (revokeError) console.error("Error revocando plan:", revokeError)
        else console.log(`Plan revocado para ${userRow.user_id}`)
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    console.error("Error en Webhook:", err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})

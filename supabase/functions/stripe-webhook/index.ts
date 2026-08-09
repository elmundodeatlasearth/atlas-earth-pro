import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12"

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
      
      // ===== VALIDACIONES MEJORADAS =====
      
      // 1. Verificar que el pago fue exitoso
      if (session.payment_status !== "paid") {
        console.log(`Pago no completado: ${session.payment_status}`)
        return new Response(JSON.stringify({ received: true, note: "Payment not completed" }), { status: 200 })
      }

      // 2. Verificar que client_reference_id (userId) existe
      const userId = session.client_reference_id
      if (!userId) {
        console.log("No se proporcionó client_reference_id — sesión:", session.id)
        return new Response(JSON.stringify({ received: true, note: "No user ID" }), { status: 200 })
      }

      // 3. Garantizar que el usuario exista (upsert si no hay fila)
      // Si el usuario pagó antes de usar la app, el trigger on_auth_user_created
      // ya debería haber creado la fila; pero por seguridad hacemos upsert.
      const { error: upsertUserError } = await supabase
        .from('usuarios_atlas')
        .upsert({
          user_id: userId,
          perfil_data: {},
          stripe_customer_id: (session.customer as string) || null,
        }, { onConflict: 'user_id' })
      if (upsertUserError) {
        console.error('Error creando usuario en webhook:', upsertUserError)
        return new Response(JSON.stringify({ error: "User upsert failed" }), { status: 500 })
      }

      // 4. Otorgar beneficios según modo de pago
      console.log(`✅ Otorgando beneficios a: ${userId} | Modo: ${session.mode} | Monto: ${session.amount_total}`)

      if (session.mode === "subscription") {
        // Suscripción mensual → ULTRA
        const { error } = await supabase
          .from('usuarios_atlas')
          .update({ is_vip: true, is_ultra: true, ai_credits: 50 })
          .eq('user_id', userId)
        if (error) {
          console.error("Error actualizando Supabase ULTRA:", error)
          return new Response(JSON.stringify({ error: "Update failed" }), { status: 500 })
        }
        console.log(`🎉 Usuario ${userId} actualizado a ULTRA`)
      } else {
        // Pago único → PRO / créditos extras
        const amountUsd = (session.amount_total || 0) / 100
        const creditsToAdd = Math.max(3, Math.floor(amountUsd / 2))
        
        // Obtener créditos actuales para sumar correctamente
        const { data: currentUser, error: fetchError } = await supabase
          .from('usuarios_atlas')
          .select('ai_credits')
          .eq('user_id', userId)
          .single()
        
        const currentCredits = (!fetchError && currentUser?.ai_credits) ? currentUser.ai_credits : 0
        const newCredits = amountUsd >= 5 ? currentCredits + creditsToAdd : currentCredits + 3
        
        const { error } = await supabase
          .from('usuarios_atlas')
          .update({ is_vip: true, ai_credits: newCredits })
          .eq('user_id', userId)
        if (error) {
          console.error("Error actualizando Supabase PRO:", error)
          return new Response(JSON.stringify({ error: "Update failed" }), { status: 500 })
        }
        console.log(`🎉 Usuario ${userId} actualizado a PRO con +${amountUsd >= 5 ? creditsToAdd : 3} créditos IA (total: ${newCredits})`)
      }
    } 

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      // Buscar el user_id asociado a este customer de Stripe
      const { data: userRow, error: findError } = await supabase
        .from('usuarios_atlas')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (!findError && userRow) {
        // Revocar plan al cancelar
        const { error: revokeError } = await supabase
          .from('usuarios_atlas')
          .update({ is_vip: false, is_ultra: false })
          .eq('user_id', userRow.user_id)
        if (revokeError) console.error('Error revocando plan:', revokeError)
        else console.log(`Plan revocado para ${userRow.user_id}`)
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    console.error("Error en Webhook:", err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})

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

    // Inicializar cliente de Supabase (usando Service Role para evitar RLS)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      
      // El client_reference_id debe ser el ID del usuario en Supabase
      const userId = session.client_reference_id
      
      if (userId) {
        console.log(`Otorgando beneficios a usuario: ${userId} (Modo: ${session.mode})`)
        
        // Si es pago único ($4.99) -> PRO
        // Si es suscripción mensual ($10/mes) -> ULTRA
        if (session.mode === "subscription") {
            const { error } = await supabase
              .from('usuarios_atlas')
              .update({ is_vip: true, is_ultra: true, ai_credits: 50 })
              .eq('user_id', userId)
            if (error) console.error("Error actualizando Supabase ULTRA:", error)
        } else {
            const { error } = await supabase
              .from('usuarios_atlas')
              .update({ is_vip: true, ai_credits: 3 })
              .eq('user_id', userId)
            if (error) console.error("Error actualizando Supabase VIP:", error)
        }
      } else {
        console.log("No se proporcionó client_reference_id")
      }
    } 

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    console.error("Error en Webhook:", err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})

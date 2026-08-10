# Stripe Webhook — Guía de Configuración
# ============================================================================
# El webhook de Stripe actualiza Supabase cuando hay pagos (PRO/ULTRA).
# Sin esto, los pagos NO activan los planes automáticamente.
# ============================================================================

## 1. La edge function debe estar desplegada primero
#    Ejecuta: scripts/deploy-supabase.ps1 (o `supabase functions deploy stripe-webhook`)
#
#    La URL del webhook será:
#    https://yzykfkuoievdwqccyjtc.supabase.co/functions/v1/stripe-webhook

## 2. Crear el endpoint en el dashboard de Stripe
#    1. Ve a: https://dashboard.stripe.com/webhooks
#    2. Click "Add endpoint"
#    3. Endpoint URL:
#       https://yzykfkuoievdwqccyjtc.supabase.co/functions/v1/stripe-webhook
#    4. Eventos a escuchar (IMPORTANTE — solo estos tres):
#       - checkout.session.completed   → activa PRO/ULTRA al pagar
#       - customer.subscription.deleted → revoca plan al cancelar
#    5. Click "Add endpoint"
#    6. Copia el "Signing secret" (empieza con whsec_...)

## 3. Guardar el secreto en Supabase
#    supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_tu_secreto_aqui"

## 4. Configurar los checkout links del frontend
#    En .env.local:
#      NEXT_PUBLIC_STRIPE_PRO_LINK="https://buy.stripe.com/..."   (pago único → PRO)
#      NEXT_PUBLIC_STRIPE_ULTRA_LINK="https://buy.stripe.com/..." (suscripción → ULTRA)
#
#    IMPORTANTE: en el Checkout de Stripe, añade un parámetro client_reference_id
#    con el user_id de Supabase para que el webhook sepa a quién activar.
#    (cron: el frontend debe construir el link con ?client_reference_id=<user_id>)

## 5. Probar con el CLI de Stripe (opcional)
#    stripe listen --forward-to https://yzykfkuoievdwqccyjtc.supabase.co/functions/v1/stripe-webhook
#    stripe trigger checkout.session.completed

## 6. Verificar
#    - Paga con la tarjeta de prueba 4242 4242 4242 4242
#    - El webhook aparece como "200" en el dashboard de Stripe → Events
#    - El usuario pasa a PRO/ULTRA en el CRM (/admin)

# ============================================================================
# ⚠️ RECORDATORIO DE SEGURIDAD (RLS endurecido aplicado en migración 003)
# ============================================================================
# Los usuarios YA NO pueden auto-activarse PRO/ULTRA editando su fila.
# Solo el webhook (service_role) y el admin (edge function) cambian planes.
# Si el webhook no está configurado, los pagos no activarán nada: hazlo ya.

// src/utils/pagos.ts
// Lógica pura de eventos de pago Stripe — extraída del webhook para poder testearla.
// La edge function supabase/functions/stripe-webhook/index.ts usa estos helpers.

export const CREDITOS_PRO = 5;
export const CREDITOS_ULTRA = 50;

export type PlanUsuario = {
  is_vip: boolean;
  is_ultra: boolean;
  ai_credits: number;
  credits_updated_at: string | null;
};

export type SesionCheckout = {
  mode: string;              // "subscription" | "payment"
  payment_status: string;    // "paid" | ...
  amount_total: number | null; // en centavos
  customer: string | null;
};

/** Resultado de aplicar un evento: qué escribir en usuarios_atlas */
export type MutacionPago = {
  is_vip?: boolean;
  is_ultra?: boolean;
  ai_credits?: number;
  credits_updated_at?: string;
};

/**
 * Evento checkout.session.completed
 * - mode === "subscription" → ULTRA (50 créditos)
 * - mode === "payment"      → PRO + créditos según monto (≥3)
 */
export function mutacionCheckoutCompletado(
  sesion: SesionCheckout,
  ahora: string,
): MutacionPago | null {
  if (sesion.payment_status !== "paid") return null;
  if (sesion.mode === "subscription") {
    return {
      is_vip: true,
      is_ultra: true,
      ai_credits: CREDITOS_ULTRA,
      credits_updated_at: ahora,
    };
  }
  // Pago único: PRO + créditos (USD → AB; mínimo 3)
  const amountUsd = (sesion.amount_total || 0) / 100;
  const creditos = Math.max(3, Math.floor(amountUsd / 2));
  return {
    is_vip: true,
    ai_credits: creditos,
    credits_updated_at: ahora,
  };
}

/**
 * Evento invoice.paid — RENOVACIÓN mensual de suscripción ULTRA.
 * Se dispara cada mes mientras la suscripción esté activa.
 */
export function mutacionFacturaPagada(): MutacionPago {
  return {
    is_vip: true,
    is_ultra: true,
    ai_credits: CREDITOS_ULTRA,
  };
}

/**
 * Evento customer.subscription.deleted / updated (cancelado o degradado) →
 * revocar ULTRA/PRO.
 */
export function mutacionSuscripcionCancelada(): MutacionPago {
  return { is_vip: false, is_ultra: false };
}

/** Calcula cuántos créditos sumar a un usuario que ya tenía algunos (pago único) */
export function sumarCreditosPagoUnico(
  actuales: number,
  amountTotalCentavos: number,
): number {
  const amountUsd = (amountTotalCentavos || 0) / 100;
  const creditos = Math.max(3, Math.floor(amountUsd / 2));
  return actuales + creditos;
}

// supabase/functions/_shared/pagos.ts
// Lógica pura de eventos de pago Stripe — COPIA para Deno (edge functions).
// El frontend testea la versión equivalente en src/utils/pagos.ts con Jest.
//
// ⚠️ MANTENER SINCRONIZADO con src/utils/pagos.ts (misma lógica de negocio).
// Si cambias los créditos por plan o la fórmula de pago único, cambia AMBOS.

export const CREDITOS_PRO = 5;
export const CREDITOS_ULTRA = 50;

export type SesionCheckout = {
  mode: string;              // "subscription" | "payment"
  payment_status: string;    // "paid" | ...
  amount_total: number | null; // en centavos
  customer: string | null;
};

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

/** invoice.paid — RENOVACIÓN mensual ULTRA */
export function mutacionFacturaPagada(): MutacionPago {
  return {
    is_vip: true,
    is_ultra: true,
    ai_credits: CREDITOS_ULTRA,
  };
}

/** customer.subscription.deleted / revocación */
export function mutacionSuscripcionCancelada(): MutacionPago {
  return { is_vip: false, is_ultra: false };
}

/** Suma créditos para pago único (mínimo 3) */
export function sumarCreditosPagoUnico(
  actuales: number,
  amountTotalCentavos: number,
): number {
  const amountUsd = (amountTotalCentavos || 0) / 100;
  const creditos = Math.max(3, Math.floor(amountUsd / 2));
  return actuales + creditos;
}

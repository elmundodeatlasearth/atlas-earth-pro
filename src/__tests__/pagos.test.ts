// src/__tests__/pagos.test.ts
import {
  mutacionCheckoutCompletado,
  mutacionFacturaPagada,
  mutacionSuscripcionCancelada,
  sumarCreditosPagoUnico,
  CREDITOS_ULTRA,
} from "@/utils/pagos";

describe("mutacionCheckoutCompletado", () => {
  it("suscripción pagada → ULTRA con 50 créditos", () => {
    const m = mutacionCheckoutCompletado(
      { mode: "subscription", payment_status: "paid", amount_total: 999, customer: "cus_1" },
      "2026-08-10T00:00:00Z",
    );
    expect(m).toEqual({
      is_vip: true,
      is_ultra: true,
      ai_credits: CREDITOS_ULTRA,
      credits_updated_at: "2026-08-10T00:00:00Z",
    });
  });

  it("pago único → PRO con créditos proporcionales (mínimo 3)", () => {
    const m = mutacionCheckoutCompletado(
      { mode: "payment", payment_status: "paid", amount_total: 1000, customer: "cus_2" }, // $10
      "2026-08-10T00:00:00Z",
    );
    expect(m).toEqual({
      is_vip: true,
      ai_credits: 5, // floor(10/2)=5
      credits_updated_at: "2026-08-10T00:00:00Z",
    });
  });

  it("pago único pequeño → mínimo 3 créditos", () => {
    const m = mutacionCheckoutCompletado(
      { mode: "payment", payment_status: "paid", amount_total: 199, customer: "cus_3" }, // $1.99
      "2026-08-10T00:00:00Z",
    );
    expect(m?.ai_credits).toBe(3);
  });

  it("pago NO pagado → null (no muta)", () => {
    const m = mutacionCheckoutCompletado(
      { mode: "subscription", payment_status: "unpaid", amount_total: 999, customer: null },
      "2026-08-10T00:00:00Z",
    );
    expect(m).toBeNull();
  });
});

describe("mutacionFacturaPagada", () => {
  it("renueva ULTRA con 50 créditos mensuales", () => {
    expect(mutacionFacturaPagada()).toEqual({
      is_vip: true,
      is_ultra: true,
      ai_credits: CREDITOS_ULTRA,
    });
  });
});

describe("mutacionSuscripcionCancelada", () => {
  it("revoca ULTRA y PRO", () => {
    expect(mutacionSuscripcionCancelada()).toEqual({
      is_vip: false,
      is_ultra: false,
    });
  });
});

describe("sumarCreditosPagoUnico", () => {
  it("suma créditos a los existentes", () => {
    expect(sumarCreditosPagoUnico(2, 1000)).toBe(7); // 2 + floor(10/2)=5
  });
  it("mínimo 3 créditos", () => {
    expect(sumarCreditosPagoUnico(0, 99)).toBe(3);
  });
});

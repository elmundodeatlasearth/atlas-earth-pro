// src/__tests__/atlasMath.test.ts
// Tests unitarios para el motor de cálculo de Atlas Earth
import { MotorAtlasEarth, calcularNivelPasaporte, TIERS_COMPLETOS } from "@/utils/atlasMath";

describe("MotorAtlasEarth", () => {
  const DEFAULT_PARAMS = [150, 0, 0, 0, 0, 18, 95] as const;

  it("debe crear instancia con valores default", () => {
    const m = new MotorAtlasEarth(...DEFAULT_PARAMS);
    expect(m.total_parcelas).toBe(150);
    expect(m.renta_promedio_sec).toBeGreaterThan(0);
  });

  it("debe calcular total_parcelas correctamente", () => {
    const m = new MotorAtlasEarth(100, 20, 5, 2, 2, 18, 95);
    expect(m.total_parcelas).toBe(127);
  });

  it("debe detectar tier correcto para Paraguay", () => {
    const m = new MotorAtlasEarth(150, 0, 0, 0, 0, 18, 95);
    const { tramo_actual, siguiente_tramo } = m.calcular_escalera("Paraguay", TIERS_COMPLETOS);
    expect(tramo_actual).toBe(150);
    expect(siguiente_tramo).toBe(220);
  });

  it("debe calcular multTier correcto", () => {
    const m = new MotorAtlasEarth(40, 0, 0, 0, 0, 18, 95);
    const mult = m._get_tier_mult(40, "Estados Unidos", TIERS_COMPLETOS);
    expect(mult).toBeGreaterThanOrEqual(1);
  });

  it("debe calcular renta diaria > 0", () => {
    const m = new MotorAtlasEarth(...DEFAULT_PARAMS);
    const renta = m.calcular_renta(10, 32);
    expect(renta).toBeGreaterThan(0);
  });
});

describe("calcularNivelPasaporte", () => {
  it("debe dar nivel 0 con 0 insignias", () => {
    expect(calcularNivelPasaporte(0)).toBe(0);
  });
  it("debe dar nivel 1 con 1 insignia", () => {
    expect(calcularNivelPasaporte(1)).toBe(1);
  });
  it("debe dar nivel maximo 5 con 101+ insignias", () => {
    expect(calcularNivelPasaporte(101)).toBe(5);
    expect(calcularNivelPasaporte(200)).toBe(5);
  });
});

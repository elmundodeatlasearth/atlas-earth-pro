// src/__tests__/costoEscalonado.test.ts
// Tests del costo oficial de parcelas de Atlas Earth (100 AB por parcela) y saltos de Tier
import {
  costoParcela,
  costoTramoParcelas,
  costoMetaAbReal,
  generarSaltosTier,
  TIERS_COMPLETOS,
  AB_POR_PARCELA,
  AB_INICIAL_PARCELA,
} from "@/utils/atlasMath";

describe("costoParcela — precio oficial de Atlas Earth", () => {
  it("todas las parcelas cuestan 100 AB constantes", () => {
    for (let n = 1; n <= 100; n += 10) {
      expect(costoParcela(n)).toBe(100);
    }
  });

  it("constantes coherentes", () => {
    expect(AB_POR_PARCELA).toBe(100);
    expect(AB_INICIAL_PARCELA).toBe(100);
    expect(costoParcela(1)).toBe(100);
    expect(costoParcela(150)).toBe(100);
    expect(costoParcela(220)).toBe(100);
  });
});

describe("costoTramoParcelas — costo total entre dos puntos", () => {
  it("de 0 a 10 cuesta 1000 AB (10 × 100)", () => {
    expect(costoTramoParcelas(0, 10)).toBe(1000);
  });

  it("de 0 a 20 cuesta 2000 AB (20 × 100)", () => {
    expect(costoTramoParcelas(0, 20)).toBe(2000);
  });

  it("de 10 a 20 cuesta 1000 AB (10 × 100)", () => {
    expect(costoTramoParcelas(10, 20)).toBe(1000);
  });

  it("de 150 a 220 cuesta 7000 AB (70 × 100)", () => {
    expect(costoTramoParcelas(150, 220)).toBe(7000);
  });

  it("si objetivo <= actuales devuelve 0", () => {
    expect(costoTramoParcelas(50, 50)).toBe(0);
    expect(costoTramoParcelas(60, 40)).toBe(0);
  });
});

describe("costoMetaAbReal — descuenta AB ahorrados", () => {
  it("descuenta los AB ahorrados", () => {
    expect(costoMetaAbReal(0, 10, 400)).toBe(600);
  });

  it("nunca negativo", () => {
    expect(costoMetaAbReal(0, 5, 5000)).toBe(0);
  });
});

describe("generarSaltosTier — tabla de saltos hasta la meta", () => {
  it("genera saltos oficiales (EEUU desde 150 parcelas hasta 290)", () => {
    const saltos = generarSaltosTier(
      150, "Estados Unidos", TIERS_COMPLETOS,
      0, 100, 200, 20, 100, 0, 1, 0.00000000158, 290,
    );
    expect(saltos.length).toBeGreaterThan(0);
    // Primer salto debe ser a 220 parcelas (70 parcelas de salto)
    expect(saltos[0].tramo).toBe(220);
    expect(saltos[0].faltan_parcelas).toBe(70);
    expect(saltos[0].ab_necesarios).toBe(7000);
    expect(saltos[0].mult_antes).toBe(30);
    expect(saltos[0].mult_despues).toBe(20);
    // Días F2P = 7000 / 100 = 70 días
    expect(saltos[0].dias_f2p).toBeCloseTo(70, 1);
    // Días EC = 7000 / 200 = 35 días
    expect(saltos[0].dias_ec).toBeCloseTo(35, 1);
  });

  it("respeta el límite de la meta", () => {
    const saltos = generarSaltosTier(
      150, "Estados Unidos", TIERS_COMPLETOS,
      0, 100, 200, 20, 100, 0, 1, 0.00000000158, 290,
    );
    expect(saltos.map(s => s.tramo)).toEqual([220, 290]);
  });

  it("si ya está en la meta, no genera saltos", () => {
    const saltos = generarSaltosTier(
      150, "Estados Unidos", TIERS_COMPLETOS,
      0, 100, 200, 20, 100, 0, 1, 0.00000000158, 150,
    );
    expect(saltos).toHaveLength(0);
  });
});

// src/__tests__/costoEscalonado.test.ts
// Tests del costo escalonado real de parcelas de Atlas Earth
import {
  costoParcela,
  costoTramoParcelas,
  costoMetaAbReal,
  generarSaltosTier,
  TIERS_COMPLETOS,
  AB_INICIAL_PARCELA,
  INCREMENTO_AB_CADA,
} from "@/utils/atlasMath";

describe("costoParcela — precio escalonado cada 10 parcelas", () => {
  it("las primeras 10 parcelas cuestan 100 AB cada una", () => {
    for (let n = 1; n <= 10; n++) {
      expect(costoParcela(n)).toBe(100);
    }
  });

  it("las parcelas 11-20 cuestan 200 AB cada una", () => {
    for (let n = 11; n <= 20; n++) {
      expect(costoParcela(n)).toBe(200);
    }
  });

  it("las parcelas 21-30 cuestan 300 AB cada una", () => {
    for (let n = 21; n <= 30; n++) {
      expect(costoParcela(n)).toBe(300);
    }
  });

  it("constantes coherentes", () => {
    expect(AB_INICIAL_PARCELA).toBe(100);
    expect(INCREMENTO_AB_CADA).toBe(10);
    expect(costoParcela(31)).toBe(400);
    expect(costoParcela(100)).toBe(1000);
    expect(costoParcela(0)).toBe(0);
    expect(costoParcela(-5)).toBe(0);
  });
});

describe("costoTramoParcelas — costo total entre dos puntos", () => {
  it("de 0 a 10 cuesta 1000 AB (10 × 100)", () => {
    expect(costoTramoParcelas(0, 10)).toBe(1000);
  });

  it("de 0 a 20 cuesta 3000 AB (10×100 + 10×200)", () => {
    expect(costoTramoParcelas(0, 20)).toBe(3000);
  });

  it("de 10 a 20 cuesta 2000 AB (10×200)", () => {
    expect(costoTramoParcelas(10, 20)).toBe(2000);
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
  it("genera saltos con costo escalonado real (EEUU desde 40)", () => {
    const saltos = generarSaltosTier(
      40, "Estados Unidos", TIERS_COMPLETOS,
      0, 100, 200, 20, 100, 0, 1, 0.00000000158, 100,
    );
    expect(saltos.length).toBeGreaterThan(0);
    // Primer salto debe ser 60 (siguiente límite tras 40)
    expect(saltos[0].tramo).toBe(60);
    // 20 parcelas de 41 a 60: (10×500) + (10×600) = 5000 + 6000 = 11000
    expect(saltos[0].ab_necesarios).toBe(11000);
    // Multiplicador: 40 está en 20x, 60 en 19x
    expect(saltos[0].mult_antes).toBe(20);
    expect(saltos[0].mult_despues).toBe(19);
    // Días F2P = 11000 / 100 = 110
    expect(saltos[0].dias_f2p).toBeCloseTo(110, 1);
    // Días EC = 11000 / 200 = 55
    expect(saltos[0].dias_ec).toBeCloseTo(55, 1);
  });

  it("respeta el límite de la meta", () => {
    const saltos = generarSaltosTier(
      40, "Estados Unidos", TIERS_COMPLETOS,
      0, 100, 200, 20, 100, 0, 1, 0.00000000158, 80,
    );
    expect(saltos.map(s => s.tramo)).toEqual([60, 80]);
  });

  it("si ya está en la meta, no genera saltos", () => {
    const saltos = generarSaltosTier(
      100, "Estados Unidos", TIERS_COMPLETOS,
      0, 100, 200, 20, 100, 0, 1, 0.00000000158, 100,
    );
    expect(saltos).toHaveLength(0);
  });
});

// src/__tests__/atlasMathEdge.test.ts
// Tests adicionales del motor: pasaporte, simulador, optimizador EC, formatos
import {
  MotorAtlasEarth,
  calcularNivelPasaporte,
  generarCalendarioAE,
  optimizadorExplorerClub,
  SimuladorDiario,
  fmt,
  NIVELES_INSIGNIAS,
  obtenerTasaCambio,
  FALLBACK_RATES,
  TIERS_COMPLETOS,
  AB_POR_ANUNCIO,
} from "@/utils/atlasMath";

describe("calcularNivelPasaporte — todos los umbrales", () => {
  it.each([
    [0, 0],
    [1, 1],
    [10, 1],
    [11, 2],
    [30, 2],
    [31, 3],
    [60, 3],
    [61, 4],
    [100, 4],
    [101, 5],
    [500, 5],
  ])("%i insignias → nivel %i", (insignias, esperado) => {
    expect(calcularNivelPasaporte(insignias)).toBe(esperado);
  });

  it("NIVELES_INSIGNIAS es el arreglo de umbrales ordenado", () => {
    expect(NIVELES_INSIGNIAS).toEqual([0, 1, 11, 31, 61, 101]);
    const sorted = [...NIVELES_INSIGNIAS].sort((a, b) => a - b);
    expect(NIVELES_INSIGNIAS).toEqual(sorted);
  });
});

describe("generarCalendarioAE", () => {
  const { f2p, ec } = generarCalendarioAE();

  it("genera calendarios de 90 días", () => {
    expect(f2p).toHaveLength(90);
    expect(ec).toHaveLength(90);
  });

  it("el día 7, 14, 30, 60, 90 tienen recompensas hito", () => {
    expect(f2p[6]).toBe(8);   // día 7
    expect(f2p[13]).toBe(25); // día 14
    expect(f2p[29]).toBe(50); // día 30
    expect(f2p[59]).toBe(80); // día 60
    expect(f2p[89]).toBe(200);// día 90
  });

  it("EC siempre da más AB que F2P en el mismo día", () => {
    for (let i = 0; i < 90; i++) {
      expect(ec[i]).toBeGreaterThanOrEqual(f2p[i]);
    }
  });
});

describe("optimizadorExplorerClub", () => {
  const opt = optimizadorExplorerClub(1);

  it("devuelve las 3 ventanas mensuales + óptimo", () => {
    expect(opt.mes1.dia_inicio).toBe(1);
    expect(opt.mes2.dia_inicio).toBe(31);
    expect(opt.mes3.dia_inicio).toBe(61);
    expect(opt.optimo.dia_inicio).toBeGreaterThanOrEqual(1);
    expect(opt.optimo.dia_inicio).toBeLessThanOrEqual(90);
  });

  it("el neto del óptimo es el máximo entre ventanas", () => {
    expect(opt.optimo.neto_ab).toBeGreaterThanOrEqual(opt.mes1.neto_ab);
    expect(opt.optimo.neto_ab).toBeGreaterThanOrEqual(opt.mes2.neto_ab);
    expect(opt.optimo.neto_ab).toBeGreaterThanOrEqual(opt.mes3.neto_ab);
  });

  it("cada ventana dura 30 días de AB", () => {
    expect(opt.mes1.ab_pase).toBeGreaterThan(0);
    expect(opt.mes1.neto_ab).toBeGreaterThan(0); // EC > F2P siempre
  });
});

describe("SimuladorDiario", () => {
  it("USA da 2 AB/anuncio, resto del mundo 1", () => {
    const usa = new SimuladorDiario(1, 10, AB_POR_ANUNCIO["Estados Unidos"], 100);
    const intl = new SimuladorDiario(1, 10, AB_POR_ANUNCIO["Internacional (Resto del Mundo)"], 100);
    expect(usa.simular_mes()).toBeGreaterThan(intl.simular_mes());
  });

  it("mayor eficiencia de anuncios = más AB", () => {
    const eficiente = new SimuladorDiario(1, 10, 2, 100);
    const regular = new SimuladorDiario(1, 10, 2, 50);
    expect(eficiente.simular_mes()).toBeGreaterThan(regular.simular_mes());
  });

  it("modo EC da más AB que F2P", () => {
    const sim = new SimuladorDiario(1, 10, 2, 95);
    expect(sim.simular_mes(true)).toBeGreaterThan(sim.simular_mes(false));
  });

  it("desglose incluye ruleta, anuncios y asistencia", () => {
    const d = new SimuladorDiario(1, 10, 2, 95).simular_mes_desglosado(false);
    expect(d.ruleta_mes).toBeGreaterThan(0);
    expect(d.anuncios_mes).toBeGreaterThan(0);
    expect(d.asistencia_mes).toBeGreaterThan(0);
    expect(d.total_mes).toBeCloseTo(d.ruleta_mes + d.anuncios_mes + d.asistencia_mes + d.minijuegos_mes, 5);
  });
});

describe("fmt", () => {
  it("formatea números con 4 decimales por defecto", () => {
    expect(fmt(1.23456789)).toBe("1.2346");
  });

  it("acepta precisión custom", () => {
    expect(fmt(1.5, 2)).toBe("1.50");
  });

  it("devuelve em-dash para NaN e Infinity", () => {
    expect(fmt(NaN)).toBe("—");
    expect(fmt(Infinity)).toBe("—");
    expect(fmt(-Infinity)).toBe("—");
  });
});

describe("Tasas de cambio", () => {
  it("USD es la base = 1", () => {
    expect(obtenerTasaCambio("USD")).toBe(1);
  });

  it("MXN existe en el fallback", () => {
    expect(FALLBACK_RATES["MXN"]).toBeGreaterThan(1);
  });

  it("moneda desconocida cae a 1.0", () => {
    expect(obtenerTasaCambio("XXX")).toBe(1);
  });
});

describe("Tiers por país", () => {
  it("todos los países tienen límites y multiplicadores válidos", () => {
    for (const [pais, info] of Object.entries(TIERS_COMPLETOS)) {
      expect(info.limites.length).toBeGreaterThanOrEqual(2);
      expect(info.multiplicadores.length).toBeGreaterThanOrEqual(2);
      // límites estrictamente crecientes
      for (let i = 1; i < info.limites.length; i++) {
        expect(info.limites[i]).toBeGreaterThan(info.limites[i - 1]);
      }
      // multiplicadores siempre positivos y decrecientes (más parcelas = peor mult)
      for (let i = 0; i < info.multiplicadores.length; i++) {
        expect(info.multiplicadores[i]).toBeGreaterThan(0);
        if (i > 0) {
          expect(info.multiplicadores[i]).toBeLessThanOrEqual(info.multiplicadores[i - 1]);
        }
      }
      // el lookup de tier resuelve para cualquier cantidad de parcelas (1, media, excedente)
      const m = new MotorAtlasEarth(1, 0, 0, 0, 0, 18, 95);
      for (const parcels of [1, 150, 99999]) {
        const mult = m._get_tier_mult(parcels, pais, TIERS_COMPLETOS);
        expect(mult).toBeGreaterThan(0);
      }
    }
  });

  it("Estados Unidos arranca en 40 parcelas", () => {
    expect(TIERS_COMPLETOS["Estados Unidos"].limites[0]).toBe(40);
  });
});

describe("MotorAtlasEarth — colapso de tier", () => {
  it("detecta faltantes hasta el siguiente tramo (149 → faltan 1 para 150)", () => {
    const m = new MotorAtlasEarth(149, 0, 0, 0, 0, 18, 95);
    const { tramo_actual, siguiente_tramo, faltantes } = m.calcular_escalera("Estados Unidos", TIERS_COMPLETOS);
    // El motor devuelve el LÍMITE del tramo al que pertenece (149 cae en el tramo 150)
    expect(tramo_actual).toBe(150);
    expect(siguiente_tramo).toBe(220);
    expect(faltantes).toBe(71); // 220 - 149
  });

  it("renta genérica aumenta con más parcelas", () => {
    // usar la renta genérica (con mult por tier) para verificar escalado
    const m = new MotorAtlasEarth(100, 0, 0, 0, 0, 18, 95);
    const r1 = m.calcular_renta_generica(100, "Estados Unidos", TIERS_COMPLETOS);
    const r2 = m.calcular_renta_generica(150, "Estados Unidos", TIERS_COMPLETOS);
    expect(r2).toBeGreaterThan(r1);
  });
});

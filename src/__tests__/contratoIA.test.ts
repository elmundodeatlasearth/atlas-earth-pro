// src/__tests__/contratoIA.test.ts
// Valida el CONTRATO de datos entre frontend y la edge function ai-advisor.
// Si este test falla, el backend y el frontend están desincronizados.
import {
  CAMPOS_NUMERICOS_IA,
  CAMPOS_STRING_IA,
  CAMPOS_BOOL_IA,
  validarContratoIA,
  simuladorRateLimit,
  TODOS_CAMPOS_IA,
} from "@/utils/contratoIA";

// Payload REAL que el frontend arma (useAtlasState.ts → handleGenerateAI)
// usando los cálculos de atlasMath con un estado típico.
function payloadEjemplo(): Record<string, unknown> {
  return {
    // datos crudos
    pais: "Estados Unidos",
    moneda: "USD",
    comunes: 100, raras: 40, epicas: 8, legendarias: 2,
    insignias: 3, ab_ahorrados: 500,
    horas_boost: 18, eficiencia: 95, horas_srb: 64,
    tipo_pase: "Ninguno (F2P)", hora_inicio: "08:00", hora_fin: "22:00",
    eficiencia_anuncios: 90, dia_asistencia: 1,
    meta_dolar: 1, meta_periodo: "day",
    // datos pre-computados
    total_parcelas: 150, mult_tier: 16, pasaporte_nivel: 3, renta_diaria: 0.05,
    renta_semanal: 0.35, renta_mensual: 1.5, renta_anual: 18.25,
    siguiente_tramo: 220, faltantes_tier: 70, colapso_tier: false,
    porcentaje_escalera: 68.18, faltantes_meta: 0, parcelas_meta: 150,
    desglose_f2p_ab_mes: 4800, desglose_f2p_ab_dia: 160,
    desglose_f2p_ab20min_dia: 2, desglose_f2p_ab20min_mes: 60,
    desglose_f2p_pase_mes: 0,
    desglose_ec_ab_mes: 7800, desglose_ec_ab_dia: 260,
    desglose_ec_ab20min_dia: 3, desglose_ec_ab20min_mes: 90,
    desglose_ec_pase_mes: 300,
    ec_optimo_dia_inicio: 1, ec_optimo_ab_netos: 1500,
    ec_optimo_ab_pase: 300, ec_optimo_ab_gratis: 1200,
    roi_global_dias: 365, roi_marginal_dias: 180, renta_adicional: 0.02,
    costo_meta_ab: 12000, parcelas_eq: 160,
    aumento_parcelas: 10, aumento_pasaporte: 1,
    veredicto_estrategia: "Sigue farmeando AB y sube de tier.",
    nivel_pasaporte_actual: 3, nivel_pasaporte_siguiente: 4,
    insignias_faltantes: 7, costo_ab_pasaporte: 2000,
    historial_progreso: [{ fecha: "2026-08-01", usd_generado: 0.05, ab_generado: 150 }],
    saltos_tier: [
      {
        tramo: 220, mult_antes: 16, mult_despues: 15,
        faltan_parcelas: 70, ab_necesarios: 37500, ab_netos: 37000,
        dias_f2p: 234, dias_ec: 142, renta_estimada: 0.058,
      },
      {
        tramo: 290, mult_antes: 15, mult_despues: 14,
        faltan_parcelas: 140, ab_necesarios: 91500, ab_netos: 91000,
        dias_f2p: 572, dias_ec: 350, renta_estimada: 0.066,
      },
    ],
  };
}

describe("Contrato IA Frontend ↔ Edge Function", () => {
  it("el payload de ejemplo tiene TODOS los campos del contrato", () => {
    const payload = payloadEjemplo();
    const errores = validarContratoIA(payload);
    expect(errores).toEqual([]);
  });

  it("todos los campos del contrato están definidos y no vacíos", () => {
    const payload = payloadEjemplo();
    for (const campo of TODOS_CAMPOS_IA) {
      expect(campo in payload).toBe(true);
      expect(payload[campo]).not.toBeUndefined();
      expect(payload[campo]).not.toBeNull();
    }
  });

  it("CAMPOS_NUMERICOS_IA son todos números", () => {
    const payload = payloadEjemplo();
    for (const campo of CAMPOS_NUMERICOS_IA) {
      const v = payload[campo];
      if (typeof v !== "number" || Number.isNaN(v)) {
        throw new Error(`Campo numérico inválido: ${campo} = ${String(v)}`);
      }
    }
  });

  it("CAMPOS_STRING_IA son todos strings no vacíos", () => {
    const payload = payloadEjemplo();
    for (const campo of CAMPOS_STRING_IA) {
      const v = payload[campo];
      if (typeof v !== "string" || v.length === 0) {
        throw new Error(`Campo string inválido: ${campo} = ${String(v)}`);
      }
    }
  });

  it("CAMPOS_BOOL_IA son todos booleanos", () => {
    const payload = payloadEjemplo();
    for (const campo of CAMPOS_BOOL_IA) {
      if (typeof payload[campo] !== "boolean") {
        throw new Error(`Campo boolean inválido: ${campo} = ${String(payload[campo])}`);
      }
    }
  });

  it("detecta payload incompleto (campo faltante)", () => {
    const payload = payloadEjemplo();
    delete payload.total_parcelas;
    const errores = validarContratoIA(payload);
    expect(errores.some(e => e.includes("total_parcelas"))).toBe(true);
  });

  it("detecta payload con string vacío", () => {
    const payload = payloadEjemplo();
    payload.pais = "";
    const errores = validarContratoIA(payload);
    expect(errores.some(e => e.includes("pais"))).toBe(true);
  });
});

describe("Rate limit (lógica espejo de la edge function)", () => {
  it("permite peticiones bajo el límite", () => {
    expect(simuladorRateLimit(5, 10)).toEqual({ allowed: true, remaining: 4 });
  });

  it("bloquea cuando se alcanza el límite", () => {
    expect(simuladorRateLimit(10, 10)).toEqual({ allowed: false, remaining: 0 });
  });

  it("el límite exacto se cuenta correctamente (10ª petición aún permitida como última)", () => {
    // countActual=9 → siguiente sería la 10ª → permitida (remaining 0)
    expect(simuladorRateLimit(9, 10)).toEqual({ allowed: true, remaining: 0 });
  });

  it("nunca deja remaining negativo", () => {
    const r = simuladorRateLimit(99, 10);
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
  });
});

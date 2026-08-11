// src/utils/contratoIA.ts
// CONTRATO DE DATOS Frontend ↔ Edge Function ai-advisor
// ============================================================================
// Este archivo define el contrato de datos que el frontend envía a la edge
// function ai-advisor. La edge function tiene SU PROPIA copia del sanitizer
// (supabase/functions/ai-advisor/index.ts, sección 4) porque Deno no puede
// importar desde src/. Para mantenerlos sincronizados, aquí se valida el
// contrato y se exporta la lista de campos con sus tipos esperados.
//
// Cualquier cambio en uno DEBE reflejarse en el otro. El test
// contratoIA.test.ts verifica esta lista contra el payload real.

/** Campos numéricos que el frontend SIEMPRE envía */
export const CAMPOS_NUMERICOS_IA = [
  "comunes", "raras", "epicas", "legendarias", "insignias", "ab_ahorrados",
  "horas_boost", "eficiencia", "horas_srb", "eficiencia_anuncios", "dia_asistencia",
  "meta_dolar", "total_parcelas", "mult_tier", "pasaporte_nivel", "renta_diaria",
  "renta_semanal", "renta_mensual", "renta_anual", "siguiente_tramo",
  "faltantes_tier", "porcentaje_escalera", "faltantes_meta", "parcelas_meta",
  "desglose_f2p_ab_mes", "desglose_f2p_ab_dia", "desglose_f2p_ab20min_dia",
  "desglose_f2p_ab20min_mes", "desglose_f2p_pase_mes",
  "desglose_ec_ab_mes", "desglose_ec_ab_dia", "desglose_ec_ab20min_dia",
  "desglose_ec_ab20min_mes", "desglose_ec_pase_mes",
  "ec_optimo_dia_inicio", "ec_optimo_ab_netos", "ec_optimo_ab_pase", "ec_optimo_ab_gratis",
  "roi_global_dias", "roi_marginal_dias", "renta_adicional", "costo_meta_ab",
  "parcelas_eq", "aumento_parcelas", "aumento_pasaporte",
  "nivel_pasaporte_actual", "nivel_pasaporte_siguiente", "insignias_faltantes",
  "costo_ab_pasaporte",
] as const;

/** Campos string que el frontend SIEMPRE envía */
export const CAMPOS_STRING_IA = [
  "pais", "moneda", "tipo_pase", "hora_inicio", "hora_fin", "meta_periodo",
  "veredicto_estrategia",
] as const;

/** Campos boolean que el frontend SIEMPRE envía */
export const CAMPOS_BOOL_IA = ["colapso_tier"] as const;

/** Campos opcionales (arrays/objetos) */
export const CAMPOS_OPCIONALES_IA = ["historial_progreso", "saltos_tier"] as const;

/** Todos los campos del contrato */
export const TODOS_CAMPOS_IA = [
  ...CAMPOS_NUMERICOS_IA,
  ...CAMPOS_STRING_IA,
  ...CAMPOS_BOOL_IA,
  ...CAMPOS_OPCIONALES_IA,
] as const;

/**
 * Valida que un payload del frontend cumpla el contrato.
 * Devuelve un array de errores (vacío = OK).
 */
export function validarContratoIA(payload: Record<string, unknown>): string[] {
  const errores: string[] = [];
  for (const campo of CAMPOS_NUMERICOS_IA) {
    const v = payload[campo];
    if (typeof v !== "number" || Number.isNaN(v)) {
      errores.push(`Campo numérico faltante/inválido: ${campo}`);
    }
  }
  for (const campo of CAMPOS_STRING_IA) {
    const v = payload[campo];
    if (typeof v !== "string" || v === "") {
      errores.push(`Campo string faltante/vacío: ${campo}`);
    }
  }
  for (const campo of CAMPOS_BOOL_IA) {
    if (typeof payload[campo] !== "boolean") {
      errores.push(`Campo boolean faltante: ${campo}`);
    }
  }
  return errores;
}

/**
 * Versión espejo del rate limiter (para validar la lógica en Jest).
 * En producción, la edge function usa el RPC check_rate_limit de Postgres
 * (migración 004) — este es solo el fallback in-memory equivalente.
 */
export function simuladorRateLimit(
  countActual: number,
  limite: number,
): { allowed: boolean; remaining: number } {
  if (countActual >= limite) return { allowed: false, remaining: 0 };
  return { allowed: true, remaining: limite - countActual - 1 };
}

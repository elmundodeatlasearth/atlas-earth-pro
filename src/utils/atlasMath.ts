// src/utils/atlasMath.ts — Motor Maestro de Atlas Earth (Port completo desde logica.py)
// ============================================================================

// ---------------------------------------------------------------------------
// TASAS DE CAMBIO
// ---------------------------------------------------------------------------
export const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0, MXN: 17.54, CAD: 1.35, GBP: 0.78,
  AUD: 1.5, NZD: 1.65, ZAR: 18.5, EUR: 0.92, BRL: 5.4,
};

export function obtenerTasaCambio(moneda_destino: string): number {
  return FALLBACK_RATES[moneda_destino] || 1.0;
}

export function obtenerTasasDivisas(): Record<string, number> {
  return { ...FALLBACK_RATES };
}

// ---------------------------------------------------------------------------
// TIPOS COMPARTIDOS
// ---------------------------------------------------------------------------
export interface TierInfo {
  limites: number[];
  multiplicadores: number[];
}

export type TiersDict = Record<string, TierInfo>;

export interface EscaleraResult {
  tramo_actual: number;
  siguiente_tramo: number;
  faltantes: number;
}

export interface MetaResult {
  p_test: number;
  renta_test: number;
}

export interface DesgloseMensual {
  /** Total AB en 30 días */
  total_mes: number;
  /** AB por día en promedio */
  promedio_diario: number;

  // === FUENTES DE INGRESO ===

  /** Ruleta: F2P=5 tiros/día, EC=7 tiros/día. ~1.7 AB/tiro promedio */
  ruleta_diaria: number;
  ruleta_mes: number;

  /** Anuncios/20min: AB/día = maxAnuncios × ab_por_ad × eficiencia
   *  USA = 2 AB/20min, Resto del Mundo = 1 AB/20min */
  anuncios_diarios: number;
  anuncios_mes: number;

  /** AB pasivo cada 20 min (mismo que anuncios). Solo display.
   *  USA = 2, otros = 1. Codificado en ab_por_ad. */
  ab20min_diario: number;
  ab20min_mes: number;

  /** Asistencia diaria (calendario F2P) */
  asistencia_mes: number;

  /** AB extra del pase (calendario EC) */
  pase_mes: number;

  /** AB de minijuegos/pase escalera */
  minijuegos_mes: number;
}

// ---------------------------------------------------------------------------
// TIERS DE PAÍSES
// ---------------------------------------------------------------------------
export const TIERS_COMPLETOS: TiersDict = {
  "Estados Unidos": { limites: [150, 220, 290, 365, 435, 545, 625, 730, 875, 1100, 1500], multiplicadores: [30, 20, 15, 12, 10, 8, 7, 6, 5, 4, 3, 2] },
  "Canadá": { limites: [60, 100, 150, 180, 220, 250, 300, 350, 450], multiplicadores: [20, 15, 10, 8, 7, 6, 5, 4, 3, 2] },
  "Reino Unido": { limites: [60, 100, 150, 180, 220, 250, 300, 350, 450], multiplicadores: [20, 15, 10, 8, 7, 6, 5, 4, 3, 2] },
  "Australia": { limites: [60, 100, 150, 180, 220, 250, 300, 350, 450], multiplicadores: [20, 15, 10, 8, 7, 6, 5, 4, 3, 2] },
  "Nueva Zelanda": { limites: [60, 100, 150, 180, 220, 250, 300, 350, 450], multiplicadores: [20, 15, 10, 8, 7, 6, 5, 4, 3, 2] },
  "Sudáfrica": { limites: [60, 100, 150, 180, 220, 250, 300, 350, 450], multiplicadores: [20, 15, 10, 8, 7, 6, 5, 4, 3, 2] },
  "Irlanda": { limites: [60, 100, 150, 180, 220, 250, 300, 350, 450], multiplicadores: [20, 15, 10, 8, 7, 6, 5, 4, 3, 2] },
  "México": { limites: [50, 85, 100, 140, 175, 225, 300, 400], multiplicadores: [20, 15, 12, 8, 7, 5, 4, 3, 2] },
  "Brasil": { limites: [60, 75, 100, 120, 150, 200, 250, 300, 400], multiplicadores: [20, 15, 12, 10, 8, 6, 5, 4, 3, 2] },
  "Alemania": { limites: [70, 100, 135, 170, 200, 250, 300, 350, 400], multiplicadores: [20, 15, 10, 8, 7, 6, 5, 4, 3, 2] },
  "Francia": { limites: [70, 100, 135, 170, 200, 250, 300, 350, 400], multiplicadores: [20, 15, 10, 8, 7, 6, 5, 4, 3, 2] },
  "Dinamarca": { limites: [70, 100, 135, 170, 200, 250, 300, 350, 400], multiplicadores: [20, 15, 10, 8, 7, 6, 5, 4, 3, 2] },
  "Países Bajos": { limites: [70, 100, 135, 170, 200, 250, 300, 350, 400], multiplicadores: [20, 15, 10, 8, 7, 6, 5, 4, 3, 2] },
  "España": { limites: [70, 100, 135, 170, 200, 250, 300, 350, 400], multiplicadores: [20, 15, 10, 8, 7, 6, 5, 4, 3, 2] },
  "Italia": { limites: [70, 100, 135, 170, 200, 250, 300, 350, 400], multiplicadores: [20, 15, 10, 8, 7, 6, 5, 4, 3, 2] },
  "Portugal": { limites: [70, 100, 135, 170, 200, 250, 300, 350, 400], multiplicadores: [20, 15, 10, 8, 7, 6, 5, 4, 3, 2] },
  "Corea del Sur": { limites: [50, 70, 105, 130, 150, 175, 200, 225, 300], multiplicadores: [20, 15, 12, 8, 7, 6, 5, 4, 3, 2] },
  "Japón": { limites: [50, 70, 105, 130, 150, 175, 200, 225, 300], multiplicadores: [20, 15, 12, 8, 7, 6, 5, 4, 3, 2] },
  "Singapur": { limites: [50, 70, 105, 130, 150, 175, 200, 225, 300], multiplicadores: [20, 15, 12, 8, 7, 6, 5, 4, 3, 2] },
  "Emiratos Árabes Unidos": { limites: [50, 70, 105, 130, 150, 175, 200, 225, 300], multiplicadores: [20, 15, 12, 8, 7, 6, 5, 4, 3, 2] },
  "Suiza": { limites: [50, 70, 105, 130, 150, 175, 200, 225, 300], multiplicadores: [20, 15, 12, 8, 7, 6, 5, 4, 3, 2] },
  "Suecia": { limites: [30, 50, 70, 105, 130, 150, 250, 300, 400], multiplicadores: [15, 12, 8, 5, 4, 3, 2, 2, 2, 2] },
  "Finlandia": { limites: [30, 50, 70, 105, 130, 150, 250, 300, 400], multiplicadores: [15, 12, 8, 5, 4, 3, 2, 2, 2, 2] },
  "Austria": { limites: [30, 50, 70, 105, 130, 150, 250, 300, 400], multiplicadores: [15, 12, 8, 5, 4, 3, 2, 2, 2, 2] },
  "Taiwán": { limites: [30, 50, 70, 105, 130, 150, 250, 300, 400], multiplicadores: [15, 12, 8, 5, 4, 3, 2, 2, 2, 2] },
  "Noruega": { limites: [30, 50, 70, 105, 130, 150, 250, 300, 400], multiplicadores: [15, 12, 8, 5, 4, 3, 2, 2, 2, 2] },
  "Bélgica": { limites: [30, 50, 70, 105, 130, 150, 250, 300, 400], multiplicadores: [15, 12, 8, 5, 4, 3, 2, 2, 2, 2] },
  "Tailandia": { limites: [30, 50, 70, 105, 130, 150, 250, 300, 400], multiplicadores: [8, 6, 4, 3, 2, 2, 2, 2, 2, 2] },
  "Eslovaquia": { limites: [30, 50, 70, 105, 130, 150, 250, 300, 400], multiplicadores: [8, 6, 4, 3, 2, 2, 2, 2, 2, 2] },
  "Polonia": { limites: [30, 50, 70, 105, 130, 150, 250, 300, 400], multiplicadores: [8, 6, 4, 3, 2, 2, 2, 2, 2, 2] },
  "Filipinas": { limites: [30, 50, 70, 105, 130, 150, 250, 300, 400], multiplicadores: [8, 6, 4, 3, 2, 2, 2, 2, 2, 2] },
  "Internacional (Resto del Mundo)": {
    limites: [30, 55, 80, 105, 140, 200, 300, 450, 650, 900, 1500],
    multiplicadores: [20, 15, 10, 8, 7, 6, 5, 4, 3, 2, 2],
  },
};

// AB por cada anuncio/20min: USA=2, Resto del Mundo=1
export const AB_POR_ANUNCIO: Record<string, number> = {
  "Estados Unidos": 2,
  "Internacional (Resto del Mundo)": 1,
};
export const AB_POR_ANUNCIO_DEFAULT = 1;

export const MAP_MONEDAS: Record<string, string> = {
  "Estados Unidos": "USD",
  "Canadá": "CAD",
  "Reino Unido": "GBP",
  "Australia": "AUD",
  "Nueva Zelanda": "NZD",
  "Sudáfrica": "ZAR",
  "Irlanda": "EUR",
  "México": "MXN",
  "Alemania": "EUR",
  "Francia": "EUR",
  "España": "EUR",
  "Italia": "EUR",
  "Japón": "USD",
  "Brasil": "BRL",
  "Internacional (Resto del Mundo)": "USD",
};

export const PAISES_DISPONIBLES = Object.keys(TIERS_COMPLETOS);
export const MONEDAS_DISPONIBLES = ["USD", "MXN", "CAD", "GBP", "AUD", "NZD", "ZAR", "EUR", "BRL"];

// ---------------------------------------------------------------------------
// MOTOR ATLAS EARTH
// ---------------------------------------------------------------------------
export class MotorAtlasEarth {
  parcelas: { c: number; r: number; e: number; l: number };
  total_parcelas: number;
  pasaporte_mult: number;
  horas_boost: number;
  eficiencia: number;
  renta_base: number;
  renta_promedio_sec = 0.00000000158;

  constructor(c: number, r: number, e: number, l: number, pasaporte: number, horas_boost: number, eficiencia: number) {
    this.parcelas = { c, r, e, l };
    this.total_parcelas = c + r + e + l;
    if (this.total_parcelas === 0) this.total_parcelas = 1;
    this.pasaporte_mult = 1 + pasaporte * 0.05;
    this.horas_boost = horas_boost;
    this.eficiencia = eficiencia / 100;
    this.renta_base = c * 0.0000000011 + r * 0.0000000016 + e * 0.0000000022 + l * 0.0000000044;
  }

  _get_tier_mult(parcelas: number, pais: string, tiers_dict: TiersDict): number {
    const tabla = tiers_dict[pais] || tiers_dict["Estados Unidos"];
    for (let i = 0; i < tabla.limites.length; i++) {
      if (parcelas <= tabla.limites[i]) return tabla.multiplicadores[i];
    }
    return tabla.multiplicadores[tabla.multiplicadores.length - 1];
  }

  /** Renta generada en un día normal (24h) sin evento SRB */
  calcular_renta_diaria_normal(boost_tier: number): number {
    const horas_con_boost = this.horas_boost * this.eficiencia;
    const horas_sin_boost = Math.max(0, 24 - horas_con_boost);
    const ingreso_boost = this.renta_base * 3600 * horas_con_boost * boost_tier;
    const ingreso_sin_boost = this.renta_base * 3600 * horas_sin_boost * 1;
    return (ingreso_boost + ingreso_sin_boost) * this.pasaporte_mult;
  }

  /** Renta generada en un día completo durante evento SRB (50x boost todo el día) */
  calcular_renta_srb_diaria(): number {
    const horas_con_boost = this.horas_boost * this.eficiencia;
    const horas_sin_boost = Math.max(0, 24 - horas_con_boost);
    const ingreso_srb = this.renta_base * 3600 * horas_con_boost * 50;
    const ingreso_sin_boost = this.renta_base * 3600 * horas_sin_boost * 1;
    return (ingreso_srb + ingreso_sin_boost) * this.pasaporte_mult;
  }

  /** Renta mensual realista (720h) combinando horas normales con horas de evento SRB */
  calcular_renta_mensual(boost_tier: number, horas_srb_mes = 64): number {
    const horas_mes = 720;
    const horas_normales_mes = Math.max(0, horas_mes - horas_srb_mes);
    const pct_boost = (this.horas_boost / 24) * this.eficiencia;
    const horas_con_boost = horas_normales_mes * pct_boost;
    const horas_sin_boost = Math.max(0, horas_normales_mes - horas_con_boost);
    const ingreso_srb = this.renta_base * 3600 * horas_srb_mes * 50;
    const ingreso_boost = this.renta_base * 3600 * horas_con_boost * boost_tier;
    const ingreso_sin_boost = this.renta_base * 3600 * horas_sin_boost * 1;
    return (ingreso_srb + ingreso_boost + ingreso_sin_boost) * this.pasaporte_mult;
  }

  /**
   * Cálculo de renta. Si horas_srb_mes == 0, devuelve la renta diaria habitual normal.
   * Si horas_srb_mes > 0, devuelve el promedio diario mensual ponderado con SRB.
   */
  calcular_renta(boost_tier: number, horas_srb_mes = 0): number {
    if (horas_srb_mes === 0) {
      return this.calcular_renta_diaria_normal(boost_tier);
    }
    return this.calcular_renta_mensual(boost_tier, horas_srb_mes) / 30;
  }

  calcular_renta_generica(num_parcelas: number, pais: string, tiers_dict: TiersDict, horas_srb_mes = 0): number {
    const boost_tier = this._get_tier_mult(num_parcelas, pais, tiers_dict);
    const base_rent = num_parcelas * this.renta_promedio_sec;
    if (horas_srb_mes === 0) {
      const horas_con_boost = this.horas_boost * this.eficiencia;
      const horas_sin_boost = Math.max(0, 24 - horas_con_boost);
      const ingreso_boost = base_rent * 3600 * horas_con_boost * boost_tier;
      const ingreso_sin_boost = base_rent * 3600 * horas_sin_boost * 1;
      return (ingreso_boost + ingreso_sin_boost) * this.pasaporte_mult;
    }
    const horas_mes = 720;
    const horas_normales_mes = Math.max(0, horas_mes - horas_srb_mes);
    const porcentaje_boost = (this.horas_boost / 24) * this.eficiencia;
    const horas_con_boost = horas_normales_mes * porcentaje_boost;
    const horas_sin_boost = Math.max(0, horas_normales_mes - horas_con_boost);
    const ingreso_srb = base_rent * 3600 * horas_srb_mes * 50;
    const ingreso_boost = base_rent * 3600 * horas_con_boost * boost_tier;
    const ingreso_sin_boost = base_rent * 3600 * horas_sin_boost * 1;
    const renta_mensual = (ingreso_srb + ingreso_boost + ingreso_sin_boost) * this.pasaporte_mult;
    return renta_mensual / 30;
  }

  calcular_escalera(pais: string, tiers_dict: TiersDict): EscaleraResult {
    const tabla = tiers_dict[pais] || tiers_dict["Estados Unidos"];
    const limites = tabla.limites;
    let tramo_actual = limites[limites.length - 1];
    let siguiente_tramo = limites[limites.length - 1];
    for (let i = 0; i < limites.length; i++) {
      if (this.total_parcelas <= limites[i]) {
        tramo_actual = limites[i];
        if (i + 1 < limites.length) {
          siguiente_tramo = limites[i + 1];
        } else {
          siguiente_tramo = limites[i];
        }
        break;
      }
    }
    const faltantes = siguiente_tramo > this.total_parcelas ? siguiente_tramo - this.total_parcelas : 0;
    return { tramo_actual, siguiente_tramo, faltantes };
  }

  calcular_meta_automatica(meta_usd_dia: number, pais: string, tiers_dict: TiersDict, horas_srb_mes: number): MetaResult {
    if (meta_usd_dia <= 0) return { p_test: this.total_parcelas, renta_test: 0 };
    let low = this.total_parcelas;
    let high = 500000;

    if (this.calcular_renta_generica(low, pais, tiers_dict, horas_srb_mes) >= meta_usd_dia) {
      return { p_test: low, renta_test: this.calcular_renta_generica(low, pais, tiers_dict, horas_srb_mes) };
    }

    let ans = high;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const renta_mid = this.calcular_renta_generica(mid, pais, tiers_dict, horas_srb_mes);
      if (renta_mid >= meta_usd_dia) {
        ans = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    const renta_test = this.calcular_renta_generica(ans, pais, tiers_dict, horas_srb_mes);
    return { p_test: ans, renta_test };
  }

  formato_tiempo_exacto(dias_totales: number): string {
    if (dias_totales <= 0) return "Meta alcanzada";
    if (!isFinite(dias_totales)) return "Infinito";
    const anios = Math.floor(dias_totales / 365.25);
    const dias_rest = dias_totales % 365.25;
    const meses = Math.floor(dias_rest / 30.43);
    const dias_final = Math.round(dias_rest % 30.43);
    const partes: string[] = [];
    if (anios === 1) partes.push("1 Año");
    else if (anios > 1) partes.push(`${anios} Años`);
    if (meses === 1) partes.push("1 Mes");
    else if (meses > 1) partes.push(`${meses} Meses`);
    if (dias_final === 1) partes.push("1 Día");
    else if (dias_final > 1 || partes.length === 0) partes.push(`${dias_final} Días`);
    return partes.join(", ");
  }

  formato_tiempo(ab_faltantes: number, ab_diarios: number): string {
    if (ab_faltantes <= 0) return "Meta alcanzada";
    if (ab_diarios <= 0) return "Infinito";
    return this.formato_tiempo_exacto(ab_faltantes / ab_diarios);
  }

  dias_para_meta(meta: number, renta_diaria: number): number {
    return renta_diaria > 0 ? meta / renta_diaria : 999;
  }
}

// ---------------------------------------------------------------------------
// COSTO DE PARCELAS — Atlas Earth Real (100 AB constantes por parcela)
// ---------------------------------------------------------------------------
export const AB_POR_PARCELA = 100;
export const AB_INICIAL_PARCELA = 100;
export const INCREMENTO_AB_CADA = 0; // En Atlas Earth real no hay incremento

/** Costo en AB de cualquier parcela de tierra estándar en Atlas Earth (siempre 100 AB). */
export function costoParcela(_n?: number): number {
  void _n;
  return AB_POR_PARCELA;
}

/** Costo TOTAL en AB para comprar las parcelas entre parcelasActuales y parcelasObjetivo. */
export function costoTramoParcelas(parcelasActuales: number, parcelasObjetivo: number): number {
  if (parcelasObjetivo <= parcelasActuales) return 0;
  return (parcelasObjetivo - parcelasActuales) * AB_POR_PARCELA;
}

/** Costo restante real para la meta, descontando AB ahorrados. */
export function costoMetaAbReal(
  parcelasActuales: number,
  parcelasObjetivo: number,
  abAhorrados: number,
): number {
  return Math.max(0, costoTramoParcelas(parcelasActuales, parcelasObjetivo) - abAhorrados);
}

// ---------------------------------------------------------------------------
// TABLA DE SALTOS DE TIER — análisis detallado hasta la meta
// ---------------------------------------------------------------------------
export interface SaltoTier {
  /** Límite de parcelas del salto (el tramo al que se llega) */
  tramo: number;
  /** Multiplicador ANTES del salto (el actual del tramo previo) */
  mult_antes: number;
  /** Multiplicador DESPUÉS del salto */
  mult_despues: number;
  /** Parcelas que faltan desde la posición actual */
  faltan_parcelas: number;
  /** AB necesarios para llegar desde la posición actual */
  ab_necesarios: number;
  /** AB necesarios netos (descontando ahorrados) */
  ab_netos: number;
  /** Días F2P con el AB/día actual */
  dias_f2p: number;
  /** Días con Explorer Club */
  dias_ec: number;
  /** Incremento de renta estimado al saltar */
  renta_estimada: number;
}

/**
 * Genera TODOS los saltos de Tier desde la posición actual hasta la meta,
 * con el costo oficial (100 AB/parcela) y los días estimados por AB/día.
 */
export function generarSaltosTier(
  parcelasActuales: number,
  pais: string,
  tiers: TiersDict,
  abAhorrados: number,
  abDiaF2p: number,
  abDiaEc: number,
  horasBoost: number,
  eficiencia: number,
  horasSrb: number,
  pasaporte: number,
  rentaBaseSec: number,
  parcelasObjetivo: number,
): SaltoTier[] {
  const tabla = tiers[pais] || tiers["Estados Unidos"];
  const limites = tabla.limites;
  const muls = tabla.multiplicadores;

  const saltos: SaltoTier[] = [];
  let prevMult = muls[0];

  for (let i = 0; i < limites.length; i++) {
    if (parcelasActuales <= limites[i]) { prevMult = muls[i]; break; }
    prevMult = muls[i];
  }

  for (let i = 0; i < limites.length; i++) {
    const limite = limites[i];
    if (limite <= parcelasActuales) continue;
    if (parcelasObjetivo > 0 && limite > parcelasObjetivo) break;

    const mult_antes = prevMult;
    const mult_despues = muls[Math.min(i, muls.length - 1)] ?? prevMult;
    const faltan_parcelas = limite - parcelasActuales;
    const ab_necesarios = faltan_parcelas * AB_POR_PARCELA;
    const ab_netos = Math.max(0, ab_necesarios - abAhorrados);
    const dias_f2p = abDiaF2p > 0 ? ab_netos / abDiaF2p : 0;
    const dias_ec = abDiaEc > 0 ? ab_netos / abDiaEc : dias_f2p;

    const baseRent = rentaBaseSec * limite;
    const horasMes = 720;
    const horasNormales = Math.max(0, horasMes - horasSrb);
    const pctBoost = (horasBoost / 24) * (eficiencia / 100);
    const horasConBoost = horasNormales * pctBoost;
    const horasSinBoost = Math.max(0, horasNormales - horasConBoost);
    const ingSrb = baseRent * 3600 * horasSrb * 50;
    const ingBoost = baseRent * 3600 * horasConBoost * mult_despues;
    const ingSin = baseRent * 3600 * horasSinBoost * 1;
    const rentaEstimada = ((ingSrb + ingBoost + ingSin) * (1 + pasaporte * 0.05)) / 30;

    saltos.push({
      tramo: limite,
      mult_antes,
      mult_despues,
      faltan_parcelas,
      ab_necesarios,
      ab_netos,
      dias_f2p,
      dias_ec,
      renta_estimada: rentaEstimada,
    });

    prevMult = mult_despues;
  }

  return saltos;
}

// ---------------------------------------------------------------------------
// CALENDARIO DE ATLAS EARTH
// ---------------------------------------------------------------------------
export function generarCalendarioAE(): { f2p: number[]; ec: number[] } {
  const f2p = Array(90).fill(1);
  const ec = Array(90).fill(90);
  const hitos: Record<number, { f2p: number; ec: number }> = {
    7: { f2p: 8, ec: 100 },
    14: { f2p: 25, ec: 300 },
    30: { f2p: 50, ec: 500 },
    60: { f2p: 80, ec: 800 },
    90: { f2p: 200, ec: 1200 },
  };
  for (const [dia, rec] of Object.entries(hitos)) {
    const idx = parseInt(dia) - 1;
    f2p[idx] = rec.f2p;
    ec[idx] = rec.ec;
  }
  return { f2p, ec };
}

// ---------------------------------------------------------------------------
// OPTIMIZADOR EXPLORER CLUB
// ---------------------------------------------------------------------------
export function optimizadorExplorerClub(dia_actual: number): OptimizadorECResult {
  const { f2p, ec } = generarCalendarioAE();
  const hoy = new Date();

  const calcularVentana = (inicio: number): VentanaEC => {
    let ab_pase = 0;
    let ab_gratis = 0;
    for (let i = 0; i < 30; i++) {
      const dia_check = (inicio - 1 + i) % 90;
      ab_pase += ec[dia_check] + f2p[dia_check];
      ab_gratis += f2p[dia_check];
    }
    let dia_fin = (inicio + 29) % 90;
    if (dia_fin === 0) dia_fin = 90;
    const dias_espera = inicio >= dia_actual ? inicio - dia_actual : 90 - dia_actual + inicio;
    const fecha_compra = new Date(hoy);
    fecha_compra.setDate(fecha_compra.getDate() + dias_espera);
    return {
      dia_inicio: inicio,
      dia_fin,
      ab_pase,
      ab_gratis,
      neto_ab: ab_pase - ab_gratis,
      dias_espera,
      fecha_compra: fecha_compra.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" }),
    };
  };

  const mes1 = calcularVentana(1);
  const mes2 = calcularVentana(31);
  const mes3 = calcularVentana(61);
  const resultados: VentanaEC[] = [];
  for (let inicio = 1; inicio <= 90; inicio++) resultados.push(calcularVentana(inicio));
  const optimo = resultados.reduce((max, cur) => (cur.neto_ab > max.neto_ab ? cur : max));

  return { mes1, mes2, mes3, optimo };
}

// ---------------------------------------------------------------------------
// TIPOS DEL OPTIMIZADOR
// ---------------------------------------------------------------------------
export interface VentanaEC {
  dia_inicio: number;
  dia_fin: number;
  ab_pase: number;
  ab_gratis: number;
  neto_ab: number;
  dias_espera: number;
  fecha_compra: string;
}

export interface OptimizadorECResult {
  mes1: VentanaEC;
  mes2: VentanaEC;
  mes3: VentanaEC;
  optimo: VentanaEC;
}

// ---------------------------------------------------------------------------
// SIMULADOR DIARIO — FUENTE DE VERDAD DE AB
// ---------------------------------------------------------------------------
export class SimuladorDiario {
  dia_actual: number;
  max_anuncios: number;
  f2p_cal: number[];
  ec_cal: number[];
  /** AB que ganas por cada anuncio/20min. USA=2, Resto=1 */
  ab_por_ad: number;
  /** Eficiencia de anuncios 0-100 */
  eficiencia_anuncios: number;

  constructor(
    dia_actual: number,
    max_anuncios: number,
    ab_por_ad: number,
    eficiencia_anuncios: number,
  ) {
    this.dia_actual = dia_actual;
    this.max_anuncios = max_anuncios;
    this.ab_por_ad = ab_por_ad;
    this.eficiencia_anuncios = eficiencia_anuncios / 100;
    const cal = generarCalendarioAE();
    this.f2p_cal = cal.f2p;
    this.ec_cal = cal.ec;
  }

  /** Obtén el AB efectivo por anuncio después de eficiencia */
  private get abPorAdEfectivo(): number {
    return this.ab_por_ad * this.eficiencia_anuncios;
  }

  simular_mes(modo_ec = false, ab_minijuegos_mes = 0): number {
    return this.simular_mes_desglosado(modo_ec, ab_minijuegos_mes).total_mes;
  }

  simular_mes_desglosado(modo_ec = false, ab_minijuegos_mes = 0): DesgloseMensual {
    // === RULETA ===
    const tiros_dia = modo_ec ? 7 : 5;
    const ruleta_diaria = tiros_dia * 1.7;     // ~1.7 AB/tiro promedio
    const ruleta_mes = ruleta_diaria * 30;

    // === ANUNCIOS CADA 20 MIN ===
    // Esta es la fuente principal: cada 20 min ves un anuncio.
    // USA = 2 AB/anuncio, Resto = 1 AB/anuncio.
    // Ajustado por eficiencia (anuncios fallidos, etc.)
    const anuncios_diarios = this.max_anuncios * this.abPorAdEfectivo;
    const anuncios_mes = anuncios_diarios * 30;

    // === ASISTENCIA (calendario daily login) ===
    let asistencia_mes = 0;
    let pase_mes = 0;
    for (let i = 0; i < 30; i++) {
      const dia_check = (this.dia_actual - 1 + i) % 90;
      asistencia_mes += this.f2p_cal[dia_check];
      if (modo_ec) {
        pase_mes += this.ec_cal[dia_check];
      }
    }

    // === TOTAL ===
    const gran_total = ruleta_mes + anuncios_mes + asistencia_mes + pase_mes + ab_minijuegos_mes;

    return {
      total_mes: gran_total,
      promedio_diario: gran_total / 30,
      ruleta_diaria,
      ruleta_mes,
      anuncios_diarios,
      anuncios_mes,
      ab20min_diario: anuncios_diarios, // mismo valor: el AB20min ES el anuncio
      ab20min_mes: anuncios_mes,        // mismo valor
      asistencia_mes,
      pase_mes,
      minijuegos_mes: ab_minijuegos_mes,
    };
  }
}

// ---------------------------------------------------------------------------
// FUNCIONES DE UTILIDAD
// ---------------------------------------------------------------------------
export function calcularNivelPasaporte(insignias: number): number {
  if (insignias >= 101) return 5;
  if (insignias >= 61) return 4;
  if (insignias >= 31) return 3;
  if (insignias >= 11) return 2;
  if (insignias >= 1) return 1;
  return 0;
}

// ---------------------------------------------------------------------------
// FORMATO NUMÉRICO
// ---------------------------------------------------------------------------
export function fmt(n: number, dec = 4): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  return n.toFixed(dec);
}

export const NIVELES_INSIGNIAS = [0, 1, 11, 31, 61, 101];

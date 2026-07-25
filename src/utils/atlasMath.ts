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

export interface DesgloseMensual {
  total_mes: number;
  promedio_diario: number;
  ruleta_diaria: number;
  anuncios_diarios: number;
  asistencia_mes: number;
  minijuegos_mes: number;
}

// ---------------------------------------------------------------------------
// TIERS COMPLETOS — TODOS LOS PAÍSES DE ATLAS EARTH
// ---------------------------------------------------------------------------
export const TIERS_COMPLETOS: TiersDict = {
  "Estados Unidos": {
    limites: [150, 220, 290, 365, 435, 545, 730, 1095, 1500],
    multiplicadores: [30, 20, 15, 12, 10, 8, 6, 4, 3, 2],
  },
  "Canadá": {
    limites: [60, 110, 160, 210, 280, 400, 600, 900, 1200],
    multiplicadores: [20, 15, 12, 10, 8, 6, 4, 3, 2, 2],
  },
  "Reino Unido": {
    limites: [60, 110, 160, 210, 280, 400, 600, 900, 1200],
    multiplicadores: [20, 15, 12, 10, 8, 6, 4, 3, 2, 2],
  },
  "Australia": {
    limites: [60, 110, 160, 210, 280, 400, 600, 900, 1200],
    multiplicadores: [20, 15, 12, 10, 8, 6, 4, 3, 2, 2],
  },
  "Nueva Zelanda": {
    limites: [60, 110, 160, 210, 280, 400, 600, 900, 1200],
    multiplicadores: [20, 15, 12, 10, 8, 6, 4, 3, 2, 2],
  },
  "Sudáfrica": {
    limites: [60, 110, 160, 210, 280, 400, 600, 900, 1200],
    multiplicadores: [20, 15, 12, 10, 8, 6, 4, 3, 2, 2],
  },
  "Irlanda": {
    limites: [60, 110, 160, 210, 280, 400, 600, 900, 1200],
    multiplicadores: [20, 15, 12, 10, 8, 6, 4, 3, 2, 2],
  },
  "México": {
    limites: [60, 110, 160, 210, 280, 400, 600, 900, 1200],
    multiplicadores: [20, 15, 12, 10, 8, 6, 4, 3, 2, 2],
  },
  "Internacional (Resto del Mundo)": {
    limites: [30, 55, 80, 105, 140, 200, 300, 450, 650, 900, 1500],
    multiplicadores: [20, 15, 12, 10, 8, 6, 4, 3, 2, 2, 2],
  },
};

export const MAP_MONEDAS: Record<string, string> = {
  "Estados Unidos": "USD",
  "Canadá": "CAD",
  "Reino Unido": "GBP",
  "Australia": "AUD",
  "Nueva Zelanda": "NZD",
  "Sudáfrica": "ZAR",
  "Irlanda": "EUR",
  "México": "MXN",
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

  calcular_renta(boost_tier: number, horas_srb_mes = 0): number {
    const horas_mes = 720;
    const horas_normales_mes = horas_mes - horas_srb_mes;
    const porcentaje_boost = this.horas_boost / 24;
    const horas_con_boost = horas_normales_mes * porcentaje_boost * this.eficiencia;
    const horas_sin_boost = horas_normales_mes - horas_con_boost;
    const ingreso_srb = this.renta_base * 3600 * horas_srb_mes * 50;
    const ingreso_boost = this.renta_base * 3600 * horas_con_boost * boost_tier;
    const ingreso_sin_boost = this.renta_base * 3600 * horas_sin_boost * 1;
    const renta_mensual = (ingreso_srb + ingreso_boost + ingreso_sin_boost) * this.pasaporte_mult;
    return renta_mensual / 30;
  }

  calcular_renta_generica(num_parcelas: number, pais: string, tiers_dict: TiersDict, horas_srb_mes = 0): number {
    const boost_tier = this._get_tier_mult(num_parcelas, pais, tiers_dict);
    const base_rent = num_parcelas * this.renta_promedio_sec;
    const horas_mes = 720;
    const horas_normales_mes = horas_mes - horas_srb_mes;
    const porcentaje_boost = this.horas_boost / 24;
    const horas_con_boost = horas_normales_mes * porcentaje_boost * this.eficiencia;
    const horas_sin_boost = horas_normales_mes - horas_con_boost;
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
    let p_test = this.total_parcelas;
    while (p_test < 500000) {
      const renta_test = this.calcular_renta_generica(p_test, pais, tiers_dict, horas_srb_mes);
      if (renta_test >= meta_usd_dia) break;
      p_test += 1;
    }
    const renta_test = this.calcular_renta_generica(p_test, pais, tiers_dict, horas_srb_mes);
    return { p_test, renta_test };
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
// SIMULADOR DIARIO
// ---------------------------------------------------------------------------
export class SimuladorDiario {
  dia_actual: number;
  max_anuncios: number;
  f2p_cal: number[];
  ec_cal: number[];

  constructor(dia_actual: number, max_anuncios: number) {
    this.dia_actual = dia_actual;
    this.max_anuncios = max_anuncios;
    const cal = generarCalendarioAE();
    this.f2p_cal = cal.f2p;
    this.ec_cal = cal.ec;
  }

  simular_mes(modo_ec = false, ab_minijuegos_mes = 0): number {
    return this.simular_mes_desglosado(modo_ec, ab_minijuegos_mes).total_mes;
  }

  simular_mes_desglosado(modo_ec = false, ab_minijuegos_mes = 0): DesgloseMensual {
    const mult_ruleta = modo_ec ? 7 : 5;
    const total_ruleta = mult_ruleta * 1.7 * 30;
    const total_anuncios = this.max_anuncios * 2 * 30;
    let total_asistencia = 0;
    for (let i = 0; i < 30; i++) {
      const dia_check = (this.dia_actual - 1 + i) % 90;
      let ab = this.f2p_cal[dia_check];
      if (modo_ec) ab += this.ec_cal[dia_check];
      total_asistencia += ab;
    }
    const gran_total = total_ruleta + total_anuncios + total_asistencia + ab_minijuegos_mes;
    return {
      total_mes: gran_total,
      promedio_diario: gran_total / 30,
      ruleta_diaria: mult_ruleta * 1.7,
      anuncios_diarios: this.max_anuncios * 2,
      asistencia_mes: total_asistencia,
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

export class EstrategiaPro {
  analizar_compra(parcelas_actuales: number, _meta_parcelas: number): string {
    if (parcelas_actuales < 150) {
      return "Prioridad: Comprar parcelas hasta el Tier de 150 (Multiplicador Máximo).";
    }
    return "Prioridad: Comprar pasaportes para maximizar renta o acumular AB para el siguiente salto de Tier.";
  }
}

// ---------------------------------------------------------------------------
// FORMATO NUMÉRICO
// ---------------------------------------------------------------------------
export function fmt(n: number, dec = 4): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  return n.toFixed(dec);
}

export const NIVELES_INSIGNIAS = [0, 1, 11, 31, 61, 101];

// src/utils/atlasMath.ts

export const FALLBACK_RATES: Record<string, number> = {
  "USD": 1.0, "MXN": 17.54, "CAD": 1.35, "GBP": 0.78, 
  "AUD": 1.50, "NZD": 1.65, "ZAR": 18.5, "EUR": 0.92, "BRL": 5.4
};

export function obtenerTasaCambio(moneda_destino: string): number {
  return FALLBACK_RATES[moneda_destino] || 1.0;
}

export type TiersDict = Record<string, { limites: number[], multiplicadores: number[] }>;

export class MotorAtlasEarth {
  parcelas: { c: number, r: number, e: number, l: number };
  total_parcelas: number;
  pasaporte_mult: number;
  horas_boost: number;
  eficiencia: number;
  renta_base: number;
  renta_promedio_sec: number = 0.00000000158; // Distribución 50/30/15/5

  constructor(c: number, r: number, e: number, l: number, pasaporte: number, horas_boost: number, eficiencia: number) {
    this.parcelas = { c, r, e, l };
    this.total_parcelas = c + r + e + l;
    if (this.total_parcelas === 0) this.total_parcelas = 1;
    this.pasaporte_mult = 1 + (pasaporte * 0.05);
    this.horas_boost = horas_boost;
    this.eficiencia = eficiencia / 100;
    this.renta_base = (c * 0.0000000011 + r * 0.0000000016 + e * 0.0000000022 + l * 0.0000000044);
  }

  _get_tier_mult(parcelas: number, pais: string, tiers_dict: TiersDict): number {
    const tabla = tiers_dict[pais] || tiers_dict["Estados Unidos"];
    for (let i = 0; i < tabla.limites.length; i++) {
      if (parcelas <= tabla.limites[i]) return tabla.multiplicadores[i];
    }
    return tabla.multiplicadores[tabla.multiplicadores.length - 1];
  }

  calcular_renta(boost_tier: number, horas_srb_mes: number = 0): number {
    const horas_mes = 720;
    const horas_normales_mes = horas_mes - horas_srb_mes;
    
    const porcentaje_boost = this.horas_boost / 24.0;
    const horas_con_boost = horas_normales_mes * porcentaje_boost * this.eficiencia;
    const horas_sin_boost = horas_normales_mes - horas_con_boost;
    
    const ingreso_srb = this.renta_base * 3600 * horas_srb_mes * 50;
    const ingreso_boost = this.renta_base * 3600 * horas_con_boost * boost_tier;
    const ingreso_sin_boost = this.renta_base * 3600 * horas_sin_boost * 1;
    
    const renta_mensual = (ingreso_srb + ingreso_boost + ingreso_sin_boost) * this.pasaporte_mult;
    return renta_mensual / 30.0;
  }

  calcular_renta_generica(num_parcelas: number, pais: string, tiers_dict: TiersDict, horas_srb_mes: number = 0): number {
    const boost_tier = this._get_tier_mult(num_parcelas, pais, tiers_dict);
    const base_rent = num_parcelas * this.renta_promedio_sec;
    
    const horas_mes = 720;
    const horas_normales_mes = horas_mes - horas_srb_mes;
    
    const porcentaje_boost = this.horas_boost / 24.0;
    const horas_con_boost = horas_normales_mes * porcentaje_boost * this.eficiencia;
    const horas_sin_boost = horas_normales_mes - horas_con_boost;
    
    const ingreso_srb = base_rent * 3600 * horas_srb_mes * 50;
    const ingreso_boost = base_rent * 3600 * horas_con_boost * boost_tier;
    const ingreso_sin_boost = base_rent * 3600 * horas_sin_boost * 1;
    
    const renta_mensual = (ingreso_srb + ingreso_boost + ingreso_sin_boost) * this.pasaporte_mult;
    return renta_mensual / 30.0;
  }

  calcular_escalera(pais: string, tiers_dict: TiersDict) {
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
}

export function generarCalendarioAE(): { f2p: number[], ec: number[] } {
  const f2p = Array(90).fill(1);
  const ec = Array(90).fill(90);
  
  const hitos: Record<number, {f2p: number, ec: number}> = {
      7: {f2p: 8, ec: 100},
      14: {f2p: 25, ec: 300},
      30: {f2p: 50, ec: 500},
      60: {f2p: 80, ec: 800},
      90: {f2p: 200, ec: 1200}
  };
  
  for (const [dia, recompensa] of Object.entries(hitos)) {
      const idx = parseInt(dia) - 1;
      f2p[idx] = recompensa.f2p;
      ec[idx] = recompensa.ec;
  }
  return { f2p, ec };
}

export function optimizadorExplorerClub(dia_actual: number) {
  const { f2p, ec } = generarCalendarioAE();
  const hoy = new Date();
  
  const calcularVentana = (inicio: number) => {
    let ab_pase = 0;
    let ab_gratis = 0;
    for (let i = 0; i < 30; i++) {
      const dia_check = ((inicio - 1 + i) % 90);
      ab_pase += ec[dia_check] + f2p[dia_check];
      ab_gratis += f2p[dia_check];
    }
    
    let dia_fin = (inicio + 29) % 90;
    if (dia_fin === 0) dia_fin = 90;
    
    let dias_espera = 0;
    if (inicio >= dia_actual) {
        dias_espera = inicio - dia_actual;
    } else {
        dias_espera = (90 - dia_actual) + inicio;
    }
    
    const fecha_compra = new Date(hoy);
    fecha_compra.setDate(fecha_compra.getDate() + dias_espera);
        
    return {
        dia_inicio: inicio,
        dia_fin: dia_fin,
        ab_pase,
        ab_gratis,
        neto_ab: ab_pase - ab_gratis,
        dias_espera,
        fecha_compra: fecha_compra.toLocaleDateString()
    };
  };

  const mes1 = calcularVentana(1);
  const mes2 = calcularVentana(31);
  const mes3 = calcularVentana(61);
  
  const resultados = [];
  for (let inicio = 1; inicio <= 90; inicio++) {
      resultados.push(calcularVentana(inicio));
  }
  
  const optimo = resultados.reduce((max, current) => (current.neto_ab > max.neto_ab) ? current : max, resultados[0]);
  
  return { mes1, mes2, mes3, optimo };
}

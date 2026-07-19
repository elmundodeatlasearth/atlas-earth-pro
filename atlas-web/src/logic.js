// logic.js - Portado desde Python

export const TIERS_MX_BR = [
  { max: 150, mult: 30 }, { max: 220, mult: 20 }, { max: 290, mult: 15 },
  { max: 365, mult: 12 }, { max: 435, mult: 10 }, { max: 505, mult: 8 },
  { max: 575, mult: 7 }, { max: 645, mult: 6 }, { max: 715, mult: 5 },
  { max: 785, mult: 4 }, { max: 855, mult: 3 }, { max: 1500, mult: 2 }
];

export const TIERS_USA = [
  { max: 150, mult: 30 }, { max: 220, mult: 20 }, { max: 290, mult: 15 },
  { max: 365, mult: 12 }, { max: 435, mult: 10 }, { max: 505, mult: 8 },
  { max: 575, mult: 7 }, { max: 645, mult: 6 }, { max: 715, mult: 5 },
  { max: 785, mult: 4 }, { max: 855, mult: 3 }, { max: 1500, mult: 2 }
];

export class SimuladorAtlas {
  constructor(parc_comun, parc_rara, parc_epica, parc_legendaria, hrs_boost = 24, hrs_srb = 0, pais = 'MX', nivel_pasaporte = 0) {
    this.comun = parc_comun;
    this.rara = parc_rara;
    this.epica = parc_epica;
    this.legendaria = parc_legendaria;
    
    this.renta_base = (this.comun * 0.0000000011) + 
                      (this.rara * 0.0000000016) + 
                      (this.epica * 0.0000000022) + 
                      (this.legendaria * 0.0000000044);
                      
    this.renta_promedio_sec = (0.5 * 0.0000000011) + (0.3 * 0.0000000016) + (0.15 * 0.0000000022) + (0.05 * 0.0000000044);
    
    this.hrs_boost = hrs_boost;
    this.hrs_srb = hrs_srb;
    this.pais = pais;
    this.tiers = pais === 'USA' ? TIERS_USA : TIERS_MX_BR;
    
    this.mult_pasaporte = this.obtener_mult_pasaporte(nivel_pasaporte);
  }

  obtener_mult_pasaporte(nivel) {
    const mults = {0: 1.0, 1: 1.05, 2: 1.10, 3: 1.15, 4: 1.20, 5: 1.25};
    return mults[nivel] || 1.0;
  }

  get_tier_mult(parcelas_totales) {
    for (let t of this.tiers) {
      if (parcelas_totales <= t.max) return t.mult;
    }
    return 2;
  }

  calcular_renta_diaria(parcelas_extra = 0) {
    let total_parcelas = this.comun + this.rara + this.epica + this.legendaria + parcelas_extra;
    let base_rent = this.renta_base + (parcelas_extra * this.renta_promedio_sec);
    
    let current_mult = this.get_tier_mult(total_parcelas);
    
    let hrs_srb_dia = this.hrs_srb / 30.0;
    let hrs_boost_normal = Math.max(0, this.hrs_boost - hrs_srb_dia);
    let hrs_sin_boost = Math.max(0, 24 - (hrs_boost_normal + hrs_srb_dia));

    let ingreso_srb = base_rent * 3600 * hrs_srb_dia * 50;
    let ingreso_boost = base_rent * 3600 * hrs_boost_normal * current_mult;
    let ingreso_sin_boost = base_rent * 3600 * hrs_sin_boost * 1;

    let ingreso_total_dia = (ingreso_srb + ingreso_boost + ingreso_sin_boost) * this.mult_pasaporte;
    return ingreso_total_dia;
  }

  simular_hasta_meta(meta_usd_dia) {
    let parcelas_extra = 0;
    let ingreso = this.calcular_renta_diaria(parcelas_extra);
    
    while (ingreso < meta_usd_dia && parcelas_extra < 50000) {
      parcelas_extra += 1;
      ingreso = this.calcular_renta_diaria(parcelas_extra);
    }
    
    return parcelas_extra;
  }
}

export function generarCalendarioAE() {
  let f2p = Array(90).fill(1);
  let ec = Array(90).fill(90);
  let hitos = [7, 14, 30, 60, 90];
  let bonos_f2p = [5, 10, 25, 50, 100];
  let bonos_ec = [150, 300, 500, 800, 1400];
  
  for (let i = 0; i < hitos.length; i++) {
    let idx = hitos[i] - 1;
    f2p[idx] = bonos_f2p[i];
    ec[idx] = bonos_ec[i];
  }
  return { f2p, ec };
}

export function calcularNivelPasaporte(insignias) {
  if (insignias >= 101) return 5;
  if (insignias >= 61) return 4;
  if (insignias >= 31) return 3;
  if (insignias >= 11) return 2;
  if (insignias >= 1) return 1;
  return 0;
}

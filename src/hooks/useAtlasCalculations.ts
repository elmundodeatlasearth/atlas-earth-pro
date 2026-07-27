// src/hooks/useAtlasCalculations.ts
// Hook con todos los cálculos memorizados — UNA SOLA FUENTE DE VERDAD: el SimuladorDiario
"use client";
import { useMemo } from "react";
import {
  MotorAtlasEarth,
  obtenerTasaCambio,
  SimuladorDiario,
  optimizadorExplorerClub,
  calcularNivelPasaporte,
  TIERS_COMPLETOS,
  AB_POR_ANUNCIO,
  AB_POR_ANUNCIO_DEFAULT,
  NIVELES_INSIGNIAS,
  type OptimizadorECResult,
  type DesgloseMensual,
} from "@/utils/atlasMath";
import type { AtlasInputs } from "./useAtlasInputs";

const TIERS = TIERS_COMPLETOS;

export interface AtlasCalculations {
  tasa: number;
  pasaporte: number;
  motor: MotorAtlasEarth;
  multTier: number;
  rentaDia: number; rentaSem: number; rentaMes: number; rentaAnio: number;
  tramo_actual: number; siguiente_tramo: number; faltantesTier: number;
  metaUsdDia: number;
  parcelasMeta: number; metaRenta: number;
  faltantesMeta: number; costoMetaAb: number; costoTiendaUsd: number;

  // === AB: UNA SOLA FUENTE DE VERDAD (desglose del SimuladorDiario) ===
  maxAnuncios: number;
  /** AB/día total F2P (ruleta + anuncios/20min + asistencia + pase escalera) */
  abPorDia: number;
  /** AB/día total EC (ruleta EC + anuncios/20min + asistencia + ec_cal + pase escalera) */
  abEcDiarios: number;
  /** Desglose completo F2P */
  desgloseF2p: DesgloseMensual;
  /** Desglose completo EC */
  desgloseEc: DesgloseMensual;

  simTotal: number; simMult: number; simDia: number; simSem: number; simMes: number; simAnio: number;
  optData: OptimizadorECResult;
  diasFree: number; diasEc2: number; tiempoFree: string; tiempoEc: string;
  balanceAlcanza: number; faltanNetosAb: number; porcentajeEsc: number;
  rentaAdicional: number; roiGlobalDias: number; roiMarginalDias: number;
  nivelActualPasaporte: number; nivelSiguientePasaporte: number;
  insigniasRequeridas: number; insigniasFaltantes: number;
  costoAbPasaporte: number; aumentoPasaporte: number;
  parcelasEq: number; aumentoParcelas: number; colapso: boolean;
  veredictoEstrategia: string;
}

function parseTime(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function useAtlasCalculations(I: AtlasInputs): AtlasCalculations {
  const {
    pais, moneda, horasBoost, eficiencia, horasSrb,
    parcelasC, parcelasR, parcelasE, parcelasL,
    insignias, abAhorrados, tipoPase, diaAsistencia,
    horaInicio, horaFin, eficienciaAnuncios, meta, metaPeriodo, simExtra,
  } = I;

  const tasa = useMemo(() => obtenerTasaCambio(moneda), [moneda]);
  const pasaporte = useMemo(() => calcularNivelPasaporte(insignias), [insignias]);

  const motor = useMemo(
    () => new MotorAtlasEarth(parcelasC, parcelasR, parcelasE, parcelasL, pasaporte, horasBoost, eficiencia),
    [parcelasC, parcelasR, parcelasE, parcelasL, pasaporte, horasBoost, eficiencia]
  );

  const multTier = useMemo(() => motor._get_tier_mult(motor.total_parcelas, pais, TIERS), [motor, pais]);
  const rentaDia = useMemo(() => motor.calcular_renta(multTier, horasSrb), [motor, multTier, horasSrb]);
  const rentaSem = rentaDia * 7;
  const rentaMes = rentaDia * 30;
  const rentaAnio = rentaDia * 365;

  const { tramo_actual, siguiente_tramo, faltantes: faltantesTier } = useMemo(
    () => motor.calcular_escalera(pais, TIERS), [motor, pais]
  );

  const metaUsdDia = useMemo(() => {
    if (metaPeriodo === "month") return meta / 30;
    if (metaPeriodo === "year") return meta / 365;
    return meta;
  }, [meta, metaPeriodo]);

  const { p_test: parcelasMeta, renta_test: metaRenta } = useMemo(
    () => motor.calcular_meta_automatica(metaUsdDia, pais, TIERS, horasSrb),
    [motor, metaUsdDia, pais, horasSrb]
  );
  const faltantesMeta = Math.max(0, parcelasMeta - motor.total_parcelas);
  const costoMetaAb = Math.max(0, faltantesMeta * 100 - abAhorrados);
  const costoTiendaUsd = (costoMetaAb / 2400) * 99.99;

  // === CÁLCULO DE MAX ANUNCIOS (ventana de horas activas) ===
  const inicioMin = parseTime(horaInicio);
  let finMin = parseTime(horaFin);
  if (finMin < inicioMin) finMin += 1440;
  const minutosTotales = finMin - inicioMin;
  const maxAnuncios = Math.max(0, Math.floor(minutosTotales / 20));

  // AB por anuncio según país (USA=2, Resto=1)
  const abPorAnuncio = AB_POR_ANUNCIO[pais] ?? AB_POR_ANUNCIO_DEFAULT;

  // AB extra del pase escalera (anticipada/tardía) — AB directos que otorga el pase
  // Explorer Club: el bonus va en ec_calendario, más la escalera incluida
  const paseEscaleraExtra = tipoPase.includes("Escalera") ? 1034 : 0;

  // === SIMULADOR FUENTE DE VERDAD ===
  const sim = useMemo(
    () => new SimuladorDiario(diaAsistencia, maxAnuncios, abPorAnuncio, eficienciaAnuncios),
    [diaAsistencia, maxAnuncios, abPorAnuncio, eficienciaAnuncios]
  );

  // F2P: 5 tiros ruleta, sin calendario EC, con pase escalera si aplica
  const desgloseF2p = useMemo(
    () => sim.simular_mes_desglosado(false, paseEscaleraExtra),
    [sim, paseEscaleraExtra]
  );

  // EC: 7 tiros ruleta, calendario EC, con pase escalera si aplica
  const desgloseEc = useMemo(
    () => sim.simular_mes_desglosado(true, paseEscaleraExtra),
    [sim, paseEscaleraExtra]
  );

  // === AB POR DÍA — UNIFICADO del desglose ===
  const abPorDia = desgloseF2p.promedio_diario;
  const abEcDiarios = desgloseEc.promedio_diario;

  // === SIMULADOR DE CRECIMIENTO (parcelas extra) ===
  const simTotal = motor.total_parcelas + simExtra;
  const simMult = motor._get_tier_mult(simTotal, pais, TIERS);
  const simMotor = useMemo(
    () => new MotorAtlasEarth(
      parcelasC + Math.floor(simExtra * 0.5),
      parcelasR + Math.floor(simExtra * 0.3),
      parcelasE + Math.floor(simExtra * 0.15),
      parcelasL + simExtra - Math.floor(simExtra * 0.5) - Math.floor(simExtra * 0.3) - Math.floor(simExtra * 0.15),
      pasaporte, horasBoost, eficiencia
    ),
    [parcelasC, parcelasR, parcelasE, parcelasL, simExtra, pasaporte, horasBoost, eficiencia]
  );
  const simDia = simMotor.calcular_renta(simMult, horasSrb);
  const simSem = simDia * 7;
  const simMes = simDia * 30;
  const simAnio = simDia * 365;

  const optData = useMemo(() => optimizadorExplorerClub(diaAsistencia), [diaAsistencia]);

  // Tiempos para la meta — usando AB/día del desglose (fuente de verdad)
  const diasFree = abPorDia > 0 ? costoMetaAb / abPorDia : 0;
  const diasEc2 = abEcDiarios > 0 ? costoMetaAb / abEcDiarios : 0;
  const tiempoFree = motor.formato_tiempo(costoMetaAb, abPorDia);
  const tiempoEc = motor.formato_tiempo(costoMetaAb, abEcDiarios);

  const balanceAlcanza = Math.floor(abAhorrados / 100);
  const faltanNetosAb = Math.max(0, faltantesTier * 100 - abAhorrados);
  const porcentajeEsc = faltantesTier > 0 ? Math.min(100, (abAhorrados / (faltantesTier * 100)) * 100) : 100;

  // ROI
  const rentaAdicional = metaRenta - rentaDia;
  const roiGlobalDias = metaRenta > 0 && costoTiendaUsd > 0 ? costoTiendaUsd / metaRenta : 0;
  const roiMarginalDias = rentaAdicional > 0 && costoTiendaUsd > 0 ? costoTiendaUsd / rentaAdicional : 0;

  // Estrategia Pasaporte vs Parcelas
  const nivelActualPasaporte = pasaporte;
  const nivelSiguientePasaporte = Math.min(nivelActualPasaporte + 1, 5);
  const insigniasRequeridas = NIVELES_INSIGNIAS[nivelSiguientePasaporte] || 101;
  const insigniasFaltantes = Math.max(0, insigniasRequeridas - insignias);
  const costoAbPasaporte = insigniasFaltantes * 200;
  const rentaDiariaBruta = rentaDia / motor.pasaporte_mult;
  const aumentoPasaporte = rentaDiariaBruta * 0.05;
  const parcelasEq = insigniasFaltantes * 2;
  const multParcelasTest = motor._get_tier_mult(motor.total_parcelas + parcelasEq, pais, TIERS);
  const baseRentParcelas = motor.renta_base + parcelasEq * motor.renta_promedio_sec;
  const horasMes = 720;
  const horasNormalesMes = horasMes - horasSrb;
  const pctBoost = horasBoost / 24;
  const horasConBoost = horasNormalesMes * pctBoost * (eficiencia / 100);
  const horasSinBoost = horasNormalesMes - horasConBoost;
  const ingSrbP = baseRentParcelas * 3600 * horasSrb * 50;
  const ingBoostP = baseRentParcelas * 3600 * horasConBoost * multParcelasTest;
  const ingSinP = baseRentParcelas * 3600 * horasSinBoost * 1;
  const rentaFuturaParcelas = ((ingSrbP + ingBoostP + ingSinP) * motor.pasaporte_mult) / 30;
  const aumentoParcelas = rentaFuturaParcelas - rentaDia;
  const colapso = motor.total_parcelas + balanceAlcanza > tramo_actual && faltanNetosAb > 0;

  const veredictoEstrategia = useMemo(() => {
    if (colapso) {
      return `⚠️ ZONA DE RIESGO: Estás en el límite del Tier (${motor.total_parcelas} parcelas). No compres parcelas individuales. Ahorra ${faltanNetosAb.toLocaleString()} AB para saltar a ${siguiente_tramo}.`;
    }
    if (nivelActualPasaporte < 5 && aumentoPasaporte > aumentoParcelas && insigniasFaltantes > 0) {
      return `✅ Compra ${insigniasFaltantes} insignias para subir a Nivel ${nivelSiguientePasaporte}. Te dará +$${aumentoPasaporte.toFixed(5)}/día.`;
    }
    if (faltantesTier > 0) {
      return `✅ Sigue comprando parcelas. Faltan ${faltantesTier} para el siguiente Tier.`;
    }
    return "✅ Todo en orden. Sigue acumulando.";
  }, [colapso, motor.total_parcelas, faltanNetosAb, siguiente_tramo, nivelActualPasaporte,
      aumentoPasaporte, aumentoParcelas, insigniasFaltantes, nivelSiguientePasaporte, faltantesTier]);

  return {
    tasa, pasaporte, motor, multTier,
    rentaDia, rentaSem, rentaMes, rentaAnio,
    tramo_actual, siguiente_tramo, faltantesTier,
    metaUsdDia, parcelasMeta, metaRenta,
    faltantesMeta, costoMetaAb, costoTiendaUsd,
    maxAnuncios, abPorDia, abEcDiarios,
    desgloseF2p, desgloseEc, optData,
    simTotal, simMult, simDia, simSem, simMes, simAnio,
    diasFree, diasEc2, tiempoFree, tiempoEc,
    balanceAlcanza, faltanNetosAb, porcentajeEsc,
    rentaAdicional, roiGlobalDias, roiMarginalDias,
    nivelActualPasaporte, nivelSiguientePasaporte,
    insigniasRequeridas, insigniasFaltantes, costoAbPasaporte, aumentoPasaporte,
    parcelasEq, aumentoParcelas, colapso, veredictoEstrategia,
  };
}

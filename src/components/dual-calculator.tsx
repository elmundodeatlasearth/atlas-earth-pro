// src/components/dual-calculator.tsx
// Calculadora Dual perfeccionada:
//   CALCULADORA 1 → Lo que tengo + cuánto genero HOY
//   CALCULADORA 2 → Tres escenarios para alcanzar mi objetivo en USD/día:
//       A) Solo comprando Parcelas
//       B) Solo comprando Insignias (mejora de pasaporte)
//       C) Comprando ambas (Parcelas + Insignias) — Optimal
"use client";
import React, { useState, useMemo, useCallback } from "react";
import { GlowCard } from "./stat-card";
import {
  fmt,
  proyectarFechaMeta,
  calcularNivelPasaporte,
  TIERS_COMPLETOS,
  type MotorAtlasEarth,
} from "@/utils/atlasMath";

interface DualCalculatorProps {
  totalParcelas: number;
  parcelasC: number;
  parcelasR: number;
  parcelasE: number;
  parcelasL: number;
  insigniasActuales: number;
  abAhorrados: number;
  multTier: number;
  motor: MotorAtlasEarth;
  pais: string;
  abPorDia?: number;       // AB/día F2P (sin pase)
  abEcDiarios?: number;    // AB/día con Explorer Club
  horasSrb?: number;
  siguienteTramo?: number;
  metaUsdDiaInicial?: number;
}

type EscenarioKey = "parcelas" | "insignias" | "ambos";

interface Escenario {
  label: string;
  emoji: string;
  descripcion: string;
  color: string;
  borderColor: string;
  textColor: string;
}

const ESCENARIOS: Record<EscenarioKey, Escenario> = {
  parcelas: {
    label: "Solo Parcelas",
    emoji: "🏞️",
    descripcion: "Alcanza tu meta solo comprando más terreno, sin cambiar tus insignias",
    color: "bg-cyan-600",
    borderColor: "border-cyan-500/30",
    textColor: "text-cyan-400",
  },
  insignias: {
    label: "Solo Insignias",
    emoji: "🏅",
    descripcion: "Mejora el multiplicador de tu pasaporte comprando únicamente insignias",
    color: "bg-amber-600",
    borderColor: "border-amber-500/30",
    textColor: "text-amber-400",
  },
  ambos: {
    label: "Parcelas + Insignias",
    emoji: "⚡",
    descripcion: "La ruta más eficiente: combina parcelas e insignias para llegar antes",
    color: "bg-purple-600",
    borderColor: "border-purple-500/30",
    textColor: "text-purple-400",
  },
};

export default function DualCalculator({
  totalParcelas,
  parcelasC,
  parcelasR,
  parcelasE,
  parcelasL,
  insigniasActuales,
  abAhorrados,
  multTier,
  motor,
  pais,
  abPorDia = 22,
  abEcDiarios = 122.6,
  horasSrb = 64,
  siguienteTramo = 545,
  metaUsdDiaInicial = 1.0,
}: DualCalculatorProps) {
  // === ESTADO ===
  const [objetivoUsd, setObjetivoUsd] = useState<number>(metaUsdDiaInicial > 0 ? metaUsdDiaInicial : 1.0);
  const [modoBoost, setModoBoost] = useState<"24_7" | "22h">("24_7");
  const [escenario, setEscenario] = useState<EscenarioKey>("ambos");

  // Controles manuales (para jugar con las cifras)
  const [manualParcelas, setManualParcelas] = useState<number | null>(null);
  const [manualInsignias, setManualInsignias] = useState<number | null>(null);

  // ─── CALC BASE ────────────────────────────────────────────────────────────
  const pasaporteNivelActual = calcularNivelPasaporte(insigniasActuales);
  const pasaporteMultActual = 1 + pasaporteNivelActual * 0.05;
  const baseSecActual = motor.renta_base;

  const calc24h = useCallback((baseSec: number, mult: number, passMult: number) =>
    baseSec * 86400 * mult * passMult, []);
  const calc22h = useCallback((baseSec: number, mult: number, passMult: number) =>
    (baseSec * 79200 * mult + baseSec * 7200) * passMult, []);
  const calcPromSrb = useCallback((baseSec: number, mult: number, passMult: number, hrs: number) => {
    const hMes = 720;
    const hNorm = Math.max(0, hMes - hrs);
    const pctBoost = modoBoost === "24_7" ? 1 : 22 / 24;
    const hBoost = hNorm * pctBoost;
    const hSin = Math.max(0, hNorm - hBoost);
    return (baseSec * 3600 * hrs * 50 + baseSec * 3600 * hBoost * mult + baseSec * 3600 * hSin) * passMult / 30;
  }, [modoBoost]);

  const rentaActual24 = calc24h(baseSecActual, multTier, pasaporteMultActual);
  const rentaActual22 = calc22h(baseSecActual, multTier, pasaporteMultActual);
  const rentaActualSrb = calcPromSrb(baseSecActual, multTier, pasaporteMultActual, horasSrb);
  const rentaActivaActual = modoBoost === "24_7" ? rentaActual24 : rentaActual22;

  // ─── SOLVER: parcelas necesarias para lograr targetUsd con N insignias ────
  const solverParcelas = useCallback((
    targetUsd: number,
    targetInsignias: number,
    boost: "24_7" | "22h"
  ): { parcelas: number; renta: number; mult: number } => {
    const nivel = calcularNivelPasaporte(targetInsignias);
    const passMult = 1 + nivel * 0.05;

    const evalRenta = (p: number): number => {
      const mult = motor._get_tier_mult(p, pais, TIERS_COMPLETOS);
      let base = motor.renta_base;
      if (p > totalParcelas) base += (p - totalParcelas) * 1.58e-9;
      else if (p < totalParcelas) base = p * motor.renta_promedio_sec;
      return boost === "24_7"
        ? calc24h(base, mult, passMult)
        : calc22h(base, mult, passMult);
    };

    // Ya alcanza la meta con las parcelas actuales
    if (evalRenta(totalParcelas) >= targetUsd) {
      return { parcelas: totalParcelas, renta: evalRenta(totalParcelas), mult: multTier };
    }

    const tabla = TIERS_COMPLETOS[pais] || TIERS_COMPLETOS["Estados Unidos"];
    const limites = tabla.limites;
    const segments: Array<[number, number]> = [];
    let segStart = totalParcelas;
    for (const lim of limites) {
      if (lim >= segStart) { segments.push([segStart, lim]); segStart = lim + 1; }
    }
    segments.push([segStart, 200000]);

    let bestP = 200000;
    for (const [segLo, segHi] of segments) {
      if (evalRenta(segHi) < targetUsd) continue;
      let lo = segLo, hi = segHi, ans = segHi;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (evalRenta(mid) >= targetUsd) { ans = mid; hi = mid - 1; } else lo = mid + 1;
      }
      bestP = ans;
      break;
    }
    return { parcelas: bestP, renta: evalRenta(bestP), mult: motor._get_tier_mult(bestP, pais, TIERS_COMPLETOS) };
  }, [motor, pais, totalParcelas, multTier, calc24h, calc22h]);

  // ─── SOLVER: insignias máximas que se pueden comprar para ganar máximo boost ─
  // El pasaporte tiene 5 niveles: 1→11→31→61→101 insignias, +5% cada nivel
  // Nivel max = 5 (+25%). Solo tiene efecto real hasta 101 insignias.
  const PASAPORTE_MAXIMA = 101;

  // ─── CALCULO DE LOS 3 ESCENARIOS ─────────────────────────────────────────
  const escenarioResultados = useMemo(() => {
    // ── A) SOLO PARCELAS (mantiene insignias actuales) ──
    const soloParcelasCalc = solverParcelas(objetivoUsd, insigniasActuales, modoBoost);
    const soloParcelasFaltan = Math.max(0, soloParcelasCalc.parcelas - totalParcelas);
    const soloParcelasAB = soloParcelasFaltan * 100;
    const soloParcelasAbNeto = Math.max(0, soloParcelasAB - abAhorrados);

    // ── B) SOLO INSIGNIAS (mantiene parcelas actuales, mejora pasaporte) ──
    // Calcular qué pasaporte es necesario para alcanzar la meta con las parcelas actuales
    let insigniasNecesarias = PASAPORTE_MAXIMA;
    let logradoConInsignias = false;
    for (const numInsignias of [1, 11, 31, 61, 101]) {
      if (numInsignias < insigniasActuales) continue;
      const nivel = calcularNivelPasaporte(numInsignias);
      const passMult = 1 + nivel * 0.05;
      const renta = modoBoost === "24_7"
        ? calc24h(baseSecActual, multTier, passMult)
        : calc22h(baseSecActual, multTier, passMult);
      if (renta >= objetivoUsd) {
        insigniasNecesarias = numInsignias;
        logradoConInsignias = true;
        break;
      }
    }
    const soloInsigniasFaltan = Math.max(0, insigniasNecesarias - insigniasActuales);
    const soloInsigniasAB = soloInsigniasFaltan * 200;
    const soloInsigniasAbNeto = Math.max(0, soloInsigniasAB - abAhorrados);
    // Renta que se lograría comprando solo las insignias necesarias
    const nivelConInsignias = calcularNivelPasaporte(Math.max(insigniasActuales, insigniasNecesarias));
    const passMultConInsignias = 1 + nivelConInsignias * 0.05;
    const rentaConSoloInsignias = modoBoost === "24_7"
      ? calc24h(baseSecActual, multTier, passMultConInsignias)
      : calc22h(baseSecActual, multTier, passMultConInsignias);

    // ── C) AMBOS: Primero se usan las insignias para obtener el mejor pasaporte posible,
    //     luego se calcula cuántas parcelas se necesitan con ese pasaporte ──
    const insigniasMejora = Math.max(insigniasActuales, PASAPORTE_MAXIMA);
    const ambosCalc = solverParcelas(objetivoUsd, insigniasMejora, modoBoost);
    const ambosInsigniasFaltan = Math.max(0, insigniasMejora - insigniasActuales);
    const ambosParcelasFaltan = Math.max(0, ambosCalc.parcelas - totalParcelas);
    const ambosABInsignias = ambosInsigniasFaltan * 200;
    const ambosABParcelas = ambosParcelasFaltan * 100;
    const ambosABTotal = ambosABInsignias + ambosABParcelas;
    const ambosAbNeto = Math.max(0, ambosABTotal - abAhorrados);

    return {
      parcelas: {
        parcelasMeta: soloParcelasCalc.parcelas,
        parcelasFaltan: soloParcelasFaltan,
        insigniasMeta: insigniasActuales,
        insigniasFaltan: 0,
        abParcelas: soloParcelasAB,
        abInsignias: 0,
        abTotal: soloParcelasAB,
        abNeto: soloParcelasAbNeto,
        rentaLograda: soloParcelasCalc.renta,
        multResultante: soloParcelasCalc.mult,
        diasEC: abEcDiarios > 0 ? soloParcelasAbNeto / abEcDiarios : 0,
        diasF2P: abPorDia > 0 ? soloParcelasAbNeto / abPorDia : 0,
      },
      insignias: {
        parcelasMeta: totalParcelas,
        parcelasFaltan: 0,
        insigniasMeta: insigniasNecesarias,
        insigniasFaltan: soloInsigniasFaltan,
        abParcelas: 0,
        abInsignias: soloInsigniasAB,
        abTotal: soloInsigniasAB,
        abNeto: soloInsigniasAbNeto,
        rentaLograda: rentaConSoloInsignias,
        multResultante: multTier,
        posible: logradoConInsignias,
        diasEC: abEcDiarios > 0 ? soloInsigniasAbNeto / abEcDiarios : 0,
        diasF2P: abPorDia > 0 ? soloInsigniasAbNeto / abPorDia : 0,
      },
      ambos: {
        parcelasMeta: ambosCalc.parcelas,
        parcelasFaltan: ambosParcelasFaltan,
        insigniasMeta: insigniasMejora,
        insigniasFaltan: ambosInsigniasFaltan,
        abParcelas: ambosABParcelas,
        abInsignias: ambosABInsignias,
        abTotal: ambosABTotal,
        abNeto: ambosAbNeto,
        rentaLograda: ambosCalc.renta,
        multResultante: ambosCalc.mult,
        diasEC: abEcDiarios > 0 ? ambosAbNeto / abEcDiarios : 0,
        diasF2P: abPorDia > 0 ? ambosAbNeto / abPorDia : 0,
      },
    };
  }, [objetivoUsd, modoBoost, totalParcelas, insigniasActuales, abAhorrados, abPorDia, abEcDiarios,
      multTier, baseSecActual, solverParcelas, calc24h, calc22h]);

  // Escenario activo seleccionado
  const esc = escenarioResultados[escenario];

  // === SANDBOX INTERACTIVO: el usuario puede "jugar con las cifras" ===
  const parcActivas = manualParcelas ?? esc.parcelasMeta;
  const insignActivas = manualInsignias ?? esc.insigniasMeta;
  const sandboxFaltanParcelas = Math.max(0, parcActivas - totalParcelas);
  const sandboxFaltanInsignias = Math.max(0, insignActivas - insigniasActuales);
  const sandboxABParcelas = sandboxFaltanParcelas * 100;
  const sandboxABInsignias = sandboxFaltanInsignias * 200;
  const sandboxABTotal = sandboxABParcelas + sandboxABInsignias;
  const sandboxAbNeto = Math.max(0, sandboxABTotal - abAhorrados);

  const sandboxNuevoPasNivel = calcularNivelPasaporte(Math.max(insigniasActuales, insignActivas));
  const sandboxNuevoPasMult = 1 + sandboxNuevoPasNivel * 0.05;
  const sandboxNuevoMult = motor._get_tier_mult(parcActivas, pais, TIERS_COMPLETOS);
  const sandboxNuevaBase = baseSecActual + sandboxFaltanParcelas * 1.58e-9;
  const sandboxRenta = modoBoost === "24_7"
    ? calc24h(sandboxNuevaBase, sandboxNuevoMult, sandboxNuevoPasMult)
    : calc22h(sandboxNuevaBase, sandboxNuevoMult, sandboxNuevoPasMult);
  const sandboxExtraDia = sandboxRenta - rentaActivaActual;
  const sandboxDiasEC = abEcDiarios > 0 ? sandboxAbNeto / abEcDiarios : 0;
  const sandboxDiasF2P = abPorDia > 0 ? sandboxAbNeto / abPorDia : 0;
  const sandboxPct = objetivoUsd > 0 ? Math.min(999, (sandboxRenta / objetivoUsd) * 100) : 100;

  const esManual = manualParcelas !== null || manualInsignias !== null;
  const resetManual = () => { setManualParcelas(null); setManualInsignias(null); };

  // Presets de dólares con estrella indicando cuál es la meta del usuario
  const presets = [0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 5.0, 10.0];

  return (
    <div className="space-y-5">
      {/* ── ENCABEZADO ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div>
          <div className="text-xs uppercase tracking-widest font-black text-cyan-400 flex items-center gap-2">
            <span className="text-sm">⚖️</span>
            <span>Calculadora Dual — Lo que Tengo vs Lo que Necesito</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Pon tu meta en dólares y elige el escenario. El sistema calcula exactamente cuánto necesitas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">1 Parcela = 100 AB</span>
          <span className="text-[10px] font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">1 Insignia = 200 AB</span>
        </div>
      </div>

      {/* ── GRID PRINCIPAL: 2 COLUMNAS ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ════════════════════════════════════════════════════════════════════
            CALCULADORA 1 — LO QUE TENGO (estado real)
            ════════════════════════════════════════════════════════════════════ */}
        <GlowCard className="border-cyan-500/20 bg-gradient-to-b from-[#0a121e] to-[#070b12] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <span>🟢</span> Calculadora 1 — Tu Estado Actual
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono font-bold">
              {multTier}x Multiplicador
            </span>
          </div>

          {/* Inventario */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
              <div className="text-[10px] text-gray-400 uppercase">🏞️ Parcelas</div>
              <div className="text-xl font-bold font-mono text-white mt-0.5">{totalParcelas.toLocaleString()}</div>
              <div className="text-[9px] text-gray-500">{parcelasC}C · {parcelasR}R · {parcelasE}E · {parcelasL}L</div>
            </div>
            <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
              <div className="text-[10px] text-gray-400 uppercase">🏅 Insignias</div>
              <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">{insigniasActuales}</div>
              <div className="text-[9px] text-gray-500">Pasaporte Nv.{pasaporteNivelActual} (+{pasaporteNivelActual * 5}%) · {pasaporteMultActual}x</div>
            </div>
          </div>

          {/* Saldo AB */}
          <div className="p-2.5 bg-cyan-950/20 border border-cyan-500/20 rounded-xl flex items-center justify-between text-xs">
            <span className="text-gray-300">🪙 Saldo Atlas Bucks:</span>
            <span className="font-mono font-bold text-cyan-300">{abAhorrados.toLocaleString()} AB</span>
          </div>

          {/* Generación real */}
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">💵 Cuánto generas hoy:</div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className={`p-2 rounded-lg border ${modoBoost === "24_7" ? "bg-amber-900/30 border-amber-500/40" : "bg-black/50 border-amber-500/10"}`}>
                <div className="text-[10px] text-amber-400 font-semibold">⚡ Con Explorer Club (24/7)</div>
                <div className="text-base font-bold font-mono text-white mt-0.5">${fmt(rentaActual24, 4)}</div>
                <div className="text-[9px] text-gray-400">USD cada 24h</div>
              </div>
              <div className={`p-2 rounded-lg border ${modoBoost === "22h" ? "bg-cyan-900/30 border-cyan-500/40" : "bg-black/50 border-cyan-500/10"}`}>
                <div className="text-[10px] text-cyan-400 font-semibold">🌙 Modo Normal (22h)</div>
                <div className="text-base font-bold font-mono text-white mt-0.5">${fmt(rentaActual22, 4)}</div>
                <div className="text-[9px] text-gray-400">USD cada 24h</div>
              </div>
            </div>
            <div className="p-2 bg-black/40 rounded-lg border border-white/5 flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">🚀 Promedio mensual con SRB ({horasSrb}h):</span>
              <span className="text-emerald-400 font-bold">${fmt(rentaActualSrb, 4)} USD/día</span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-white/5 text-[10px] text-gray-500 text-center">
            Renta base/segundo: <span className="font-mono text-gray-300">${fmt(baseSecActual, 9)}/s</span>
          </div>
        </GlowCard>

        {/* ════════════════════════════════════════════════════════════════════
            CALCULADORA 2 — LO QUE NECESITO (3 escenarios)
            ════════════════════════════════════════════════════════════════════ */}
        <GlowCard className="border-purple-500/20 bg-gradient-to-b from-[#130f22] to-[#090712] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <span>🎯</span> Calculadora 2 — Tu Objetivo
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
              sandboxNuevoMult < multTier ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-purple-500/10 text-purple-300 border-purple-500/30"
            }`}>
              {sandboxNuevoMult}x Resultante
            </span>
          </div>

          {/* CONTROL DE OBJETIVO EN USD */}
          <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
              <label className="text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1">
                <span>🎯</span> Tu Meta Diaria (cada 24h):
              </label>
              {/* Modo boost */}
              <div className="flex gap-1">
                {(["24_7", "22h"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModoBoost(m)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      modoBoost === m ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white bg-white/5"
                    }`}
                  >
                    {m === "24_7" ? "⚡ 24/7 EC" : "🌙 22h Normal"}
                  </button>
                ))}
              </div>
            </div>

            {/* Input libre */}
            <div className="flex items-center gap-2 bg-[#1b122c] border border-purple-500/50 rounded-lg px-3 py-1.5">
              <span className="text-purple-400 font-bold text-lg">$</span>
              <input
                type="number"
                step="0.25"
                min="0.01"
                value={objetivoUsd}
                onChange={(e) => {
                  const v = Math.max(0.01, Number(e.target.value) || 0.01);
                  setObjetivoUsd(v);
                  resetManual();
                }}
                className="flex-1 bg-transparent text-lg font-bold font-mono text-white focus:outline-none"
              />
              <span className="text-xs text-gray-300 font-medium">USD / día</span>
            </div>

            {/* Presets rápidos */}
            <div className="flex flex-wrap gap-1">
              {presets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { setObjetivoUsd(val); resetManual(); }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                    Math.abs(objetivoUsd - val) < 0.001
                      ? "bg-purple-600 text-white shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  ${val % 1 === 0 ? val.toFixed(0) : val.toFixed(2)}/d{val === 1.0 ? " ⭐" : ""}
                </button>
              ))}
            </div>
          </div>

          {/* SELECTOR DE ESCENARIO */}
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1.5">
              📊 Elige cómo quieres llegar a tu meta:
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.entries(ESCENARIOS) as [EscenarioKey, Escenario][]).map(([key, info]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setEscenario(key); resetManual(); }}
                  className={`p-2 rounded-xl border text-center text-[10px] font-bold transition-all ${
                    escenario === key
                      ? `${info.color} text-white border-transparent shadow-lg`
                      : `bg-black/40 border-white/5 text-gray-400 hover:border-white/20 hover:text-white`
                  }`}
                >
                  <div className="text-base mb-0.5">{info.emoji}</div>
                  <div>{info.label}</div>
                  {key === "ambos" && <div className="text-[9px] font-normal opacity-70 mt-0.5">Recomendado</div>}
                  {key === "insignias" && !escenarioResultados.insignias.posible && (
                    <div className="text-[9px] font-normal text-red-400 mt-0.5">No alcanza</div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5 italic">{ESCENARIOS[escenario].descripcion}</p>
          </div>

          {/* RESULTADO DEL ESCENARIO SELECCIONADO */}
          {escenario === "insignias" && !escenarioResultados.insignias.posible ? (
            <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-xs text-red-300">
              <strong>⚠️ Imposible con solo insignias:</strong> El pasaporte máximo (Nivel 5, +25%) con
              tus <strong>{totalParcelas} parcelas actuales</strong> solo llega a <strong>
              ${fmt(calc24h(baseSecActual, multTier, 1.25), 4)} USD/24h</strong>.
              Para alcanzar <strong>${objetivoUsd.toFixed(2)} USD/día</strong> también necesitas comprar más parcelas.
              Cambia al escenario <strong>Parcelas + Insignias</strong>.
            </div>
          ) : (
            <div className="space-y-2">
              {/* Resumen de lo que se necesita */}
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className={`p-2 rounded-lg border ${ESCENARIOS[escenario].borderColor} bg-black/40`}>
                  <div className="text-[9px] text-gray-400 uppercase">🏞️ Parcelas Meta</div>
                  <div className="text-sm font-bold font-mono text-cyan-300">{parcActivas.toLocaleString()}</div>
                  {sandboxFaltanParcelas > 0 && (
                    <div className="text-[9px] text-cyan-400 font-semibold">+{sandboxFaltanParcelas.toLocaleString()} FALTAN</div>
                  )}
                </div>
                <div className={`p-2 rounded-lg border ${ESCENARIOS[escenario].borderColor} bg-black/40`}>
                  <div className="text-[9px] text-gray-400 uppercase">🏅 Insignias Meta</div>
                  <div className="text-sm font-bold font-mono text-amber-300">{insignActivas}</div>
                  {sandboxFaltanInsignias > 0 && (
                    <div className="text-[9px] text-amber-400 font-semibold">+{sandboxFaltanInsignias} FALTAN</div>
                  )}
                </div>
                <div className="p-2 rounded-lg border border-white/10 bg-black/40">
                  <div className="text-[9px] text-gray-400 uppercase">⚙️ Multiplicador</div>
                  <div className="text-sm font-bold font-mono text-white">{sandboxNuevoMult}x</div>
                  <div className="text-[9px] text-gray-500">
                    Pass {sandboxNuevoPasNivel} ({(sandboxNuevoPasMult * 100 - 100).toFixed(0)}%)
                  </div>
                </div>
              </div>

              {/* Costo en AB */}
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="p-2 rounded-lg border border-white/5 bg-black/40">
                  <div className="text-[9px] text-gray-400 uppercase">AB Parcelas</div>
                  <div className="text-xs font-bold font-mono text-cyan-300">{sandboxABParcelas.toLocaleString()}</div>
                </div>
                <div className="p-2 rounded-lg border border-white/5 bg-black/40">
                  <div className="text-[9px] text-gray-400 uppercase">AB Insignias</div>
                  <div className="text-xs font-bold font-mono text-amber-300">{sandboxABInsignias.toLocaleString()}</div>
                </div>
                <div className="p-2 rounded-lg border border-purple-500/30 bg-black/40">
                  <div className="text-[9px] text-purple-300 uppercase font-semibold">Total AB</div>
                  <div className="text-xs font-bold font-mono text-white">{sandboxABTotal.toLocaleString()}</div>
                </div>
              </div>

              {/* Renta resultante */}
              <div className="p-3 bg-gradient-to-r from-[#1c1232] to-[#110c22] border border-purple-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">📈 Renta con esta configuración ({modoBoost === "24_7" ? "24/7" : "22h"}):</span>
                  <span className="font-mono font-bold text-white text-sm">${fmt(sandboxRenta, 4)} USD/día</span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-white/5 pt-1.5">
                  <span className="text-emerald-400 font-semibold">⚡ Ganancia Neta Extra:</span>
                  <span className={`font-mono font-bold ${sandboxExtraDia >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {sandboxExtraDia >= 0 ? "+" : ""} ${fmt(sandboxExtraDia, 4)} USD/24h
                  </span>
                </div>

                {/* Barra de progreso hacia la meta */}
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-gray-400">Meta: <strong className="text-white">${objetivoUsd.toFixed(2)}/día</strong></span>
                    <span className={`font-bold font-mono ${sandboxPct >= 100 ? "text-emerald-400" : "text-amber-400"}`}>
                      {sandboxPct >= 100 ? "🎉 ¡Meta superada!" : `${sandboxPct.toFixed(1)}%`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, sandboxPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* TIEMPOS Y FECHAS */}
              {sandboxAbNeto > 0 ? (
                <div className="space-y-1.5 text-[11px] bg-black/40 p-3 rounded-xl border border-white/5">
                  <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">
                    ⏱️ Tiempo para juntar {sandboxAbNeto.toLocaleString()} AB netos:
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-300 font-semibold flex items-center gap-1">
                      <span>⚡</span> Con Explorer Club ({abEcDiarios.toFixed(0)} AB/día):
                    </span>
                    <span className="font-mono text-white font-bold">{motor.formato_tiempo_exacto(sandboxDiasEC)}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 pl-4">
                    📅 Fecha estimada: <strong className="text-cyan-400">{proyectarFechaMeta(sandboxDiasEC)}</strong>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5">
                    <span className="text-gray-300 flex items-center gap-1">
                      <span>🛡️</span> Free to Play ({abPorDia.toFixed(0)} AB/día):
                    </span>
                    <span className="font-mono text-white font-bold">{motor.formato_tiempo_exacto(sandboxDiasF2P)}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 pl-4">
                    📅 Fecha estimada: <strong className="text-gray-300">{proyectarFechaMeta(sandboxDiasF2P)}</strong>
                  </div>

                  {/* Nota explicativa de los tiempos */}
                  <div className="mt-2 p-2 bg-blue-950/20 border border-blue-500/20 rounded-lg text-[10px] text-gray-400">
                    💡 El tiempo es solo para <strong className="text-white">acumular AB</strong> para comprar las parcelas/insignias.
                    Con EC ({abEcDiarios.toFixed(0)} AB/día) y tu saldo actual de {abAhorrados.toLocaleString()} AB ya aplicado.
                  </div>
                </div>
              ) : (
                <div className="text-xs text-center text-emerald-400 font-bold p-2 bg-emerald-950/20 rounded-lg">
                  ✅ Con tu saldo actual de {abAhorrados.toLocaleString()} AB puedes comprar esto de inmediato.
                </div>
              )}

              {/* SANDBOX: Controles manuales para explorar */}
              <details className="group">
                <summary className="cursor-pointer text-[10px] uppercase font-bold text-gray-500 tracking-wider hover:text-gray-300 flex items-center gap-1.5">
                  <span className="group-open:rotate-90 transition-transform">▶</span>
                  🧪 Explorar otras combinaciones manualmente
                </summary>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-black/40 p-2 rounded-xl border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase">
                      <span>🏞️ Parcelas</span>
                      {sandboxFaltanParcelas > 0 && <span className="text-cyan-400">+{sandboxFaltanParcelas.toLocaleString()} FALTAN</span>}
                    </div>
                    <input
                      type="number"
                      min={totalParcelas}
                      value={parcActivas}
                      onChange={(e) => setManualParcelas(Math.max(totalParcelas, Number(e.target.value) || totalParcelas))}
                      className="w-full bg-[#181424] border border-cyan-500/40 rounded-lg px-2 py-1 text-sm font-bold font-mono text-white focus:outline-none"
                    />
                    <div className="flex gap-1">
                      {[10, 50, 100, 500].map((n) => (
                        <button key={n} type="button"
                          onClick={() => setManualParcelas(totalParcelas + n)}
                          className="flex-1 py-0.5 text-[9px] font-bold rounded bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5">+{n}</button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-black/40 p-2 rounded-xl border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase">
                      <span>🏅 Insignias</span>
                      {sandboxFaltanInsignias > 0 && <span className="text-amber-400">+{sandboxFaltanInsignias} FALTAN</span>}
                    </div>
                    <input
                      type="number"
                      min={insigniasActuales}
                      value={insignActivas}
                      onChange={(e) => setManualInsignias(Math.max(insigniasActuales, Number(e.target.value) || insigniasActuales))}
                      className="w-full bg-[#181424] border border-amber-500/40 rounded-lg px-2 py-1 text-sm font-bold font-mono text-white focus:outline-none"
                    />
                    <div className="flex gap-1">
                      {[31, 61, 101].filter((n) => n >= insigniasActuales).map((n) => (
                        <button key={n} type="button"
                          onClick={() => setManualInsignias(n)}
                          className={`flex-1 py-0.5 text-[9px] font-bold rounded border ${
                            insignActivas === n ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-white/5 text-gray-300 border-white/5 hover:bg-white/10"
                          }`}>
                          {n} Nv{calcularNivelPasaporte(n)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {esManual && (
                    <div className="col-span-full">
                      <button
                        type="button"
                        onClick={resetManual}
                        className="w-full py-1 text-[10px] font-bold rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40"
                      >
                        🎯 Volver al cálculo automático de &quot;${objetivoUsd.toFixed(2)}/día&quot;
                      </button>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}

          <div className="pt-1.5 border-t border-white/5 text-[10px] text-purple-300/80 text-center">
            {sandboxAbNeto === 0
              ? `✅ Tienes el AB necesario. Invierte ${sandboxABTotal.toLocaleString()} AB ahora.`
              : `Necesitas ${sandboxAbNeto.toLocaleString()} AB netos adicionales (tienes ${abAhorrados.toLocaleString()} AB)`}
          </div>
        </GlowCard>
      </div>

      {/* ── COMPARATIVA RÁPIDA DE LOS 3 ESCENARIOS ───────────────────────── */}
      <GlowCard className="border-white/10 bg-[#0a0d14] p-4">
        <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-3">
          📊 Comparativa de los 3 Escenarios para ${objetivoUsd.toFixed(2)} USD/día ({modoBoost === "24_7" ? "24/7 EC" : "22h Normal"}):
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[9px] uppercase tracking-wider text-gray-500 border-b border-white/5">
                <th className="py-1.5 px-2 text-left">Escenario</th>
                <th className="py-1.5 px-2 text-right">Parcelas</th>
                <th className="py-1.5 px-2 text-right">Insignias</th>
                <th className="py-1.5 px-2 text-right">AB Total</th>
                <th className="py-1.5 px-2 text-right">Con EC</th>
                <th className="py-1.5 px-2 text-right">F2P</th>
              </tr>
            </thead>
            <tbody>
              {(Object.entries(escenarioResultados) as [EscenarioKey, typeof escenarioResultados.ambos][]).map(([key, res]) => {
                const info = ESCENARIOS[key];
                const esActivo = escenario === key;
                const noposible = key === "insignias" && !escenarioResultados.insignias.posible;
                return (
                  <tr
                    key={key}
                    onClick={() => { if (!noposible) { setEscenario(key); resetManual(); } }}
                    className={`border-b border-white/[2%] cursor-pointer transition-all ${
                      esActivo ? "bg-purple-900/20 border-l-2 border-l-purple-400" : "hover:bg-white/[1%]"
                    } ${noposible ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <td className="py-2 px-2">
                      <span className={`font-bold ${info.textColor} flex items-center gap-1`}>
                        {info.emoji} {info.label}
                        {key === "ambos" && <span className="text-[8px] text-purple-400 bg-purple-900/40 px-1 rounded">REC</span>}
                        {noposible && <span className="text-[8px] text-red-400 bg-red-900/30 px-1 rounded">IMPOSIBLE</span>}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-gray-300">
                      {res.parcelasMeta.toLocaleString()}
                      {res.parcelasFaltan > 0 && <span className="text-cyan-400 text-[9px] ml-1">(+{res.parcelasFaltan.toLocaleString()})</span>}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-gray-300">
                      {res.insigniasMeta}
                      {res.insigniasFaltan > 0 && <span className="text-amber-400 text-[9px] ml-1">(+{res.insigniasFaltan})</span>}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-white font-bold">
                      {noposible ? "—" : res.abTotal.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-amber-300">
                      {noposible ? "—" : motor.formato_tiempo_exacto(res.diasEC)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-gray-400">
                      {noposible ? "—" : motor.formato_tiempo_exacto(res.diasF2P)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="text-[9px] text-gray-600 mt-2">
          * Tiempos calculados sobre los AB netos faltantes (descontando tus {abAhorrados.toLocaleString()} AB ya ahorrados).
          EC = {abEcDiarios.toFixed(0)} AB/día · F2P = {abPorDia.toFixed(0)} AB/día
        </div>
      </GlowCard>
    </div>
  );
}

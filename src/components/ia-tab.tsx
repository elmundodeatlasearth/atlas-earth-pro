// src/components/ia-tab.tsx
// Tab de IA con Asesor Financiero Groq AI 120B — Experto en Atlas Earth
// Calcula en tiempo real los 3 escenarios (Solo Parcelas, Solo Insignias, Ambas)
// según la meta diaria en USD que el usuario elija, con tiempos exactos y dictamen táctico.
"use client";
import React, { useState, useMemo, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { GlowCard } from "./stat-card";
import { sanitizeHTML } from "@/utils/sanitize";
import {
  fmt,
  proyectarFechaMeta,
  calcularNivelPasaporte,
  TIERS_COMPLETOS,
  type MotorAtlasEarth,
} from "@/utils/atlasMath";

interface IaTabProps {
  user: User | null;
  isUltra: boolean;
  aiCredits: number;
  aiCreditsPerMonth: number;
  aiCreditsResetDate: string | null;
  aiLoading: boolean;
  aiAdvice: string;
  aiError: string;
  totalParcelas: number;
  pasaporte: number;
  abPorDia: number;
  metaUsdDia: number;
  handleGenerateAI: (metaDolarOverride?: number, metaPeriodoOverride?: string) => Promise<void>;
  motor?: MotorAtlasEarth;
  multTier?: number;
  abAhorrados?: number;
  insignias?: number;
  pais?: string;
  moneda?: string;
  abEcDiarios?: number;
  horasSrb?: number;
}

export default function IaTab({
  user,
  isUltra,
  aiCredits,
  aiCreditsPerMonth,
  aiCreditsResetDate,
  aiLoading,
  aiAdvice,
  aiError,
  totalParcelas,
  pasaporte,
  abPorDia,
  metaUsdDia,
  handleGenerateAI,
  motor,
  multTier = 10,
  abAhorrados = 0,
  insignias = 0,
  pais = "Estados Unidos",
  moneda = "USD",
  abEcDiarios = 122.6,
  horasSrb = 64,
}: IaTabProps) {
  // === ESTADO DEL OBJETIVO DIARIO DEL USUARIO ===
  const [objetivoUsd, setObjetivoUsd] = useState<number>(() => {
    return metaUsdDia > 0 ? Number(metaUsdDia.toFixed(2)) : 1.0;
  });
  const [modoBoost, setModoBoost] = useState<"24_7" | "22h">("24_7");
  const [escenarioActivo, setEscenarioActivo] = useState<"parcelas" | "insignias" | "ambos">("ambos");

  // Cálculos base
  const baseSec = motor?.renta_base ?? 8.3213e-7;
  const insigniasActuales = insignias || (pasaporte === 5 ? 101 : pasaporte === 4 ? 61 : pasaporte === 3 ? 31 : pasaporte === 2 ? 11 : pasaporte === 1 ? 1 : 0);
  const nivelActualPass = calcularNivelPasaporte(insigniasActuales);
  const passMultActual = 1 + nivelActualPass * 0.05;

  const calc24h = useCallback((base: number, mult: number, pMult: number) => base * 86400 * mult * pMult, []);
  const calc22h = useCallback((base: number, mult: number, pMult: number) => (base * 79200 * mult + base * 7200) * pMult, []);

  const rentaActualHoy = modoBoost === "24_7"
    ? calc24h(baseSec, multTier, passMultActual)
    : calc22h(baseSec, multTier, passMultActual);

  // ─── SOLVER: Parcelas requeridas para una meta con N insignias ───
  const solverParcelas = useCallback((targetUsd: number, targetInsignias: number, boost: "24_7" | "22h") => {
    const nivel = calcularNivelPasaporte(targetInsignias);
    const passMult = 1 + nivel * 0.05;

    const evalRenta = (p: number): number => {
      if (!motor) return 0;
      const mult = motor._get_tier_mult(p, pais, TIERS_COMPLETOS);
      let b = baseSec;
      if (p > totalParcelas) b += (p - totalParcelas) * 1.58e-9;
      else if (p < totalParcelas) b = p * motor.renta_promedio_sec;
      return boost === "24_7" ? calc24h(b, mult, passMult) : calc22h(b, mult, passMult);
    };

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
    const multFinal = motor ? motor._get_tier_mult(bestP, pais, TIERS_COMPLETOS) : multTier;
    return { parcelas: bestP, renta: evalRenta(bestP), mult: multFinal };
  }, [motor, baseSec, totalParcelas, multTier, pais, calc24h, calc22h]);

  // ─── CÁLCULO DE LOS 3 ESCENARIOS EN TIEMPO REAL ───
  const escenarios = useMemo(() => {
    // 1. SOLO PARCELAS
    const calcParc = solverParcelas(objetivoUsd, insigniasActuales, modoBoost);
    const faltanParc = Math.max(0, calcParc.parcelas - totalParcelas);
    const abTotalParc = faltanParc * 100;
    const abNetoParc = Math.max(0, abTotalParc - abAhorrados);
    const diasEcParc = abEcDiarios > 0 ? abNetoParc / abEcDiarios : 0;
    const diasF2pParc = abPorDia > 0 ? abNetoParc / abPorDia : 0;

    // 2. SOLO INSIGNIAS
    let insigniasReq = 101;
    let viableInsignias = false;
    for (const num of [1, 11, 31, 61, 101]) {
      if (num < insigniasActuales) continue;
      const n = calcularNivelPasaporte(num);
      const pm = 1 + n * 0.05;
      const r = modoBoost === "24_7" ? calc24h(baseSec, multTier, pm) : calc22h(baseSec, multTier, pm);
      if (r >= objetivoUsd) {
        insigniasReq = num;
        viableInsignias = true;
        break;
      }
    }
    const faltanInsign = Math.max(0, insigniasReq - insigniasActuales);
    const abTotalInsign = faltanInsign * 200;
    const abNetoInsign = Math.max(0, abTotalInsign - abAhorrados);
    const diasEcInsign = abEcDiarios > 0 ? abNetoInsign / abEcDiarios : 0;
    const diasF2pInsign = abPorDia > 0 ? abNetoInsign / abPorDia : 0;

    // 3. AMBAS (RUTA ÓPTIMA)
    const insigniasOptimas = Math.max(insigniasActuales, 101);
    const calcAmbos = solverParcelas(objetivoUsd, insigniasOptimas, modoBoost);
    const faltanInsignAmbos = Math.max(0, insigniasOptimas - insigniasActuales);
    const faltanParcAmbos = Math.max(0, calcAmbos.parcelas - totalParcelas);
    const abAmbosTotal = faltanInsignAmbos * 200 + faltanParcAmbos * 100;
    const abAmbosNeto = Math.max(0, abAmbosTotal - abAhorrados);
    const diasEcAmbos = abEcDiarios > 0 ? abAmbosNeto / abEcDiarios : 0;
    const diasF2pAmbos = abPorDia > 0 ? abAmbosNeto / abPorDia : 0;

    return {
      parcelas: {
        parcelasMeta: calcParc.parcelas,
        faltan: faltanParc,
        abTotal: abTotalParc,
        abNeto: abNetoParc,
        diasEC: diasEcParc,
        diasF2P: diasF2pParc,
        mult: calcParc.mult,
        renta: calcParc.renta,
        posible: true,
      },
      insignias: {
        insigniasMeta: insigniasReq,
        faltan: faltanInsign,
        abTotal: abTotalInsign,
        abNeto: abNetoInsign,
        diasEC: diasEcInsign,
        diasF2P: diasF2pInsign,
        posible: viableInsignias,
        renta: modoBoost === "24_7" ? calc24h(baseSec, multTier, 1.25) : calc22h(baseSec, multTier, 1.25),
      },
      ambos: {
        parcelasMeta: calcAmbos.parcelas,
        faltanParc: faltanParcAmbos,
        faltanInsign: faltanInsignAmbos,
        abTotal: abAmbosTotal,
        abNeto: abAmbosNeto,
        diasEC: diasEcAmbos,
        diasF2P: diasF2pAmbos,
        mult: calcAmbos.mult,
        renta: calcAmbos.renta,
        posible: true,
      },
    };
  }, [objetivoUsd, modoBoost, solverParcelas, insigniasActuales, abAhorrados, abEcDiarios, abPorDia, baseSec, multTier, totalParcelas, calc24h, calc22h]);

  const dispararAnalisisConMeta = () => {
    handleGenerateAI(objetivoUsd, "day");
  };

  const presets = [0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 5.0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ≡≡≡ SECCIÓN 1: 🎯 CONTROL DE META DIARIA Y SELECCIÓN DE ESCENARIO ≡≡≡ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
              CONFIGURADOR DE META IA
            </span>
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              ¿Cuánto quieres ganar cada 24 horas?
            </span>
          </div>
          <div className="text-[10px] text-gray-400 flex items-center gap-2 font-mono">
            <span>País: <strong className="text-cyan-300">{pais}</strong></span>
            <span>🪙 Saldo: <strong className="text-amber-300">{abAhorrados.toLocaleString()} AB</strong></span>
          </div>
        </div>

        <GlowCard className="bg-gradient-to-br from-purple-950/40 via-indigo-950/20 to-[#0d0f18] border-purple-500/30 p-5 space-y-4">
          {/* Header con créditos y status */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
            <div>
              <div className="text-xs text-purple-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                <span>🤖</span> Asesor Financiero Autónomo — Atlas Earth Groq 120B
                {isUltra && <span className="ml-1 text-[9px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">👑 ULTRA</span>}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                Calculador Predictivo de Tiempos y Costos para tu Objetivo
              </h2>
            </div>
            <div className="text-xs text-gray-400 text-right">
              <div>Créditos mensuales: <strong className="text-purple-300">{isUltra ? "50/mes" : `${aiCreditsPerMonth}/mes`}</strong></div>
              <div className="text-[10px] text-gray-500">Disponibles este ciclo: <strong className="text-white">{aiCredits}</strong></div>
            </div>
          </div>

          {/* Input interactivo de Meta USD y modo boost */}
          <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-2xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <span>💵</span> Meta Diaria deseada (cada 24 horas):
              </label>
              <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setModoBoost("24_7")}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                    modoBoost === "24_7" ? "bg-purple-600 text-white shadow-md shadow-purple-900/50" : "text-gray-400 hover:text-white"
                  }`}
                >
                  ⚡ Con Explorer Club (24/7)
                </button>
                <button
                  type="button"
                  onClick={() => setModoBoost("22h")}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                    modoBoost === "22h" ? "bg-purple-600 text-white shadow-md shadow-purple-900/50" : "text-gray-400 hover:text-white"
                  }`}
                >
                  🌙 Modo Normal (22h)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="flex items-center gap-2 bg-[#140e24] border border-purple-500/40 rounded-xl px-4 py-2">
                <span className="text-purple-400 font-black text-xl">$</span>
                <input
                  type="number"
                  step="0.25"
                  min="0.10"
                  value={objetivoUsd}
                  onChange={(e) => setObjetivoUsd(Math.max(0.1, Number(e.target.value) || 0.1))}
                  className="flex-1 bg-transparent text-xl font-bold font-mono text-white focus:outline-none"
                />
                <span className="text-xs font-bold text-gray-300">USD / día</span>
              </div>
              <div className="text-xs text-gray-400 bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                <div>Generas HOY: <strong className="text-emerald-400 font-mono">${fmt(rentaActualHoy, 4)} USD/día</strong></div>
                <div>Falta generar: <strong className="text-amber-400 font-mono">+${fmt(Math.max(0, objetivoUsd - rentaActualHoy), 4)} USD/día</strong></div>
              </div>
            </div>

            {/* Presets rápidos */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] uppercase font-bold text-gray-500 mr-1">Metas sugeridas:</span>
              {presets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setObjetivoUsd(val)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all border ${
                    Math.abs(objetivoUsd - val) < 0.001
                      ? "bg-purple-600 text-white border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                      : "bg-white/5 text-gray-400 hover:text-white border-white/5 hover:bg-white/10"
                  }`}
                >
                  ${val.toFixed(2)}/d{val === 1.0 ? " ⭐" : ""}
                </button>
              ))}
            </div>
          </div>

          {/* ≡≡≡ COMPARATIVA DE LOS 3 ESCENARIOS EN TIEMPO REAL ≡≡≡ */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              📊 Comparativa matemática en tiempo real para alcanzar ${objetivoUsd.toFixed(2)} USD/día:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* ESCENARIO A: SOLO PARCELAS */}
              <div
                onClick={() => setEscenarioActivo("parcelas")}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  escenarioActivo === "parcelas"
                    ? "bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-950/40"
                    : "bg-black/40 border-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                    <span>🏞️</span> Solo Parcelas
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-900/50 text-cyan-300 font-mono font-bold">
                    {escenarios.parcelas.mult}x Tier
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Parcelas a comprar:</span>
                    <strong className="text-white font-mono">+{escenarios.parcelas.faltan.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total en tu terreno:</span>
                    <strong className="text-cyan-300 font-mono">{escenarios.parcelas.parcelasMeta.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-1">
                    <span className="text-gray-400">AB netos requeridos:</span>
                    <strong className="text-amber-300 font-mono">{escenarios.parcelas.abNeto.toLocaleString()} AB</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">⚡ Tiempo con EC:</span>
                    <strong className="text-emerald-400 font-mono">{motor?.formato_tiempo_exacto(escenarios.parcelas.diasEC)}</strong>
                  </div>
                  <div className="text-[9px] text-gray-500 text-right">
                    📅 Fecha: {proyectarFechaMeta(escenarios.parcelas.diasEC)}
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-1">
                    <span className="text-gray-400">🛡️ Tiempo Free to Play:</span>
                    <strong className="text-gray-300 font-mono">{motor?.formato_tiempo_exacto(escenarios.parcelas.diasF2P)}</strong>
                  </div>
                </div>
              </div>

              {/* ESCENARIO B: SOLO INSIGNIAS */}
              <div
                onClick={() => setEscenarioActivo("insignias")}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  escenarioActivo === "insignias"
                    ? "bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/40"
                    : "bg-black/40 border-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <span>🏅</span> Solo Insignias
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    escenarios.insignias.posible ? "bg-amber-900/50 text-amber-300" : "bg-red-900/50 text-red-300"
                  }`}>
                    {escenarios.insignias.posible ? "Viable" : "No Alcanza"}
                  </span>
                </div>
                {escenarios.insignias.posible ? (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Insignias a comprar:</span>
                      <strong className="text-white font-mono">+{escenarios.insignias.faltan}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pasaporte meta:</span>
                      <strong className="text-amber-300 font-mono">{escenarios.insignias.insigniasMeta} ({calcularNivelPasaporte(escenarios.insignias.insigniasMeta) * 5}%)</strong>
                    </div>
                    <div className="flex justify-between border-t border-white/5 pt-1">
                      <span className="text-gray-400">AB netos requeridos:</span>
                      <strong className="text-amber-300 font-mono">{escenarios.insignias.abNeto.toLocaleString()} AB</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">⚡ Tiempo con EC:</span>
                      <strong className="text-emerald-400 font-mono">{motor?.formato_tiempo_exacto(escenarios.insignias.diasEC)}</strong>
                    </div>
                    <div className="text-[9px] text-gray-500 text-right">
                      📅 Fecha: {proyectarFechaMeta(escenarios.insignias.diasEC)}
                    </div>
                    <div className="flex justify-between border-t border-white/5 pt-1">
                      <span className="text-gray-400">🛡️ Tiempo Free to Play:</span>
                      <strong className="text-gray-300 font-mono">{motor?.formato_tiempo_exacto(escenarios.insignias.diasF2P)}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-red-300 bg-red-950/30 p-2.5 rounded-xl border border-red-500/20 leading-relaxed">
                    <strong>⚠️ Matemáticamente imposible solo con insignias:</strong> Con tus {totalParcelas} parcelas, el pasaporte máximo (+25%) solo llega a ${fmt(escenarios.insignias.renta, 4)} USD/día. Necesitas comprar parcelas.
                  </div>
                )}
              </div>

              {/* ESCENARIO C: AMBAS (RUTA ÓPTIMA) */}
              <div
                onClick={() => setEscenarioActivo("ambos")}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  escenarioActivo === "ambos"
                    ? "bg-purple-950/50 border-purple-400 shadow-xl shadow-purple-950/60 ring-1 ring-purple-400"
                    : "bg-black/40 border-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1">
                    <span>⚡</span> Parcelas + Insignias
                  </span>
                  <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    Recomendado
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Parcelas a comprar:</span>
                    <strong className="text-cyan-300 font-mono">+{escenarios.ambos.faltanParc.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Insignias a comprar:</span>
                    <strong className="text-amber-300 font-mono">+{escenarios.ambos.faltanInsign} (Nv.5)</strong>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-1">
                    <span className="text-gray-400">Total AB netos:</span>
                    <strong className="text-white font-mono">{escenarios.ambos.abNeto.toLocaleString()} AB</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">⚡ Tiempo con EC:</span>
                    <strong className="text-emerald-400 font-mono">{motor?.formato_tiempo_exacto(escenarios.ambos.diasEC)}</strong>
                  </div>
                  <div className="text-[9px] text-gray-500 text-right">
                    📅 Fecha: {proyectarFechaMeta(escenarios.ambos.diasEC)}
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-1">
                    <span className="text-gray-400">🛡️ Tiempo Free to Play:</span>
                    <strong className="text-gray-300 font-mono">{motor?.formato_tiempo_exacto(escenarios.ambos.diasF2P)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de Generación de Dictamen con Groq 120B */}
          {!user ? (
            <div className="p-3.5 bg-red-950/30 border border-red-500/30 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span> Inicia sesión en el panel lateral para solicitar el análisis de la IA con tus créditos mensuales.
            </div>
          ) : (
            <>
              {!isUltra && aiCredits <= 0 && (
                <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-semibold flex items-center gap-2">
                  <span>💰</span> No tienes créditos IA disponibles este ciclo. Los usuarios PRO reciben 5 créditos/mes.
                </div>
              )}
              <button
                onClick={dispararAnalisisConMeta}
                disabled={aiLoading || (!isUltra && aiCredits <= 0)}
                className="w-full py-3.5 rounded-xl font-bold text-white text-xs sm:text-sm transition-all duration-300
                  bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-lg shadow-purple-900/40 hover:shadow-cyan-900/50 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {aiLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Groq AI 120B calculando dictamen para ${objetivoUsd.toFixed(2)} USD/día...</span>
                  </>
                ) : (
                  <span>⚡ Generar Dictamen y Plan Táctico con Groq AI 120B (${objetivoUsd.toFixed(2)}/día)</span>
                )}
              </button>

              {aiError && (
                <div className="p-3.5 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs font-semibold">
                  ⚠️ {aiError}
                </div>
              )}
            </>
          )}
        </GlowCard>
      </section>

      {/* ≡≡≡ SECCIÓN 2: 🧠 DICTAMEN ESTRATÉGICO GENERADO POR GROQ AI ≡≡≡ */}
      {aiAdvice && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
              SECCIÓN 2
            </span>
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Dictamen Táctico Oficial Groq AI (Modelo 120B)
            </span>
          </div>

          <GlowCard className="p-5 sm:p-6 space-y-4 border-cyan-500/30">
            <div className="relative">
              <div
                className="p-4 sm:p-5 bg-gradient-to-br from-[#0c0f18] to-[#080a10] rounded-xl border border-purple-500/20 text-gray-200 text-xs sm:text-sm leading-relaxed max-h-[600px] overflow-y-auto
                prose prose-invert prose-sm prose-headings:text-purple-300 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
                prose-strong:text-cyan-300 prose-strong:font-bold
                prose-li:text-gray-300 prose-li:marker:text-purple-500
                prose-p:text-gray-300 prose-p:leading-relaxed
                prose-code:text-pink-300 prose-code:bg-white/5 prose-code:px-1 prose-code:rounded
                prose-hr:border-white/10
                scrollbar-custom"
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(aiAdvice) }}
              />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#080a10] to-transparent rounded-b-xl" />
            </div>

            {!aiLoading && (
              <button
                onClick={dispararAnalisisConMeta}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white transition-all border border-white/10 flex items-center justify-center gap-2 font-semibold"
              >
                <span>🔄</span> Re-evaluar Plan Táctico con Groq AI
              </button>
            )}
          </GlowCard>
        </section>
      )}
    </div>
  );
}

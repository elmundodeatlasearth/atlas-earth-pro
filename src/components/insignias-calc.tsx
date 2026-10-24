// src/components/insignias-calc.tsx
// Calculadora Avanzada de Insignias (Objetivo 101 Insignias - Nivel 5) y Comparativa con Parcelas
"use client";
import React, { useState, useMemo } from "react";
import { GlowCard } from "./stat-card";
import { fmt, proyectarFechaMeta, type MotorAtlasEarth, TIERS_COMPLETOS } from "@/utils/atlasMath";

interface InsigniasCalcProps {
  insigniasActuales: number;
  abAhorrados: number;
  motor: MotorAtlasEarth;
  pais: string;
  multTier: number;
  abPorDia?: number;
  abEcDiarios?: number;
  horasSrb: number;
  horasBoost: number;
}

export default function InsigniasCalculator({
  insigniasActuales,
  abAhorrados,
  motor,
  pais,
  multTier,
  abPorDia = 22,
  abEcDiarios = 122.6,
  horasSrb,
  horasBoost,
}: InsigniasCalcProps) {
  // Objetivo default: 101 insignias (Nivel 5)
  const [objetivoInsignias, setObjetivoInsignias] = useState<number>(101);

  // Niveles oficiales del pasaporte
  const nivelesPasaporte = [
    { nivel: 1, insignias: 1, bonusPct: 5, mult: 1.05, label: "Nivel 1 (+5%)" },
    { nivel: 2, insignias: 11, bonusPct: 10, mult: 1.10, label: "Nivel 2 (+10%)" },
    { nivel: 3, insignias: 31, bonusPct: 15, mult: 1.15, label: "Nivel 3 (+15%)" },
    { nivel: 4, insignias: 61, bonusPct: 20, mult: 1.20, label: "Nivel 4 (+20%)" },
    { nivel: 5, insignias: 101, bonusPct: 25, mult: 1.25, label: "Nivel 5 (+25% MÁX)" },
  ];

  // Nivel actual según las insignias que tiene el usuario
  const nivelActualObj = useMemo(() => {
    if (insigniasActuales >= 101) return { nivel: 5, bonusPct: 25, mult: 1.25 };
    if (insigniasActuales >= 61) return { nivel: 4, bonusPct: 20, mult: 1.20 };
    if (insigniasActuales >= 31) return { nivel: 3, bonusPct: 15, mult: 1.15 };
    if (insigniasActuales >= 11) return { nivel: 2, bonusPct: 10, mult: 1.10 };
    if (insigniasActuales >= 1) return { nivel: 1, bonusPct: 5, mult: 1.05 };
    return { nivel: 0, bonusPct: 0, mult: 1.00 };
  }, [insigniasActuales]);

  // Nivel proyectado con el objetivo seleccionado
  const nivelProyectadoObj = useMemo(() => {
    if (objetivoInsignias >= 101) return { nivel: 5, bonusPct: 25, mult: 1.25 };
    if (objetivoInsignias >= 61) return { nivel: 4, bonusPct: 20, mult: 1.20 };
    if (objetivoInsignias >= 31) return { nivel: 3, bonusPct: 15, mult: 1.15 };
    if (objetivoInsignias >= 11) return { nivel: 2, bonusPct: 10, mult: 1.10 };
    if (objetivoInsignias >= 1) return { nivel: 1, bonusPct: 5, mult: 1.05 };
    return { nivel: 0, bonusPct: 0, mult: 1.00 };
  }, [objetivoInsignias]);

  // Cálculos de insignias y AB
  const faltantesInsignias = Math.max(0, objetivoInsignias - insigniasActuales);
  const costoTotalAbInsignias = faltantesInsignias * 200;
  const abNetosInsignias = Math.max(0, costoTotalAbInsignias - abAhorrados);
  const parcelasEquivalentes = Math.floor(costoTotalAbInsignias / 100);

  // Tiempos estimados
  const diasF2P = abPorDia > 0 ? abNetosInsignias / abPorDia : 0;
  const diasEC = abEcDiarios > 0 ? abNetosInsignias / abEcDiarios : 0;

  // Cálculos de Renta 24 Horas Exacta
  const baseSec = motor.renta_base; // USD/segundo de tus 435 parcelas
  const mult = multTier;

  // 1. Renta 24 horas actual con el pasaporte que tienes hoy
  const renta24hActual = baseSec * 3600 * 24 * mult * nivelActualObj.mult;
  const renta22hActual = (baseSec * 3600 * 22 * mult + baseSec * 3600 * 2 * 1) * nivelActualObj.mult;

  // 2. Renta 24 horas proyectada con el nuevo pasaporte
  const renta24hConPasaporte = baseSec * 3600 * 24 * mult * nivelProyectadoObj.mult;
  const renta22hConPasaporte = (baseSec * 3600 * 22 * mult + baseSec * 3600 * 2 * 1) * nivelProyectadoObj.mult;

  const extraDia24 = Math.max(0, renta24hConPasaporte - renta24hActual);
  const extraDia22 = Math.max(0, renta22hConPasaporte - renta22hActual);
  const extraMes24 = extraDia24 * 30;
  const extraAnio24 = extraDia24 * 365;

  // 3. Comparativa: ¿Y si en lugar de insignias compras parcelas con esos mismos AB?
  const totalParcelasSim = motor.total_parcelas + parcelasEquivalentes;
  const multSimParcelas = motor._get_tier_mult(totalParcelasSim, pais, TIERS_COMPLETOS);
  const baseSecParcelas = baseSec + (parcelasEquivalentes * motor.renta_promedio_sec);
  const renta24hConParcelas = baseSecParcelas * 3600 * 24 * multSimParcelas * nivelActualObj.mult;
  const extra24hConParcelas = renta24hConParcelas - renta24hActual;

  return (
    <GlowCard className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
        <div>
          <div className="text-xs text-amber-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
            <span>🏅</span> Calculadora de Insignias & Pasaporte (Objetivo 101 Insignias)
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">
            Calcula exactamente cuántos Atlas Bucks necesitas para alcanzar el Nivel 5 de Pasaporte (+25% boost) y compáralo con parcelas
          </div>
        </div>
        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
          200 AB / insignia
        </span>
      </div>

      {/* Selector de objetivo de insignias */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
          Selecciona tu Meta de Insignias o ingresa un número:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {nivelesPasaporte.map((n) => {
            const isSelected = objetivoInsignias === n.insignias;
            return (
              <button
                key={n.nivel}
                type="button"
                onClick={() => setObjetivoInsignias(n.insignias)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-amber-500/20 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/50"
                    : "bg-[#0c121d] border-white/5 text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="text-[10px] text-gray-400">{n.label}</div>
                <div className="text-sm font-bold font-mono text-amber-300">{n.insignias} insignias</div>
                <div className="text-[9px] text-gray-500">{(n.insignias * 200).toLocaleString()} AB</div>
              </button>
            );
          })}
        </div>

        {/* Input libre */}
        <div className="flex items-center gap-3 bg-[#0d1420] border border-amber-500/30 rounded-xl p-2.5">
          <span className="text-amber-400 font-bold text-sm pl-2">🎯 Meta personalizada:</span>
          <input
            type="number"
            min={1}
            max={500}
            value={objetivoInsignias}
            onChange={(e) => setObjetivoInsignias(Math.max(1, Number(e.target.value) || 1))}
            className="flex-1 bg-transparent text-lg font-bold text-white focus:outline-none font-mono"
          />
          <span className="text-xs text-gray-400 pr-2">Insignias Totales</span>
        </div>
      </div>

      {/* Grid de Métricas Clave de la Meta de Insignias */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#0b1019] p-3.5 rounded-xl border border-amber-500/20">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Insignias Faltantes</div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {faltantesInsignias > 0 ? `+${faltantesInsignias}` : "¡Alcanzada!"}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            Tienes {insigniasActuales} de {objetivoInsignias}
          </div>
        </div>

        <div className="bg-[#0b1019] p-3.5 rounded-xl border border-amber-500/20">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Costo Total en AB</div>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">
            {costoTotalAbInsignias.toLocaleString()} <span className="text-xs font-normal">AB</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            A 200 AB cada insignia
          </div>
        </div>

        <div className="bg-[#0b1019] p-3.5 rounded-xl border border-amber-500/20">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">AB Netos Faltantes</div>
          <div className="text-2xl font-bold font-mono text-purple-300 mt-1">
            {abNetosInsignias.toLocaleString()} <span className="text-xs font-normal">AB</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            Descontando tus {abAhorrados.toLocaleString()} AB
          </div>
        </div>

        <div className="bg-[#0b1019] p-3.5 rounded-xl border border-amber-500/20">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Equivalente en Parcelas</div>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
            {parcelasEquivalentes} <span className="text-xs font-normal">parcelas</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            A 100 AB por parcela
          </div>
        </div>
      </div>

      {/* Tiempos de ahorro y fechas exactas de calendario */}
      {faltantesInsignias > 0 && (
        <div className="p-4 bg-gradient-to-br from-[#0c1424] to-[#0a0e17] rounded-xl border border-amber-500/20 space-y-3">
          <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
            <span>⏱️ Tiempo Estimado para Reunir los {abNetosInsignias.toLocaleString()} AB</span>
            <span className="text-[10px] text-amber-400 font-mono">Meta: {objetivoInsignias} insignias</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-black/40 p-3 rounded-lg border border-cyan-500/20">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-cyan-300 flex items-center gap-1">
                  <span>⚡</span> Con Explorer Club (24/7):
                </span>
                <span className="font-mono font-bold text-white">{motor.formato_tiempo_exacto(diasEC)}</span>
              </div>
              <div className="text-[11px] text-gray-400">
                📅 Fecha estimada de logro: <strong className="text-cyan-400">{proyectarFechaMeta(diasEC)}</strong>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">Basado en promedio diario de {abEcDiarios.toFixed(1)} AB/día</div>
            </div>

            <div className="bg-black/40 p-3 rounded-lg border border-white/5">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-gray-300 flex items-center gap-1">
                  <span>🛡️</span> Modo Free to Play (F2P):
                </span>
                <span className="font-mono font-bold text-white">{motor.formato_tiempo_exacto(diasF2P)}</span>
              </div>
              <div className="text-[11px] text-gray-400">
                📅 Fecha estimada de logro: <strong className="text-gray-300">{proyectarFechaMeta(diasF2P)}</strong>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">Basado en promedio diario de {abPorDia.toFixed(1)} AB/día</div>
            </div>
          </div>
        </div>
      )}

      {/* Renta 24 Horas Exacta & Impacto del Pasaporte */}
      <div className="p-4 bg-[#0a0f18] rounded-xl border border-white/5 space-y-3">
        <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
          <span>📈 Impacto en tu Renta Exacta de 24 Horas</span>
          <span className="text-[10px] text-emerald-400 font-mono">
            Pasaporte: Nivel {nivelActualObj.nivel} (+{nivelActualObj.bonusPct}%) → Nivel {nivelProyectadoObj.nivel} (+{nivelProyectadoObj.bonusPct}%)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
            <div className="text-[10px] text-gray-500">Renta Actual (24/7)</div>
            <div className="text-sm sm:text-base font-bold font-mono text-white mt-0.5">${fmt(renta24hActual, 4)}</div>
            <div className="text-[9px] text-gray-400">USD cada 24 horas</div>
          </div>

          <div className="bg-black/40 p-2.5 rounded-lg border border-amber-500/20">
            <div className="text-[10px] text-amber-400 font-semibold">Renta Nueva (24/7)</div>
            <div className="text-sm sm:text-base font-bold font-mono text-amber-300 mt-0.5">${fmt(renta24hConPasaporte, 4)}</div>
            <div className="text-[9px] text-gray-400">USD cada 24 horas</div>
          </div>

          <div className="bg-black/40 p-2.5 rounded-lg border border-emerald-500/20">
            <div className="text-[10px] text-emerald-400 font-semibold">Extra Neta / Día</div>
            <div className="text-sm sm:text-base font-bold font-mono text-emerald-400 mt-0.5">+${fmt(extraDia24, 4)}</div>
            <div className="text-[9px] text-gray-400">+{((extraDia24 / renta24hActual) * 100 || 0).toFixed(1)}% aumento</div>
          </div>

          <div className="bg-black/40 p-2.5 rounded-lg border border-emerald-500/20">
            <div className="text-[10px] text-emerald-400 font-semibold">Extra Anual</div>
            <div className="text-sm sm:text-base font-bold font-mono text-emerald-300 mt-0.5">+${fmt(extraAnio24, 2)}</div>
            <div className="text-[9px] text-gray-400">USD al año de por vida</div>
          </div>
        </div>
      </div>

      {/* ⚖️ Comparativa Directa: ¿Insignias o Parcelas con esos mismos AB? */}
      <div className="p-4 bg-gradient-to-br from-[#121622] to-[#0a0f18] rounded-xl border border-cyan-900/40 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>⚖️</span> Comparativa Estratégica: ¿Insignias o Parcelas con esos {costoTotalAbInsignias.toLocaleString()} AB?
          </span>
          <span className="text-[10px] text-gray-400">Mismo capital de Atlas Bucks</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Opción A: Insignias */}
          <div className="bg-black/50 p-3.5 rounded-xl border border-amber-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <span>🏅</span> Opción A: {faltantesInsignias} Insignias
              </span>
              <span className="text-[10px] text-gray-400 font-mono">{costoTotalAbInsignias.toLocaleString()} AB</span>
            </div>
            <ul className="text-xs space-y-1 text-gray-300">
              <li>• Llegas a: <strong className="text-white">Nivel {nivelProyectadoObj.nivel} (+{nivelProyectadoObj.bonusPct}%)</strong></li>
              <li>• Multiplicador de Tier: <strong className="text-yellow-400">Se mantiene en {mult}x</strong> (sin caídas de tier)</li>
              <li>• Aumento diario 24h: <strong className="text-emerald-400">+${fmt(extraDia24, 4)} USD/día</strong></li>
              <li>• Aumento anual: <strong className="text-emerald-300 font-bold">+${fmt(extraAnio24, 2)} USD/año</strong></li>
            </ul>
          </div>

          {/* Opción B: Parcelas */}
          <div className="bg-black/50 p-3.5 rounded-xl border border-cyan-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                <span>🏞️</span> Opción B: +{parcelasEquivalentes} Parcelas
              </span>
              <span className="text-[10px] text-gray-400 font-mono">{costoTotalAbInsignias.toLocaleString()} AB</span>
            </div>
            <ul className="text-xs space-y-1 text-gray-300">
              <li>• Total de parcelas: <strong className="text-white">{totalParcelasSim} parcelas</strong></li>
              <li>• Multiplicador resultante: <strong className={multSimParcelas < mult ? "text-red-400" : "text-yellow-400"}>{multSimParcelas}x {multSimParcelas < mult ? "⚠️ (Caída de tier)" : ""}</strong></li>
              <li>• Renta diaria resultante: <strong className="text-cyan-400">${fmt(renta24hConParcelas, 4)} USD/día</strong></li>
              <li>• Diferencia diaria: <strong className={extra24hConParcelas >= 0 ? "text-emerald-400" : "text-red-400"}>{extra24hConParcelas >= 0 ? "+" : ""}${fmt(extra24hConParcelas, 4)} USD/día</strong></li>
            </ul>
          </div>
        </div>

        {/* Veredicto de la comparativa */}
        <div className={`p-3 rounded-lg text-xs leading-relaxed border ${
          extraDia24 >= extra24hConParcelas
            ? "bg-amber-950/30 border-amber-500/30 text-amber-200"
            : "bg-cyan-950/30 border-cyan-500/30 text-cyan-200"
        }`}>
          {extraDia24 >= extra24hConParcelas ? (
            <div>
              💡 <strong className="text-white">Veredicto Inteligente:</strong> Es más rentable comprar las <strong className="text-amber-300">{faltantesInsignias} insignias</strong> hasta el objetivo ({objetivoInsignias} insignias). Al comprar parcelas caerías de tramo o ganarías menos que el boost permanente de +{nivelProyectadoObj.bonusPct}% de pasaporte (+${fmt(extraDia24, 4)}/d vs {extra24hConParcelas >= 0 ? "+" : ""}${fmt(extra24hConParcelas, 4)}/d).
            </div>
          ) : (
            <div>
              💡 <strong className="text-white">Veredicto Inteligente:</strong> Es más rentable comprar las <strong className="text-cyan-300">+{parcelasEquivalentes} parcelas</strong> primero, ya que generan mayor incremento absoluto en tu renta diaria (+${fmt(extra24hConParcelas, 4)}/d vs +${fmt(extraDia24, 4)}/d).
            </div>
          )}
        </div>
      </div>
    </GlowCard>
  );
}

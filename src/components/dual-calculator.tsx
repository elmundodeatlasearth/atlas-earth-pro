// src/components/dual-calculator.tsx
// Calculadora Dual: "Lo que Tengo (y lo que genero)" vs "Lo que Necesito (Parcelas + Insignias + Tiempos)"
"use client";
import React, { useState, useMemo } from "react";
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
  abPorDia?: number;
  abEcDiarios?: number;
  horasSrb?: number;
  siguienteTramo?: number;
}

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
}: DualCalculatorProps) {
  // Inputs de la Calculadora 2 (Objetivo)
  const [metaParcelas, setMetaParcelas] = useState<number>(() => siguienteTramo > totalParcelas ? siguienteTramo : totalParcelas + 10);
  const [metaInsignias, setMetaInsignias] = useState<number>(() => Math.max(101, insigniasActuales));

  // --- CALCULADORA 1: LO QUE TENGO ---
  const pasaporteNivelActual = calcularNivelPasaporte(insigniasActuales);
  const pasaporteMultActual = 1 + (pasaporteNivelActual * 0.05);
  const baseSecActual = motor.renta_base; // USD/segundo de tus parcelas reales

  // Renta actual 24h
  const renta24hActual = baseSecActual * 86400 * multTier * pasaporteMultActual;
  const renta22hActual = (baseSecActual * 79200 * multTier + baseSecActual * 7200 * 1) * pasaporteMultActual;
  const rentaMesActual = (baseSecActual * 3600 * horasSrb * 50 + baseSecActual * 3600 * (720 - horasSrb) * multTier) * pasaporteMultActual;
  const rentaPromDiaActual = rentaMesActual / 30;

  // --- CALCULADORA 2: LO QUE NECESITO ---
  const faltanParcelas = Math.max(0, metaParcelas - totalParcelas);
  const faltanInsignias = Math.max(0, metaInsignias - insigniasActuales);

  // Costo en AB
  const costoParcelasAB = faltanParcelas * 100;
  const costoInsigniasAB = faltanInsignias * 200;
  const costoTotalAB = costoParcelasAB + costoInsigniasAB;
  const abNetosFaltantes = Math.max(0, costoTotalAB - abAhorrados);

  // Nueva configuración simulada
  const nuevoTotalParcelas = totalParcelas + faltanParcelas;
  const nuevoMultTier = motor._get_tier_mult(nuevoTotalParcelas, pais, TIERS_COMPLETOS);
  const nuevoTotalInsignias = insigniasActuales + faltanInsignias;
  const nuevoPasaporteNivel = calcularNivelPasaporte(nuevoTotalInsignias);
  const nuevoPasaporteMult = 1 + (nuevoPasaporteNivel * 0.05);

  // Nueva renta simulada
  const nuevaBaseSec = baseSecActual + (faltanParcelas * 1.58e-9);
  const renta24hNueva = nuevaBaseSec * 86400 * nuevoMultTier * nuevoPasaporteMult;
  const renta22hNueva = (nuevaBaseSec * 79200 * nuevoMultTier + nuevaBaseSec * 7200 * 1) * nuevoPasaporteMult;
  const rentaMesNueva = (nuevaBaseSec * 3600 * horasSrb * 50 + nuevaBaseSec * 3600 * (720 - horasSrb) * nuevoMultTier) * nuevoPasaporteMult;
  const rentaPromDiaNueva = rentaMesNueva / 30;

  // Diferencias netas
  const extraDia24 = renta24hNueva - renta24hActual;
  const extraDiaPromSrb = rentaPromDiaNueva - rentaPromDiaActual;
  const extraAnio = (rentaMesNueva * 12) - (rentaMesActual * 12);

  // Tiempos estimados
  const diasEC = abEcDiarios > 0 ? abNetosFaltantes / abEcDiarios : 0;
  const diasF2P = abPorDia > 0 ? abNetosFaltantes / abPorDia : 0;

  return (
    <div className="space-y-4">
      {/* Encabezado del Bloque Dual */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div>
          <div className="text-xs uppercase tracking-widest font-black text-cyan-400 flex items-center gap-2">
            <span className="text-sm">⚖️</span>
            <span>Calculadora Dual: Lo que Tengo vs Lo que Necesito</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Compara en tiempo real lo que generas hoy frente a cualquier combinación de parcelas e insignias que desees alcanzar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
            1 Parcela = 100 AB
          </span>
          <span className="text-[10px] font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
            1 Insignia = 200 AB
          </span>
        </div>
      </div>

      {/* Grid de 2 Columnas Sincronizadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ========================================================= */}
        {/* CALCULADORA 1: TU ESTADO ACTUAL (LO QUE TIENES Y GENERAS) */}
        {/* ========================================================= */}
        <GlowCard className="border-cyan-500/20 bg-gradient-to-b from-[#0a121e] to-[#070b12] p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <span>🟢</span> Calculadora 1: Tu Estado Actual
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono font-bold">
                {multTier}x Multiplicador
              </span>
            </div>

            {/* Inventario actual */}
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                <div className="text-[10px] text-gray-400 uppercase">🏞️ Parcelas Actuales</div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">{totalParcelas.toLocaleString()}</div>
                <div className="text-[9px] text-gray-500 mt-0.5">
                  {parcelasC}C · {parcelasR}R · {parcelasE}E · {parcelasL}L
                </div>
              </div>

              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                <div className="text-[10px] text-gray-400 uppercase">🏅 Insignias Actuales</div>
                <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">{insigniasActuales}</div>
                <div className="text-[9px] text-gray-500 mt-0.5">
                  Pasaporte Nivel {pasaporteNivelActual} (+{pasaporteNivelActual * 5}%)
                </div>
              </div>
            </div>

            {/* Cartera AB */}
            <div className="p-2.5 bg-cyan-950/20 border border-cyan-500/20 rounded-xl flex items-center justify-between text-xs mb-3">
              <span className="text-gray-300">🪙 Saldo en Cartera:</span>
              <span className="font-mono font-bold text-cyan-300">{abAhorrados.toLocaleString()} AB</span>
            </div>

            {/* Renta que estás generando */}
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                💵 Cuánto estás generando exactamente:
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-black/50 p-2 rounded-lg border border-amber-500/20">
                  <div className="text-[10px] text-amber-400 font-semibold">⚡ Con Explorer Club (24/7)</div>
                  <div className="text-base font-bold font-mono text-white mt-0.5">${fmt(renta24hActual, 4)}</div>
                  <div className="text-[9px] text-gray-400">USD cada 24 horas</div>
                </div>

                <div className="bg-black/50 p-2 rounded-lg border border-cyan-500/20">
                  <div className="text-[10px] text-cyan-400 font-semibold">🌙 Modo Normal (22h)</div>
                  <div className="text-base font-bold font-mono text-white mt-0.5">${fmt(renta22hActual, 4)}</div>
                  <div className="text-[9px] text-gray-400">USD cada 24 horas</div>
                </div>
              </div>

              <div className="p-2.5 bg-black/40 rounded-lg border border-white/5 flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">🚀 Promedio diario con SRB ({horasSrb}h):</span>
                <span className="text-emerald-400 font-bold">${fmt(rentaPromDiaActual, 4)} USD/día</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5 text-[10px] text-gray-500 text-center">
            Renta base por segundo: <span className="font-mono text-gray-300">${fmt(baseSecActual, 9)}/s</span>
          </div>
        </GlowCard>

        {/* ========================================================= */}
        {/* CALCULADORA 2: TU OBJETIVO (LO QUE NECESITAS Y TIEMPOS) */}
        {/* ========================================================= */}
        <GlowCard className="border-purple-500/20 bg-gradient-to-b from-[#130f22] to-[#090712] p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <span>🎯</span> Calculadora 2: Lo que Necesitas (Objetivo)
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                nuevoMultTier < multTier ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-purple-500/10 text-purple-300 border-purple-500/30"
              }`}>
                {nuevoMultTier}x Resultante
              </span>
            </div>

            {/* Controles interactivos de entrada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              {/* Control Parcelas Objetivo */}
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase">
                  <span>🏞️ Meta Parcelas</span>
                  <span className="text-cyan-400 font-mono font-bold">
                    {faltanParcelas > 0 ? `+${faltanParcelas}` : "0"} faltan
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={totalParcelas}
                    value={metaParcelas}
                    onChange={(e) => setMetaParcelas(Math.max(totalParcelas, Number(e.target.value) || totalParcelas))}
                    className="w-full bg-[#181424] border border-cyan-500/40 rounded-lg px-2.5 py-1.5 text-base font-bold font-mono text-white focus:outline-none"
                  />
                </div>
                <div className="flex gap-1">
                  {[10, 50, siguienteTramo - totalParcelas].filter(n => n > 0).slice(0, 3).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMetaParcelas(totalParcelas + n)}
                      className="flex-1 py-0.5 text-[9px] font-bold rounded bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5"
                    >
                      +{n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Control Insignias Objetivo */}
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase">
                  <span>🏅 Meta Insignias</span>
                  <span className="text-amber-400 font-mono font-bold">
                    {faltanInsignias > 0 ? `+${faltanInsignias}` : "0"} faltan
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={insigniasActuales}
                    value={metaInsignias}
                    onChange={(e) => setMetaInsignias(Math.max(insigniasActuales, Number(e.target.value) || insigniasActuales))}
                    className="w-full bg-[#181424] border border-amber-500/40 rounded-lg px-2.5 py-1.5 text-base font-bold font-mono text-white focus:outline-none"
                  />
                </div>
                <div className="flex gap-1">
                  {[31, 61, 101].filter(n => n >= insigniasActuales).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMetaInsignias(n)}
                      className={`flex-1 py-0.5 text-[9px] font-bold rounded border ${
                        metaInsignias === n
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-white/5 text-gray-300 border-white/5 hover:bg-white/10"
                      }`}
                    >
                      {n} (Nvl {calcularNivelPasaporte(n)})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Costo exacto en AB */}
            <div className="grid grid-cols-3 gap-2 mb-3 text-center">
              <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                <div className="text-[9px] text-gray-400 uppercase">AB Parcelas</div>
                <div className="text-xs font-bold font-mono text-cyan-300">{costoParcelasAB.toLocaleString()} AB</div>
              </div>
              <div className="bg-black/40 p-2 rounded-lg border border-white/5">
                <div className="text-[9px] text-gray-400 uppercase">AB Insignias</div>
                <div className="text-xs font-bold font-mono text-amber-300">{costoInsigniasAB.toLocaleString()} AB</div>
              </div>
              <div className="bg-black/40 p-2 rounded-lg border border-purple-500/20">
                <div className="text-[9px] text-purple-300 uppercase font-semibold">Total AB</div>
                <div className="text-xs font-bold font-mono text-white">{costoTotalAB.toLocaleString()} AB</div>
              </div>
            </div>

            {/* Renta Resultante y Ganancia Neta */}
            <div className="p-3 bg-gradient-to-r from-[#1c1232] to-[#110c22] border border-purple-500/30 rounded-xl space-y-2 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">📈 Nueva Renta 24h (24/7):</span>
                <span className="font-mono font-bold text-white text-sm">${fmt(renta24hNueva, 4)} USD/día</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-white/5 pt-1.5">
                <span className="text-emerald-400 font-semibold">⚡ Ganancia Neta Adicional:</span>
                <span className={`font-mono font-bold ${extraDia24 >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {extraDia24 >= 0 ? "+" : ""}${fmt(extraDia24, 4)} USD/24h (+${fmt(extraAnio, 2)}/año)
                </span>
              </div>
            </div>

            {/* Tiempos y Fechas de Calendario */}
            {costoTotalAB > 0 ? (
              <div className="space-y-1.5 text-[11px] bg-black/40 p-2.5 rounded-xl border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-amber-300 font-semibold flex items-center gap-1">
                    <span>⚡</span> Con Explorer Club:
                  </span>
                  <span className="font-mono text-white font-bold">{motor.formato_tiempo_exacto(diasEC)}</span>
                </div>
                <div className="text-[10px] text-gray-400 pl-4">
                  📅 Fecha estimada: <strong className="text-cyan-400">{proyectarFechaMeta(diasEC)}</strong>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-gray-300 flex items-center gap-1">
                    <span>🛡️</span> Modo Free to Play:
                  </span>
                  <span className="font-mono text-white font-bold">{motor.formato_tiempo_exacto(diasF2P)}</span>
                </div>
                <div className="text-[10px] text-gray-400 pl-4">
                  📅 Fecha estimada: <strong className="text-gray-300">{proyectarFechaMeta(diasF2P)}</strong>
                </div>
              </div>
            ) : (
              <div className="text-xs text-center text-emerald-400 font-bold p-2 bg-emerald-950/20 rounded-lg">
                ✅ Ya tienes o superas esta cantidad de parcelas e insignias.
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-white/5 text-[10px] text-purple-300/80 text-center">
            {faltanParcelas === 0 && faltanInsignias === 0
              ? "Objetivo idéntico al actual"
              : `Requiere ${abNetosFaltantes.toLocaleString()} AB netos adicionales tras usar tu saldo`}
          </div>
        </GlowCard>
      </div>
    </div>
  );
}

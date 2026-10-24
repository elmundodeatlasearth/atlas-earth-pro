// src/components/minigames-calc.tsx
// Calculadora de Rentabilidad de Minijuegos (Racer, Fishing, Golf, Warship)
"use client";
import React, { useState, useMemo } from "react";
import { GlowCard } from "./stat-card";
import { calcularMinijuegoROI } from "@/utils/atlasMath";

export default function MinigamesCalculator() {
  const [partidas, setPartidas] = useState<number>(50);
  const [premioBracket, setPremioBracket] = useState<number>(300); // 300 AB típico de Top 100
  const [minijuegoTipo, setMinijuegoTipo] = useState<string>("Racer");

  const BRACKETS = [
    { label: "Top 500 (Nacional)", premio: 100 },
    { label: "Top 100 (Nacional)", premio: 300 },
    { label: "Top 50 (Nacional)", premio: 500 },
    { label: "Top 25 (Nacional)", premio: 800 },
    { label: "Top 10 (Nacional)", premio: 1200 },
    { label: "Podio (Top 3)", premio: 2000 },
  ];

  const resultado = useMemo(() => {
    return calcularMinijuegoROI(partidas, premioBracket);
  }, [partidas, premioBracket]);

  return (
    <GlowCard>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="text-xs text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
          <span>🎮</span> Calculadora de Rentabilidad de Minijuegos
        </div>
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
          Racer • Fishing • Golf • Warship
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-4 leading-relaxed">
        Calcula si te conviene competir en el evento semanal de Atlas Earth. Evalúa el gasto de 2 AB por partida frente a los premios de la tabla de clasificación.
      </p>

      {/* Selector de Minijuego */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {["🏎️ Racer", "🎣 Fishing", "⛳ Golf", "🚢 Warship"].map((juego) => (
          <button
            key={juego}
            onClick={() => setMinijuegoTipo(juego)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              minijuegoTipo === juego
                ? "bg-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
            }`}
          >
            {juego}
          </button>
        ))}
      </div>

      {/* Controles de Entrada */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-black/40 rounded-xl border border-white/5 mb-4">
        {/* Partidas a jugar */}
        <div>
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">
            Partidas estimadas a jugar (2 AB por partida):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={300}
              value={partidas}
              onChange={(e) => setPartidas(Math.max(1, Number(e.target.value) || 1))}
              className="w-24 bg-[#131b26] border border-cyan-500/40 rounded-lg px-3 py-1.5 text-base font-bold text-white font-mono focus:outline-none"
            />
            <div className="flex gap-1 flex-1">
              {[30, 50, 75, 100].map((num) => (
                <button
                  key={num}
                  onClick={() => setPartidas(num)}
                  className={`flex-1 py-1 text-xs rounded border transition-colors ${
                    partidas === num
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                      : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
          <span className="text-[10px] text-gray-500 mt-1 block">
            Costo de entrada: <strong className="text-yellow-400 font-mono">{partidas * 2} AB</strong>
          </span>
        </div>

        {/* Bracket de Premio */}
        <div>
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">
            Premio estimado según tu posición:
          </label>
          <select
            value={premioBracket}
            onChange={(e) => setPremioBracket(Number(e.target.value))}
            className="w-full bg-[#131b26] border border-cyan-500/40 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none"
          >
            {BRACKETS.map((b) => (
              <option key={b.label} value={b.premio}>
                {b.label} — {b.premio} AB
              </option>
            ))}
          </select>
          <span className="text-[10px] text-gray-500 mt-1 block">
            Premio bruto: <strong className="text-emerald-400 font-mono">{premioBracket} AB</strong>
          </span>
        </div>
      </div>

      {/* Resultados ROI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <div className="bg-[#0e1624] rounded-xl p-3 border border-white/5">
          <div className="text-[10px] text-gray-400 uppercase font-semibold">🪙 Gasto en Partidas</div>
          <div className="text-lg font-bold text-yellow-400 font-mono">-{resultado.costoAb} AB</div>
          <div className="text-[10px] text-gray-500">{partidas} partidas jugadas</div>
        </div>

        <div className="bg-[#0e1624] rounded-xl p-3 border border-white/5">
          <div className="text-[10px] text-gray-400 uppercase font-semibold">🏆 Recompensa Bruta</div>
          <div className="text-lg font-bold text-cyan-300 font-mono">+{resultado.premioAb} AB</div>
          <div className="text-[10px] text-gray-500">Premio por ranking</div>
        </div>

        <div className="bg-[#0e1624] rounded-xl p-3 border border-white/5">
          <div className="text-[10px] text-gray-400 uppercase font-semibold">⚡ Ganancia Neta</div>
          <div
            className={`text-lg font-bold font-mono ${
              resultado.gananciaNetaAb >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {resultado.gananciaNetaAb >= 0 ? "+" : ""}
            {resultado.gananciaNetaAb} AB
          </div>
          <div className="text-[10px] text-gray-500">ROI: {resultado.roiPct.toFixed(0)}%</div>
        </div>

        <div className="bg-[#0e1624] rounded-xl p-3 border border-white/5">
          <div className="text-[10px] text-gray-400 uppercase font-semibold">🏞️ Parcelas Equivalentes</div>
          <div className="text-lg font-bold text-white font-mono">
            {resultado.parcelasEquivalentes >= 0
              ? `+${resultado.parcelasEquivalentes}`
              : `${resultado.parcelasEquivalentes}`}
          </div>
          <div className="text-[10px] text-gray-500">Parcelas ganadas netas</div>
        </div>
      </div>

      {/* Veredicto de Rentabilidad */}
      <div
        className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
          resultado.esRentable
            ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
            : "bg-red-950/30 border-red-500/40 text-red-300"
        }`}
      >
        <span>{resultado.veredicto}</span>
        {resultado.esRentable && (
          <span className="text-[11px] font-mono font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-300">
            +{resultado.gananciaNetaAb} AB limpios
          </span>
        )}
      </div>
    </GlowCard>
  );
}

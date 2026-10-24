// src/components/donut-chart.tsx
// Gráfico Donut SVG interactivo con Índice de Suerte de Rareza
"use client";
import React, { useMemo } from "react";
import { calcularIndiceSuerte, fmt } from "@/utils/atlasMath";

interface DonutChartProps {
  parcelasC: number;
  parcelasR: number;
  parcelasE: number;
  parcelasL: number;
  pasaporteMult?: number;
  horasBoost?: number;
  eficiencia?: number;
  tierMult?: number;
  horasSrb?: number;
}

export default function RarityDonutChart({
  parcelasC,
  parcelasR,
  parcelasE,
  parcelasL,
  pasaporteMult = 1.25,
  horasBoost = 22,
  eficiencia = 100,
  tierMult = 10,
  horasSrb = 64,
}: DonutChartProps) {
  const suerte = useMemo(() => {
    return calcularIndiceSuerte(
      { c: parcelasC, r: parcelasR, e: parcelasE, l: parcelasL },
      pasaporteMult,
      horasBoost,
      eficiencia,
      tierMult,
      horasSrb
    );
  }, [parcelasC, parcelasR, parcelasE, parcelasL, pasaporteMult, horasBoost, eficiencia, tierMult, horasSrb]);

  const total = suerte.total;

  // Segmentos del Donut
  const segments = useMemo(() => {
    if (total === 0) return [];
    const items = [
      { name: "Común", count: parcelasC, pct: suerte.pctComun, target: 50, color: "#64748b", stroke: "stroke-slate-500", bg: "bg-slate-500" },
      { name: "Rara", count: parcelasR, pct: suerte.pctRara, target: 30, color: "#10b981", stroke: "stroke-emerald-500", bg: "bg-emerald-500" },
      { name: "Épica", count: parcelasE, pct: suerte.pctEpica, target: 15, color: "#8b5cf6", stroke: "stroke-purple-500", bg: "bg-purple-500" },
      { name: "Legendaria", count: parcelasL, pct: suerte.pctLegendaria, target: 5, color: "#f59e0b", stroke: "stroke-amber-400", bg: "bg-amber-400" },
    ];

    // Radio y circunferencia
    const radius = 38;
    const circ = 2 * Math.PI * radius;
    let accumulatedPct = 0;

    return items.map((item) => {
      const strokeDasharray = `${(item.pct / 100) * circ} ${circ}`;
      const strokeDashoffset = -((accumulatedPct / 100) * circ);
      accumulatedPct += item.pct;
      return {
        ...item,
        radius,
        circ,
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [total, parcelasC, parcelasR, parcelasE, parcelasL, suerte]);

  if (total === 0) {
    return (
      <div className="p-4 text-center text-xs text-gray-500">
        Agrega parcelas para ver el gráfico de distribución de rarezas.
      </div>
    );
  }

  const suerteColor =
    suerte.desviacionPct >= 5
      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
      : suerte.desviacionPct >= 0
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : "text-blue-400 border-blue-500/30 bg-blue-500/10";

  return (
    <div className="space-y-4">
      {/* Header con índice de suerte */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border bg-black/30">
        <div>
          <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
            🍀 Índice de Suerte del Portafolio
          </div>
          <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
            <span>{suerte.veredicto}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-mono font-bold ${suerteColor}`}>
              {suerte.desviacionPct >= 0 ? "+" : ""}
              {suerte.desviacionPct.toFixed(1)}%
            </span>
          </div>
        </div>
        {suerte.gananciaExtraAnualUsd !== 0 && (
          <div className="text-right">
            <div className="text-[10px] text-gray-500">Impacto anual estimado</div>
            <div
              className={`text-xs font-mono font-bold ${
                suerte.gananciaExtraAnualUsd >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {suerte.gananciaExtraAnualUsd >= 0 ? "+" : ""}
              ${fmt(suerte.gananciaExtraAnualUsd, 2)} USD/año
            </div>
          </div>
        )}
      </div>

      {/* Donut SVG y Comparativa */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Gráfico Donut SVG */}
        <div className="sm:col-span-5 flex justify-center">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="38"
                className="stroke-white/5"
                strokeWidth="12"
                fill="transparent"
              />
              {segments.map((s) => (
                <circle
                  key={s.name}
                  cx="50"
                  cy="50"
                  r={s.radius}
                  stroke={s.color}
                  strokeWidth="12"
                  strokeDasharray={s.strokeDasharray}
                  strokeDashoffset={s.strokeDashoffset}
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-gray-400">Total</span>
              <span className="text-xl font-black text-white font-mono">{total}</span>
              <span className="text-[10px] text-cyan-400 font-semibold">Parcelas</span>
            </div>
          </div>
        </div>

        {/* Barras de comparación: Real vs Teórico */}
        <div className="sm:col-span-7 space-y-2.5">
          {segments.map((s) => {
            const diff = s.pct - s.target;
            return (
              <div key={s.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${s.bg}`} />
                    <span className="font-semibold text-gray-300">{s.name}</span>
                    <span className="text-gray-500 font-mono text-[11px]">({s.count})</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-white font-bold">{s.pct.toFixed(1)}%</span>
                    <span className="text-gray-500 text-[10px]">esperado {s.target}%</span>
                    <span
                      className={`text-[10px] font-bold ${
                        diff >= 0 ? "text-emerald-400" : "text-gray-500"
                      }`}
                    >
                      {diff >= 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`}
                    </span>
                  </div>
                </div>

                {/* Doble barra comparativa */}
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (s.pct / 60) * 100)}%`, backgroundColor: s.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

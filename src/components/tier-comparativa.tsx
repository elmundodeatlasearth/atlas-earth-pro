// src/components/tier-comparativa.tsx
// Comparativa Detallada de Tiers — USA vs País a elegir
// Muestra nivel por nivel: rango, multiplicador, renta estimada y % vs USA

"use client";
import { useState } from "react";
import { TIERS_COMPLETOS, MAP_MONEDAS, PAISES_DISPONIBLES, MotorAtlasEarth, fmt } from "@/utils/atlasMath";
import { GlowCard } from "./stat-card";

interface TierComparativaProps {
  motor: MotorAtlasEarth;
  paisActual: string;
  monedaActual: string;
  allowMultiCountry?: boolean; // ULTRA-only: selector de país
}

interface TierRow {
  num: number;
  desde: number;
  hasta: number | null;
  rango: string;
  mult: number;
  rentaTope: number;
  activo: boolean;
  progreso: number;
}

function buildTierRows(motor: MotorAtlasEarth, pais: string, totalParcelas: number): TierRow[] {
  const info = TIERS_COMPLETOS[pais];
  if (!info) return [];

  const rows: TierRow[] = [];
  let desde = 0;

  for (let i = 0; i < info.limites.length; i++) {
    const hasta = info.limites[i];
    const mult = info.multiplicadores[i];
    const activo = totalParcelas >= desde && totalParcelas < hasta;
    const progreso = activo && hasta > desde ? ((totalParcelas - desde) / (hasta - desde)) * 100 : activo ? 100 : 0;
    const rentaTope = motor.calcular_renta_generica(hasta, pais, TIERS_COMPLETOS, 0);

    rows.push({ num: i + 1, desde, hasta, rango: `${desde.toLocaleString()} — ${hasta.toLocaleString()}`, mult, rentaTope, activo, progreso });
    desde = hasta;
  }

  const lastMult = info.multiplicadores[info.multiplicadores.length - 1];
  const activoFinal = totalParcelas >= desde;
  const ultimoHasta = Math.max(totalParcelas, desde * 2);
  const rentaFin = motor.calcular_renta_generica(ultimoHasta, pais, TIERS_COMPLETOS, 0);

  rows.push({
    num: info.limites.length + 1,
    desde,
    hasta: null,
    rango: `${desde.toLocaleString()} +`,
    mult: lastMult,
    rentaTope: rentaFin,
    activo: activoFinal,
    progreso: 100,
  });

  return rows;
}

function calcularRentaActual(motor: MotorAtlasEarth, pais: string): number {
  return motor.calcular_renta_generica(motor.total_parcelas, pais, TIERS_COMPLETOS, 0);
}

export default function TierComparativa({ motor, paisActual, monedaActual, allowMultiCountry = false }: TierComparativaProps) {
  const total = motor.total_parcelas;
  // país a comparar — solo ULTRA puede elegir, PRO usa el mismo país
  const [paisComparar, setPaisComparar] = useState(paisActual);

  const rowsUSA = buildTierRows(motor, "Estados Unidos", total);
  const rowsPais = buildTierRows(motor, paisComparar, total);

  const multActualUSA = motor._get_tier_mult(total, "Estados Unidos", TIERS_COMPLETOS);
  const multActualPais = motor._get_tier_mult(total, paisComparar, TIERS_COMPLETOS);
  const rentaActualUSA = calcularRentaActual(motor, "Estados Unidos");
  const rentaActualPais = calcularRentaActual(motor, paisComparar);

  const indiceActualUSA = rowsUSA.findIndex(r => r.activo);
  const indiceActualPais = rowsPais.findIndex(r => r.activo);

  const diffPct = rentaActualUSA > 0 ? ((rentaActualPais - rentaActualUSA) / rentaActualUSA) * 100 : 0;
  const monedaPaisComparar = MAP_MONEDAS[paisComparar] || "USD";

  return (
    <GlowCard>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 mb-4">
        <div className="text-xs text-gray-500 uppercase tracking-widest flex items-center gap-2">
          🏛️ Comparativa Detallada de Tiers
          <span className="text-[9px] text-gray-600 font-normal normal-case">
            Nivel por nivel • renta estimada • diferencia vs USA
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-500/60 animate-pulse" />
            {total.toLocaleString()} parcelas
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* ===== TABLA USA ===== */}
        <div className="bg-[#0a0a0f] rounded-xl border border-white/[3%] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 bg-cyan-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🇺🇸</span>
                <span className="font-bold text-sm text-cyan-400">Estados Unidos</span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">USD</span>
            </div>
            <div className="text-[10px] text-gray-600 mt-1">
              {rowsUSA.length} niveles · {multActualUSA}x actual · ${fmt(rentaActualUSA, 8)}/día · {total.toLocaleString()} parcelas
            </div>
          </div>

          <div className="overflow-x-auto max-h-[480px] overflow-y-auto scrollbar-thin">
            <table className="w-full text-left text-[11px]">
              <thead className="sticky top-0 bg-[#0a0a0f] z-10">
                <tr className="text-[9px] uppercase tracking-wider text-gray-600 border-b border-white/[2%]">
                  <th className="py-2 px-3 font-semibold w-8">#</th>
                  <th className="py-2 px-3 font-semibold">Rango Parcelas</th>
                  <th className="py-2 px-3 font-semibold text-right">Mult</th>
                  <th className="py-2 px-3 font-semibold text-right">Renta/Día</th>
                </tr>
              </thead>
              <tbody>
                {rowsUSA.map((row, i) => {
                  const isActive = row.activo;
                  return (
                    <tr key={i} className={`border-b border-white/[1.5%] transition-all duration-300 ${isActive ? "bg-cyan-500/8 border-l-2 border-l-cyan-400 shadow-[inset_0_0_15px_rgba(0,221,221,0.06)]" : "hover:bg-white/[1%]"}`}>
                      <td className={`py-2 px-3 font-mono ${isActive ? "text-cyan-400 font-bold" : "text-gray-600"}`}>
                        {isActive && <span className="inline-block w-1.5 h-1.5 bg-cyan-400 rounded-full mr-1.5 animate-pulse" />}
                        {row.num}
                      </td>
                      <td className={`py-2 px-3 font-mono ${isActive ? "text-white font-semibold" : "text-gray-400"}`}>{row.rango}</td>
                      <td className={`py-2 px-3 text-right font-bold ${isActive ? "text-green-400" : row.mult >= 30 ? "text-green-400/70" : row.mult >= 10 ? "text-yellow-400/70" : "text-gray-500"}`}>
                        {row.mult}x
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-gray-300">${fmt(row.rentaTope, row.rentaTope < 0.01 ? 8 : 6)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {indiceActualUSA >= 0 && indiceActualUSA < rowsUSA.length && (
            <div className="px-4 py-2.5 border-t border-white/5 bg-white/[1%]">
              <div className="flex justify-between text-[10px] text-gray-500 mb-1.5">
                <span>Progreso en nivel {rowsUSA[indiceActualUSA].num}</span>
                <span className="text-cyan-400 font-semibold">{rowsUSA[indiceActualUSA].progreso.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-[#222] rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 to-blue-400 h-1.5 rounded-full transition-all duration-700" style={{ width: `${rowsUSA[indiceActualUSA].progreso}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* ===== TABLA PAÍS A ELEGIR ===== */}
        <div className="bg-[#0a0a0f] rounded-xl border border-white/[3%] overflow-hidden">
          {/* Cabecera con SELECTOR de país */}
          <div className="px-4 py-3 border-b border-white/5 bg-amber-500/5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-lg shrink-0">🌍</span>
                {allowMultiCountry ? (
                  <select
                    value={paisComparar}
                    onChange={(e) => setPaisComparar(e.target.value)}
                    className="bg-transparent border border-white/10 rounded-lg px-2 py-1 text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-500/50 cursor-pointer hover:bg-white/5 transition-colors appearance-none"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundPosition: "right 4px center", backgroundRepeat: "no-repeat", backgroundSize: "16px", paddingRight: "28px" }}
                  >
                    {PAISES_DISPONIBLES.map(p => (
                      <option key={p} value={p} className="bg-[#1a1a1a] text-white">{p}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm font-bold text-amber-400">{paisComparar}</span>
                )}
              </div>
              <span className="text-[10px] text-gray-500 font-mono shrink-0">{monedaPaisComparar}</span>
            </div>
            <div className="text-[10px] text-gray-600 mt-1">
              {rowsPais.length} niveles · {multActualPais}x actual · ${fmt(rentaActualPais, 8)}/día · {total.toLocaleString()} parcelas
            </div>
          </div>

          <div className="overflow-x-auto max-h-[480px] overflow-y-auto scrollbar-thin">
            <table className="w-full text-left text-[11px]">
              <thead className="sticky top-0 bg-[#0a0a0f] z-10">
                <tr className="text-[9px] uppercase tracking-wider text-gray-600 border-b border-white/[2%]">
                  <th className="py-2 px-3 font-semibold w-8">#</th>
                  <th className="py-2 px-3 font-semibold">Rango Parcelas</th>
                  <th className="py-2 px-3 font-semibold text-right">Mult</th>
                  <th className="py-2 px-3 font-semibold text-right">Renta/Día</th>
                  <th className="py-2 px-3 font-semibold text-right">vs USA</th>
                </tr>
              </thead>
              <tbody>
                {rowsPais.map((row, i) => {
                  const isActive = row.activo;
                  const usaRow = rowsUSA[i];
                  const diffRenta = usaRow && usaRow.rentaTope > 0 ? ((row.rentaTope - usaRow.rentaTope) / usaRow.rentaTope) * 100 : 0;

                  return (
                    <tr key={i} className={`border-b border-white/[1.5%] transition-all duration-300 ${isActive ? "bg-amber-500/8 border-l-2 border-l-amber-400 shadow-[inset_0_0_15px_rgba(251,191,36,0.06)]" : "hover:bg-white/[1%]"}`}>
                      <td className={`py-2 px-3 font-mono ${isActive ? "text-amber-400 font-bold" : "text-gray-600"}`}>
                        {isActive && <span className="inline-block w-1.5 h-1.5 bg-amber-400 rounded-full mr-1.5 animate-pulse" />}
                        {row.num}
                      </td>
                      <td className={`py-2 px-3 font-mono ${isActive ? "text-white font-semibold" : "text-gray-400"}`}>{row.rango}</td>
                      <td className={`py-2 px-3 text-right font-bold ${isActive ? "text-green-400" : row.mult >= 20 ? "text-green-400/70" : row.mult >= 10 ? "text-yellow-400/70" : "text-gray-500"}`}>
                        {row.mult}x
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-gray-300">${fmt(row.rentaTope, row.rentaTope < 0.01 ? 8 : 6)}</td>
                      <td className="py-2 px-3 text-right">
                        {usaRow ? (
                          <span className={`font-bold text-[10px] ${diffRenta >= -5 ? "text-green-400" : "text-red-400"}`}>
                            {diffRenta.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {indiceActualPais >= 0 && indiceActualPais < rowsPais.length && (
            <div className="px-4 py-2.5 border-t border-white/5 bg-white/[1%]">
              <div className="flex justify-between text-[10px] text-gray-500 mb-1.5">
                <span>Progreso en nivel {rowsPais[indiceActualPais].num}</span>
                <span className="text-amber-400 font-semibold">{rowsPais[indiceActualPais].progreso.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-[#222] rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-400 h-1.5 rounded-full transition-all duration-700" style={{ width: `${rowsPais[indiceActualPais].progreso}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resumen comparativo */}
      <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 lg:grid-cols-4 gap-3 text-[10px]">
        <div className="bg-[#0e0e0e] rounded-lg p-2.5 border border-white/5">
          <div className="text-gray-500 mb-0.5">Mult. en USA</div>
          <div className="font-bold text-cyan-400">{multActualUSA}x</div>
          <div className="text-gray-600">vs {multActualPais}x en {paisComparar}</div>
        </div>
        <div className="bg-[#0e0e0e] rounded-lg p-2.5 border border-white/5">
          <div className="text-gray-500 mb-0.5">Renta/Día en USA</div>
          <div className="font-bold text-cyan-300">${fmt(rentaActualUSA, 8)}</div>
          <div className="text-gray-600">${fmt(rentaActualPais, 8)} en {paisComparar}</div>
        </div>
        <div className="bg-[#0e0e0e] rounded-lg p-2.5 border border-white/5">
          <div className="text-gray-500 mb-0.5">Diferencia vs USA</div>
          <div className={`font-bold ${diffPct >= 0 ? "text-green-400" : "text-red-400"}`}>
            {diffPct >= 0 ? "+" : ""}{diffPct.toFixed(1)}%
          </div>
          <div className="text-gray-600">{paisComparar} vs Estados Unidos</div>
        </div>
        <div className="bg-[#0e0e0e] rounded-lg p-2.5 border border-white/5">
          <div className="text-gray-500 mb-0.5">Próximo salto en {paisComparar}</div>
          <div className="font-bold text-yellow-400">
            {(() => { const a = rowsPais.find(r => r.activo); return a?.hasta ? `${a.hasta.toLocaleString()} parcelas` : "—"; })()}
          </div>
          <div className="text-gray-600">
            {(() => { const a = rowsPais.find(r => r.activo); return a?.hasta ? `faltan ${Math.max(0, a.hasta - total)}` : "último nivel"; })()}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[9px] text-gray-600">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400/50" /> Mult. alto</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400/50" /> Mult. medio</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-500/50" /> Mult. bajo</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Tu posición actual</span>
      </div>
    </GlowCard>
  );
}

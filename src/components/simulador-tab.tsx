// src/components/simulador-tab.tsx
// Tab de Simulador con inversión inmediata, parcela vs insignia, Explorer Club optimizer y ROI
// FREE: bloqueado con preview
// PRO/ULTRA: completo

"use client";
import { useState, useMemo } from "react";
import { MetricBox, GlowCard } from "./stat-card";
import { fmt, TIERS_COMPLETOS, type VentanaEC } from "@/utils/atlasMath";
import type { MotorAtlasEarth } from "@/utils/atlasMath";
import LockedFeature from "./LockedFeature";
import type { Permissions } from "@/hooks/usePermissions";

interface SimuladorTabProps {
  abAhorrados: number;
  simExtra: number; setSimExtra: (v: number) => void;
  simTotal: number;
  simMult: number;
  simDia: number; simSem: number; simMes: number; simAnio: number;
  tasa: number; moneda: string;
  rentaDia: number; rentaSem: number; rentaMes: number; rentaAnio: number;
  motor: MotorAtlasEarth;
  pais: string;
  horasSrb: number;
  metaUsdDia?: number;
  abPorDia?: number;
  abEcDiarios?: number;
  tipoPase?: string;
  nivelActualPasaporte: number;
  nivelSiguientePasaporte: number;
  insigniasFaltantes: number;
  costoAbPasaporte: number;
  parcelasEq: number;
  aumentoParcelas: number;
  aumentoPasaporte: number;
  roiGlobalDias: number;
  roiMarginalDias: number;
  rentaAdicional: number;
  costoMetaAb: number;
  costoTiendaUsd: number;
  metaRenta: number;
  permissions: Permissions;
}

export default function SimuladorTab(props: SimuladorTabProps) {
  // FREE: bloque completo con preview
  if (!props.permissions.canUseSimulator) {
    return (
      <div className="space-y-6 animate-fade-in">
        <LockedFeature
          title="🔬 Simulador de Inversión"
          description="Descubre exactamente cuánto generarías al comprar parcelas adicionales, optimizar tu Explorer Club y calcular el ROI de tus inversiones. Todo con datos precisos y en tu moneda local."
          preview={
            <div className="p-6 space-y-4">
              <div className="h-8 bg-white/10 rounded w-1/2 animate-pulse" />
              <div className="grid grid-cols-4 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-white/10 rounded animate-pulse" />
                    <div className="h-8 bg-white/10 rounded animate-pulse" />
                  </div>
                ))}
              </div>
              <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-24 bg-white/5 rounded-xl animate-pulse" />
              </div>
            </div>
          }
        />
      </div>
    );
  }

  // --- Estado para el simulador de meta en USD al día ---
  const [metaDolarSim, setMetaDolarSim] = useState<number>(() => {
    return props.metaUsdDia && props.metaUsdDia > 0 ? Number(props.metaUsdDia.toFixed(2)) : 1.0;
  });

  // --- Datos base del jugador ---
  const totalActual = props.motor.total_parcelas;
  const parcelasComprablesYa = Math.floor(props.abAhorrados / 100);
  const simExtra = Math.max(0, props.simExtra);
  const totalSimulado = props.simTotal ?? (totalActual + simExtra);
  const multActual = props.motor._get_tier_mult(totalActual, props.pais, TIERS_COMPLETOS);
  const multSimulado = props.simMult ?? props.motor._get_tier_mult(totalSimulado, props.pais, TIERS_COMPLETOS);
  const bajaTier = multSimulado < multActual;

  // Escalera de tiers (siguiente tramo)
  const escalera = useMemo(() => {
    return props.motor.calcular_escalera(props.pais, TIERS_COMPLETOS);
  }, [props.motor, props.pais]);

  // Capacidad de compra para simExtra
  const costoAbSim = simExtra * 100;
  const pctAlcanza = simExtra > 0 ? (props.abAhorrados / costoAbSim) * 100 : 100;
  const abFaltantesSim = Math.max(0, costoAbSim - props.abAhorrados);
  const parcelasFaltantesSim = Math.max(0, simExtra - parcelasComprablesYa);

  const abDiaF2p = props.abPorDia && props.abPorDia > 0 ? props.abPorDia : 1;
  const abDiaEc = props.abEcDiarios && props.abEcDiarios > 0 ? props.abEcDiarios : 1;

  const diasF2pSim = abFaltantesSim > 0 ? abFaltantesSim / abDiaF2p : 0;
  const diasEcSim = abFaltantesSim > 0 ? abFaltantesSim / abDiaEc : 0;

  // Ganancias extra en simulación
  const extraDia = props.simDia - props.rentaDia;
  const extraPromSrb = (props.simMes - props.rentaMes) / 30;
  const extraSem = props.simSem - props.rentaSem;
  const extraMes = props.simMes - props.rentaMes;
  const extraAnio = props.simAnio - props.rentaAnio;

  // --- Cálculo dinámico de Meta en USD/día ---
  const metaCalc = useMemo(() => {
    return props.motor.calcular_meta_automatica(metaDolarSim, props.pais, TIERS_COMPLETOS, props.horasSrb);
  }, [props.motor, metaDolarSim, props.pais, props.horasSrb]);

  const parcelasMetaSim = metaCalc.p_test;
  const rentaAlcanzadaSim = metaCalc.renta_test;
  const faltanMetaSim = Math.max(0, parcelasMetaSim - totalActual);
  const multMetaSim = props.motor._get_tier_mult(parcelasMetaSim, props.pais, TIERS_COMPLETOS);
  const costoAbMetaSim = faltanMetaSim * 100;
  const abNetosMetaSim = Math.max(0, costoAbMetaSim - props.abAhorrados);
  const pctMetaAlcanzada = metaDolarSim > 0 ? Math.min(100, (props.rentaDia / metaDolarSim) * 100) : 100;
  const diasF2pMeta = abNetosMetaSim > 0 ? abNetosMetaSim / abDiaF2p : 0;
  const diasEcMeta = abNetosMetaSim > 0 ? abNetosMetaSim / abDiaEc : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 🧮 Simulador de Compra de Parcelas & Capacidad de Inversión */}
      <GlowCard>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="text-xs text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
            <span>🧮</span> Simulador de Compra de Parcelas & Capacidad de Inversión
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
            Entrada Libre de Parcelas
          </span>
        </div>

        {/* Resumen de tu estado actual */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 p-3.5 bg-[#0a0f18] rounded-xl border border-cyan-900/30">
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">🏞️ Parcelas Actuales</div>
            <div className="text-lg font-bold text-white flex items-baseline gap-1.5">
              {totalActual.toLocaleString()}
              <span className="text-xs font-semibold text-cyan-400">({multActual}x)</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">🪙 Saldo Atlas Bucks (AB)</div>
            <div className="text-lg font-bold text-cyan-300">{props.abAhorrados.toLocaleString()} AB</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">🛒 Puedes comprar YA</div>
            <div className="text-lg font-bold text-emerald-400">{parcelasComprablesYa.toLocaleString()} parcelas</div>
          </div>
        </div>

        {/* Control interactivo de parcelas a comprar */}
        <div className="mb-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              ¿Cuántas parcelas adicionales deseas comprar?
            </label>
            <span className="text-xs text-gray-400">
              Total resultante: <strong className="text-white font-mono">{totalSimulado.toLocaleString()}</strong> parcelas
            </span>
          </div>

          <div className="flex items-center bg-[#131b26] border border-cyan-500/40 rounded-xl overflow-hidden shadow-inner">
            <button
              onClick={() => props.setSimExtra(Math.max(0, simExtra - 10))}
              title="Restar 10"
              className="px-3.5 py-3 text-gray-400 hover:text-white hover:bg-white/10 transition-colors font-bold text-sm border-r border-white/5"
            >
              -10
            </button>
            <button
              onClick={() => props.setSimExtra(Math.max(0, simExtra - 1))}
              title="Restar 1"
              className="px-4 py-3 text-gray-400 hover:text-white hover:bg-white/10 transition-colors font-bold text-lg border-r border-white/5"
            >
              −
            </button>
            <input
              type="number"
              min={0}
              value={simExtra}
              onChange={(e) => props.setSimExtra(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
              className="flex-1 bg-transparent text-center text-2xl font-black text-white focus:outline-none py-2.5 font-mono"
              placeholder="0"
            />
            <button
              onClick={() => props.setSimExtra(simExtra + 1)}
              title="Sumar 1"
              className="px-4 py-3 text-gray-400 hover:text-white hover:bg-white/10 transition-colors font-bold text-lg border-l border-white/5"
            >
              +
            </button>
            <button
              onClick={() => props.setSimExtra(simExtra + 10)}
              title="Sumar 10"
              className="px-3.5 py-3 text-gray-400 hover:text-white hover:bg-white/10 transition-colors font-bold text-sm border-l border-white/5"
            >
              +10
            </button>
          </div>

          {/* Botones de acción rápida */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {parcelasComprablesYa > 0 && (
              <button
                onClick={() => props.setSimExtra(parcelasComprablesYa)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all flex items-center gap-1"
              >
                <span>🛒</span> Comprar con mis AB ({parcelasComprablesYa})
              </button>
            )}
            <button
              onClick={() => props.setSimExtra(simExtra + 5)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 transition-colors"
            >
              +5
            </button>
            <button
              onClick={() => props.setSimExtra(simExtra + 20)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 transition-colors"
            >
              +20
            </button>
            <button
              onClick={() => props.setSimExtra(simExtra + 50)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 transition-colors"
            >
              +50
            </button>
            <button
              onClick={() => props.setSimExtra(simExtra + 100)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 transition-colors"
            >
              +100
            </button>
            {escalera.faltantes > 0 && (
              <button
                onClick={() => props.setSimExtra(escalera.faltantes)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all flex items-center gap-1"
              >
                <span>🚀</span> Próximo Salto ({escalera.siguiente_tramo} parcelas: +{escalera.faltantes})
              </button>
            )}
            {simExtra > 0 && (
              <button
                onClick={() => props.setSimExtra(0)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/20 transition-colors ml-auto"
              >
                Reiniciar (0)
              </button>
            )}
          </div>
        </div>

        {/* Estado del Multiplicador con esta compra */}
        <div className="mb-5">
          {simExtra === 0 ? (
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-400 flex items-center gap-2">
              <span>ℹ️</span>
              <span>
                Actualmente tienes <strong className="text-white">{totalActual} parcelas</strong> en el tramo de multiplicador <strong className="text-cyan-400">{multActual}x</strong>.
              </span>
            </div>
          ) : bajaTier ? (
            <div className="p-3.5 bg-orange-950/30 border border-orange-500/40 rounded-xl text-xs text-orange-200 flex items-start gap-2.5">
              <span className="text-base shrink-0 mt-0.5">⚠️</span>
              <div>
                <div className="font-bold text-orange-300">
                  ¡Atención: Efecto Tier Drop al comprar {simExtra.toLocaleString()} parcelas!
                </div>
                <div className="text-gray-300 mt-0.5 leading-relaxed">
                  Pasarás de <strong className="text-white">{totalActual}</strong> a <strong className="text-white">{totalSimulado.toLocaleString()} parcelas</strong>, y tu multiplicador descenderá de <strong className="text-cyan-400">{multActual}x</strong> a <strong className="text-red-400">{multSimulado}x</strong>. Todos los cálculos abajo reflejan con exactitud este cambio.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
              <span>✅</span>
              <span>
                Al pasar de <strong className="text-white">{totalActual}</strong> a <strong className="text-white">{totalSimulado.toLocaleString()} parcelas</strong> mantienes tu multiplicador de <strong className="text-emerald-400">{multSimulado}x</strong> dentro de este tramo.
              </span>
            </div>
          )}
        </div>

        {/* Análisis de Capacidad de Compra / % de Parcelas que puedes adquirir */}
        <div className="mb-5 p-4 bg-gradient-to-br from-[#0c1420] to-[#080d14] rounded-xl border border-cyan-800/40 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs uppercase font-bold text-gray-300 tracking-wider flex items-center gap-1.5">
              <span>📊</span> Capacidad de Adquisición con tus AB
            </div>
            <div className="text-xs font-mono font-bold text-cyan-400">
              {simExtra > 0 ? `${Math.min(100, pctAlcanza).toFixed(1)}% cubierto` : "100% disponible"}
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pctAlcanza >= 100
                  ? "bg-gradient-to-r from-emerald-500 to-green-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  : pctAlcanza >= 50
                  ? "bg-gradient-to-r from-cyan-500 to-emerald-400"
                  : "bg-gradient-to-r from-orange-500 to-amber-400"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, pctAlcanza))}%` }}
            />
          </div>

          {/* Explicación de asequibilidad */}
          {simExtra === 0 ? (
            <div className="text-xs text-gray-400">
              Tienes <strong className="text-cyan-400">{props.abAhorrados.toLocaleString()} AB</strong> en cartera. Puedes comprar <strong className="text-emerald-400">{parcelasComprablesYa} parcelas</strong> de inmediato sin esperar.
            </div>
          ) : props.abAhorrados >= costoAbSim ? (
            <div className="text-xs text-emerald-300 leading-relaxed">
              🎉 <strong className="text-white">¡Te alcanza para el 100%!</strong> El costo total es de <strong className="text-white">{costoAbSim.toLocaleString()} AB</strong> y tienes <strong className="text-cyan-300">{props.abAhorrados.toLocaleString()} AB</strong>. Tras comprar te sobrarán <strong className="text-emerald-400">{(props.abAhorrados - costoAbSim).toLocaleString()} AB</strong>.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="text-gray-300 leading-relaxed">
                Tus AB actuales cubren el <strong className="text-cyan-400">{pctAlcanza.toFixed(1)}%</strong> de esta compra (puedes comprar <strong className="text-emerald-400">{parcelasComprablesYa.toLocaleString()}</strong> de las <strong className="text-white">{simExtra.toLocaleString()}</strong> parcelas deseadas).
              </div>
              <div className="p-2.5 bg-black/30 rounded-lg border border-white/5 flex flex-wrap items-center justify-between gap-2 text-gray-400">
                <div>
                  Faltan: <strong className="text-orange-400">{parcelasFaltantesSim.toLocaleString()} parcelas</strong> (<strong className="text-white">{abFaltantesSim.toLocaleString()} AB</strong>)
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span>⚡ EC: <strong className="text-cyan-300">{props.motor.formato_tiempo_exacto(diasEcSim)}</strong></span>
                  <span>🛡️ F2P: <strong className="text-gray-300">{props.motor.formato_tiempo_exacto(diasF2pSim)}</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Proyección Financiera Detallada (Renta Total Sumando Parcelas Compradas) */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
            <span>📈 Proyección Total Resultante ({totalSimulado.toLocaleString()} Parcelas a {multSimulado}x)</span>
            <span className="text-[10px] text-gray-500 font-normal">Suma tu estado actual + simulación</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: "📅 Día Normal (24h)",
                usd: props.simDia,
                diff: extraDia,
                sub: "Sin SRB activo",
              },
              {
                label: "🚀 Promedio con SRB",
                usd: props.simMes / 30,
                diff: extraPromSrb,
                sub: `${props.horasSrb}h SRB prorrateadas`,
              },
              {
                label: "🗓️ Mensual Proyectado",
                usd: props.simMes,
                diff: extraMes,
                sub: "30 días calendario",
              },
              {
                label: "📆 Anual Proyectado",
                usd: props.simAnio,
                diff: extraAnio,
                sub: "365 días del año",
              },
            ].map(({ label, usd, diff, sub }) => (
              <div
                key={label}
                className="bg-gradient-to-br from-[#0c1626] to-[#0a0f18] rounded-xl p-3.5 border border-cyan-900/40 flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">{label}</div>
                  <div className="text-xl font-bold text-cyan-400 font-mono">
                    ${fmt(usd, usd < 1 ? 4 : 2)} <span className="text-xs font-normal text-gray-400">USD</span>
                  </div>
                  {props.moneda !== "USD" && (
                    <div className="text-xs font-semibold text-lime-400 mt-0.5 font-mono">
                      ≈ ${fmt(usd * props.tasa, 2)} {props.moneda}
                    </div>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span className="text-gray-500">{sub}</span>
                  {simExtra > 0 && (
                    <span className={`font-mono font-bold ${diff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {diff >= 0 ? "+" : ""}${fmt(diff, diff < 0.1 && diff > -0.1 ? 4 : 2)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ganancia Extra Neta destacada */}
        {simExtra > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-br from-emerald-950/20 to-[#0a1812] border border-emerald-500/30 rounded-xl">
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span>⚡</span> Ganancia Neta Adicional de las +{simExtra.toLocaleString()} Parcelas
              </div>
              <span className="text-[10px] text-emerald-300 font-mono">
                Costo: {costoAbSim.toLocaleString()} AB
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Extra Día Normal", v: extraDia },
                { label: "Extra Prom. SRB/día", v: extraPromSrb },
                { label: "Extra por Mes", v: extraMes },
                { label: "Extra por Año", v: extraAnio },
              ].map(({ label, v }) => (
                <div key={label} className="bg-black/30 p-2.5 rounded-lg border border-emerald-500/10">
                  <div className="text-[10px] text-gray-400">{label}</div>
                  <div className={`text-sm sm:text-base font-bold font-mono ${v >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {v >= 0 ? "+" : ""}${fmt(v, Math.abs(v) < 1 ? 4 : 2)} USD
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlowCard>

      {/* 🎯 Simulador por Meta de Ingresos en USD al Día */}
      <GlowCard>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="text-xs text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
            <span>🎯</span> Simulador por Meta de Ingresos Diarios ($ USD/día)
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 font-medium">
            Calculadora Inversa de Parcelas
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          Introduce la cantidad en dólares que deseas generar cada día. El sistema calculará automáticamente la cantidad exacta de parcelas necesarias teniendo en cuenta las caídas de multiplicador por tramos.
        </p>

        {/* Selector de presets y entrada libre de USD/día */}
        <div className="mb-5 space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 5.0].map((val) => (
              <button
                key={val}
                onClick={() => setMetaDolarSim(val)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  metaDolarSim === val
                    ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                    : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5"
                }`}
              >
                ${val.toFixed(2)}/d
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-[#131b26] border border-purple-500/40 rounded-xl p-2.5">
            <span className="text-purple-400 font-bold text-lg pl-2">$</span>
            <input
              type="number"
              step="0.05"
              min="0.01"
              value={metaDolarSim}
              onChange={(e) => setMetaDolarSim(Math.max(0.01, Number(e.target.value) || 0.01))}
              className="flex-1 bg-transparent text-xl font-bold text-white focus:outline-none font-mono"
            />
            <span className="text-xs text-gray-400 pr-2">USD al día</span>
          </div>
        </div>

        {/* Resultados de la Meta */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="bg-gradient-to-br from-[#160d26] to-[#0c0816] rounded-xl p-3.5 border border-purple-900/40">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">🏞️ Parcelas Requeridas</div>
            <div className="text-xl font-bold text-purple-300 font-mono">{parcelasMetaSim.toLocaleString()}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Multiplicador: {multMetaSim}x</div>
          </div>

          <div className="bg-gradient-to-br from-[#160d26] to-[#0c0816] rounded-xl p-3.5 border border-purple-900/40">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">🎯 Parcelas Faltantes</div>
            <div className={`text-xl font-bold font-mono ${faltanMetaSim > 0 ? "text-amber-400" : "text-emerald-400"}`}>
              {faltanMetaSim > 0 ? `+${faltanMetaSim.toLocaleString()}` : "0"}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {faltanMetaSim > 0 ? `Tienes ${totalActual.toLocaleString()}` : "¡Meta alcanzada!"}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#160d26] to-[#0c0816] rounded-xl p-3.5 border border-purple-900/40">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">🪙 Atlas Bucks Requeridos</div>
            <div className="text-xl font-bold text-cyan-300 font-mono">{costoAbMetaSim.toLocaleString()} AB</div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              Netos faltantes: {abNetosMetaSim.toLocaleString()} AB
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#160d26] to-[#0c0816] rounded-xl p-3.5 border border-purple-900/40">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">📈 Renta a Alcanzar</div>
            <div className="text-xl font-bold text-emerald-400 font-mono">${fmt(rentaAlcanzadaSim, 4)}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Meta: ${metaDolarSim.toFixed(2)} USD/d</div>
          </div>
        </div>

        {/* Progreso de la meta y tiempos estimados */}
        <div className="p-4 bg-[#0d091a] rounded-xl border border-purple-900/30 space-y-3 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300 font-medium">
              Progreso actual: Generas <strong className="text-white font-mono">${fmt(props.rentaDia, 4)}/d</strong> de tu meta de <strong className="text-purple-300 font-mono">${metaDolarSim.toFixed(2)}/d</strong>
            </span>
            <span className="font-mono font-bold text-purple-400">{pctMetaAlcanzada.toFixed(1)}%</span>
          </div>

          <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, pctMetaAlcanzada))}%` }}
            />
          </div>

          {faltanMetaSim > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-gray-400">
              <span className="text-gray-300">
                Tiempo estimado para reunir los <strong className="text-white">{abNetosMetaSim.toLocaleString()} AB</strong> restantes:
              </span>
              <div className="flex items-center gap-4 text-xs">
                <span>⚡ Explorer Club (24/7): <strong className="text-cyan-300">{props.motor.formato_tiempo_exacto(diasEcMeta)}</strong></span>
                <span>🛡️ Free to Play: <strong className="text-gray-300">{props.motor.formato_tiempo_exacto(diasF2pMeta)}</strong></span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-emerald-400 font-semibold">
              🎉 ¡Felicidades! Ya estás generando esta meta o la superas con tu portafolio actual de {totalActual.toLocaleString()} parcelas.
            </div>
          )}
        </div>

        {/* Botón de 1 clic para simular las parcelas faltantes */}
        {faltanMetaSim > 0 ? (
          <button
            onClick={() => {
              props.setSimExtra(faltanMetaSim);
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white transition-all shadow-[0_0_16px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2"
          >
            <span>📥</span> Simular estas +{faltanMetaSim.toLocaleString()} parcelas en el Simulador de Compras
          </button>
        ) : null}
      </GlowCard>

      {/* Calculadora Parcela vs Insignia */}
      <GlowCard>
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">⚖️ Calculadora: ¿Parcelas o Insignias?</div>
        {props.nivelActualPasaporte < 5 ? (
          <>
            <div className="text-sm text-gray-400 mb-3">
              Te faltan <strong className="text-white">{props.insigniasFaltantes} insignias</strong> para el Nivel {props.nivelSiguientePasaporte} (${props.costoAbPasaporte.toLocaleString()} AB).
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-[#0e1a0e] to-[#0a0f0a] rounded-xl p-4 border border-green-500/20 text-center">
                <div className="text-xs text-gray-400 mb-1">🏞️ {props.parcelasEq} Parcelas</div>
                <div className="text-lg font-bold text-green-400">+${props.aumentoParcelas.toFixed(5)}/día</div>
              </div>
              <div className="bg-gradient-to-br from-[#1a1a0e] to-[#0f0f0a] rounded-xl p-4 border border-yellow-500/20 text-center">
                <div className="text-xs text-gray-400 mb-1">🛂 Pasaporte Nivel {props.nivelSiguientePasaporte}</div>
                <div className="text-lg font-bold text-yellow-400">+${props.aumentoPasaporte.toFixed(5)}/día</div>
              </div>
            </div>
            <div className={`mt-3 p-3 rounded-lg text-sm font-bold ${
              props.aumentoParcelas > props.aumentoPasaporte
                ? "bg-green-900/20 text-green-400 border border-green-500/20"
                : "bg-yellow-900/20 text-yellow-400 border border-yellow-500/20"
            }`}>
              {props.aumentoParcelas > props.aumentoPasaporte
                ? `✅ Compra ${props.parcelasEq} Parcelas — ganarás +$${(props.aumentoParcelas - props.aumentoPasaporte).toFixed(5)}/día más que con insignias.`
                : `✅ Compra ${props.insigniasFaltantes} Insignias — ganarás +$${(props.aumentoPasaporte - props.aumentoParcelas).toFixed(5)}/día más que con parcelas.`}
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-400">Ya tienes Pasaporte Nivel 5 (Máximo). Concéntrate en saltos de Tier.</div>
        )}
      </GlowCard>
      {/* ROI Analysis */}
      <GlowCard>
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">📈 Análisis de ROI</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#0e0e0e] rounded-xl p-4 border border-white/5">
            <div className="text-xs text-gray-400 mb-1">🌍 ROI Global</div>
            <div className="text-lg font-bold text-white">{props.roiGlobalDias > 0 ? props.motor.formato_tiempo_exacto(props.roiGlobalDias) : "N/A"}</div>
            <div className="text-[10px] text-gray-500 mt-1">Tiempo en recuperar la inversión con TODAS tus ganancias.</div>
          </div>
          <div className="bg-[#0e0e0e] rounded-xl p-4 border border-white/5">
            <div className="text-xs text-gray-400 mb-1">⚡ ROI Marginal</div>
            <div className={`text-lg font-bold ${props.roiMarginalDias <= 365 ? "text-green-400" : props.roiMarginalDias <= 1095 ? "text-orange-400" : "text-red-400"}`}>
              {props.roiMarginalDias > 0 ? props.motor.formato_tiempo_exacto(props.roiMarginalDias) : props.rentaAdicional <= 0 ? "Nunca (Pérdida)" : "N/A"}
            </div>
            <div className="text-[10px] text-gray-500 mt-1">Tiempo en recuperar con SOLO las ganancias extra del salto.</div>
          </div>
        </div>
        {props.costoTiendaUsd > 0 && (
          <div className="mt-3 text-xs text-gray-500">
            💰 Inversión total requerida: <strong className="text-white">${props.costoTiendaUsd.toFixed(2)} USD</strong> ({props.costoMetaAb.toLocaleString()} AB en tienda)
          </div>
        )}
      </GlowCard>
      {/* Mapa de Multiplicadores */}
      <GlowCard>
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">🗺️ Mapa de Multiplicadores — Tu Posición Actual</div>
        {(() => {
          const tabla = TIERS_COMPLETOS[props.pais] || TIERS_COMPLETOS["Estados Unidos"];
          if (!tabla) return null;
          const { limites, multiplicadores } = tabla;
          const total = props.motor.total_parcelas;
          const rentaPromSec = props.motor.renta_promedio_sec; // 1.58e-9 por parcela nueva

          // ----------------------------------------------------------------
          // Para calcular la renta de un tier FUTURO usamos exactamente
          // las mismas fórmulas que el dashboard:
          //   • Renta normal (día sin SRB): calcular_renta_diaria_normal(tier)
          //     PERO esa función usa this.renta_base. Para tiers con más parcelas
          //     escalamos la renta_base proporcionalmente.
          //   • Promedio mensual con SRB: calcular_renta_mensual(tier, horasSrb) / 30
          //
          // Para el tier ACTUAL (num == total) usamos directamente los
          // mismos valores del dashboard (rentaDia ya viene como prop).
          // ----------------------------------------------------------------

          const getRentaNormal = (numParcelas: number, mult: number): number => {
            if (numParcelas <= total) {
              // Tier actual: usar exactamente la misma función del dashboard
              return props.motor.calcular_renta_diaria_normal(mult);
            }
            // Tier futuro: escalar renta_base al número de parcelas proyectado
            const extraParcelas = numParcelas - total;
            const rentaBaseEscalada = props.motor.renta_base + extraParcelas * rentaPromSec;
            const horasConBoost = Math.min(24, props.motor.horas_boost * props.motor.eficiencia);
            const horasSinBoost = Math.max(0, 24 - horasConBoost);
            return (rentaBaseEscalada * 3600 * horasConBoost * mult +
                    rentaBaseEscalada * 3600 * horasSinBoost * 1) * props.motor.pasaporte_mult;
          };

          const getRentaMensualDia = (numParcelas: number, mult: number, horasSrb: number): number => {
            if (numParcelas <= total) {
              return props.motor.calcular_renta_mensual(mult, horasSrb) / 30;
            }
            const extraParcelas = numParcelas - total;
            const rentaBaseEscalada = props.motor.renta_base + extraParcelas * rentaPromSec;
            const horasMes = 720;
            const horasNormales = Math.max(0, horasMes - horasSrb);
            const pctBoost = (props.motor.horas_boost / 24) * props.motor.eficiencia;
            const horasConBoost = horasNormales * pctBoost;
            const horasSinBoost = Math.max(0, horasNormales - horasConBoost);
            const renta = (rentaBaseEscalada * 3600 * horasSrb * 50 +
                           rentaBaseEscalada * 3600 * horasConBoost * mult +
                           rentaBaseEscalada * 3600 * horasSinBoost * 1) * props.motor.pasaporte_mult;
            return renta / 30;
          };

          type TierFila = {
            desde: number; hasta: number; mult: number;
            rentaSin: number; rentaCon: number;
            esActual: boolean; esSiguiente: boolean; yaPasado: boolean;
          };

          const filas: TierFila[] = [];
          let desde = 1;
          for (let i = 0; i < limites.length; i++) {
            const hasta = limites[i];
            const mult = multiplicadores[i];
            const esActual = total >= desde && total <= hasta;
            const esSiguiente = total < desde && filas.every(f => !f.esSiguiente);
            const yaPasado = total > hasta;
            // Mostrar renta en el TOPE del tier (parcelas = hasta)
            const parcelasRef = Math.max(total, hasta); // nunca bajamos de total
            const rentaSin = getRentaNormal(parcelasRef, mult);
            const rentaCon = props.horasSrb > 0 ? getRentaMensualDia(parcelasRef, mult, props.horasSrb) : 0;
            filas.push({ desde, hasta, mult, rentaSin, rentaCon, esActual, esSiguiente, yaPasado });
            desde = hasta + 1;
          }
          // Tier final
          const lastMult = multiplicadores[multiplicadores.length - 1];
          const finalDesde = desde;
          const finalRef = Math.max(total, finalDesde);
          filas.push({
            desde: finalDesde, hasta: 999999, mult: lastMult,
            rentaSin: getRentaNormal(finalRef, lastMult),
            rentaCon: props.horasSrb > 0 ? getRentaMensualDia(finalRef, lastMult, props.horasSrb) : 0,
            esActual: total >= finalDesde, esSiguiente: false, yaPasado: false,
          });

          const multActual = props.motor._get_tier_mult(total, props.pais, TIERS_COMPLETOS);
          const multSiguiente = props.motor._get_tier_mult(total + 1, props.pais, TIERS_COMPLETOS);
          const baja = multSiguiente < multActual;

          return (
            <div className="space-y-3">
              {/* Alerta si la siguiente compra baja el multiplicador */}
              {baja && (
                <div className="flex items-start gap-3 p-3 bg-orange-900/20 border border-orange-500/30 rounded-xl text-xs">
                  <span className="text-orange-400 text-base shrink-0">⚠️</span>
                  <div>
                    <span className="font-bold text-orange-300">Estás en el límite del tier.</span>
                    <span className="text-gray-400 ml-1">
                      Si compras 1 parcela más ({(total + 1).toLocaleString()}), tu multiplicador <strong className="text-red-400">baja de x{multActual} → x{multSiguiente}</strong> y tu renta diaria baja temporalmente.
                      Sigue comprando hasta llegar al siguiente punto de equilibrio.
                    </span>
                  </div>
                </div>
              )}

              {/* Nota: qué representan las columnas */}
              <div className="flex gap-4 text-[10px] text-gray-500 px-1">
                <span>📅 <strong className="text-gray-400">Día normal</strong> = renta en un día sin SRB activo</span>
                {props.horasSrb > 0 && <span>🚀 <strong className="text-cyan-400">Prom. mensual</strong> = promedio/día en un mes con {props.horasSrb}h de SRB</span>}
              </div>

              {/* Tabla de tiers */}
              <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="text-[9px] uppercase tracking-wider text-gray-600 border-b border-white/5 bg-[#0a0a0f]">
                      <th className="py-2 px-3 text-left">Rango parcelas</th>
                      <th className="py-2 px-3 text-center">Mult</th>
                      <th className="py-2 px-3 text-right">📅 Día normal</th>
                      {props.horasSrb > 0 && (
                        <th className="py-2 px-3 text-right">🚀 Prom. mensual</th>
                      )}
                      <th className="py-2 px-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((f, i) => {
                      if (f.yaPasado) return null;
                      const esLimiteFinal = f.hasta === 999999;
                      const rango = esLimiteFinal ? `${f.desde.toLocaleString()}+` : `${f.desde.toLocaleString()} – ${f.hasta.toLocaleString()}`;
                      let rowCls = "border-b border-white/[2%] ";
                      let badge = null;
                      if (f.esActual) {
                        rowCls += "bg-cyan-500/8 border-l-2 border-l-cyan-400";
                        badge = <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full text-[9px] font-bold"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />AQUÍ</span>;
                      } else if (f.esSiguiente) {
                        rowCls += "bg-orange-500/5 border-l-2 border-l-orange-400/50";
                        badge = <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full text-[9px] font-bold">SIGUIENTE</span>;
                      } else {
                        rowCls += "hover:bg-white/[1%]";
                        badge = <span className="text-gray-600 text-[9px]">futuro</span>;
                      }
                      const multColor = f.mult >= 20 ? "text-green-400" : f.mult >= 10 ? "text-yellow-400" : f.mult >= 6 ? "text-orange-400" : "text-red-400";
                      return (
                        <tr key={i} className={rowCls}>
                          <td className={`py-2.5 px-3 font-mono ${f.esActual ? "text-white font-semibold" : "text-gray-400"}`}>{rango}</td>
                          <td className={`py-2.5 px-3 text-center font-bold text-base ${multColor}`}>{f.mult}x</td>
                          <td className="py-2.5 px-3 text-right font-mono text-gray-300">${fmt(f.rentaSin, f.rentaSin < 0.01 ? 6 : 4)}</td>
                          {props.horasSrb > 0 && (
                            <td className="py-2.5 px-3 text-right font-mono text-cyan-300">${fmt(f.rentaCon, f.rentaCon < 0.01 ? 6 : 4)}</td>
                          )}
                          <td className="py-2.5 px-3 text-center">{badge}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="text-[9px] text-gray-600 flex flex-wrap gap-3 pt-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400/60" /> Alto (≥x20)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400/60" /> Medio (x10–x19)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400/60" /> Bajo (x6–x9)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400/60" /> Muy bajo (&lt;x6)</span>
                <span className="ml-auto">Renta al tope de cada tier</span>
              </div>
            </div>
          );
        })()}
      </GlowCard>
    </div>
  );
}

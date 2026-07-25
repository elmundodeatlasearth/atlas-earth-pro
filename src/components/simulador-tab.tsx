// src/components/simulador-tab.tsx
// Tab de Simulador con inversión inmediata, parcela vs insignia, Explorer Club optimizer y ROI

"use client";
import { MetricBox, GlowCard } from "./stat-card";
import { fmt, type VentanaEC } from "@/utils/atlasMath";
import type { MotorAtlasEarth } from "@/utils/atlasMath";

interface SimuladorTabProps {
  abAhorrados: number;
  simExtra: number; setSimExtra: (v: number) => void;
  simDia: number; simSem: number; simMes: number; simAnio: number;
  tasa: number; moneda: string;
  rentaDia: number; rentaSem: number; rentaMes: number; rentaAnio: number;
  motor: MotorAtlasEarth;
  pais: string;
  nivelActualPasaporte: number;
  nivelSiguientePasaporte: number;
  insigniasFaltantes: number;
  costoAbPasaporte: number;
  parcelasEq: number;
  aumentoParcelas: number;
  aumentoPasaporte: number;
  optData: { mes1: VentanaEC; mes2: VentanaEC; mes3: VentanaEC; optimo: VentanaEC };
  roiGlobalDias: number;
  roiMarginalDias: number;
  rentaAdicional: number;
  costoMetaAb: number;
  costoTiendaUsd: number;
  metaRenta: number;
}

export default function SimuladorTab(props: SimuladorTabProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Inversión Inmediata */}
      <GlowCard>
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">🧮 Simulador de Inversión Inmediata</div>
        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-3">
            💡 Tienes <strong className="text-cyan-400">{props.abAhorrados.toLocaleString()} AB</strong> — podrías comprar <strong className="text-green-400">{Math.floor(props.abAhorrados / 100)} parcelas</strong> ahora.
          </div>
          <label className="text-sm text-gray-400 block mb-2">Parcelas adicionales a simular:</label>
          <div className="flex items-center bg-[#1a1a1a] border border-cyan-500/30 rounded-xl overflow-hidden">
            <button onClick={() => props.setSimExtra(Math.max(0, props.simExtra - 1))}
              className="px-5 py-3 text-gray-400 hover:text-white hover:bg-white/10 transition-colors font-bold text-lg">−</button>
            <input type="number" value={props.simExtra} min={0} onChange={e => props.setSimExtra(Math.max(0, Number(e.target.value)))}
              className="flex-1 bg-transparent text-center text-2xl font-bold text-white focus:outline-none py-3" />
            <button onClick={() => props.setSimExtra(props.simExtra + 1)}
              className="px-5 py-3 text-gray-400 hover:text-white hover:bg-white/10 transition-colors font-bold text-lg">+</button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Ingreso 24 Horas", usd: props.simDia, local: props.simDia * props.tasa },
            { label: "Semanal Estimado", usd: props.simSem, local: props.simSem * props.tasa },
            { label: "Mensual Estimado", usd: props.simMes, local: props.simMes * props.tasa },
            { label: "Anual Estimado", usd: props.simAnio, local: props.simAnio * props.tasa },
          ].map(({ label, usd, local }) => (
            <div key={label} className="bg-gradient-to-br from-[#0d1a2e] to-[#0f1520] rounded-xl p-4 border border-cyan-900/40">
              <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{label}</div>
              <div className="text-xl font-bold text-cyan-400">${fmt(usd, usd < 1 ? 6 : 2)} USD</div>
              {props.moneda !== "USD" && (
                <div className="text-sm font-semibold text-lime-400 mt-0.5">≈ ${fmt(local, 2)} {props.moneda}</div>
              )}
            </div>
          ))}
        </div>

        {props.simExtra > 0 && (
          <div className="mt-4 p-4 bg-gradient-to-br from-green-900/20 to-emerald-900/10 border border-green-500/20 rounded-xl">
            <div className="text-xs text-green-400 font-bold uppercase tracking-wider mb-3">📈 Ganancia Extra</div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Extra/Día", v: props.simDia - props.rentaDia },
                { label: "Extra/Sem", v: props.simSem - props.rentaSem },
                { label: "Extra/Mes", v: props.simMes - props.rentaMes },
                { label: "Extra/Año", v: props.simAnio - props.rentaAnio },
              ].map(({ label, v }) => (
                <div key={label}>
                  <div className="text-[10px] text-gray-500">{label}</div>
                  <div className="text-base font-bold text-green-400">+${fmt(v, v < 1 ? 6 : 2)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
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

      {/* Explorer Club Optimizer */}
      <GlowCard>
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">📆 Optimizador Explorer Club</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <MetricBox label="Mes 1 (Día 1-30)" value={`${props.optData.mes1.neto_ab.toLocaleString()} AB`} color="text-gray-400" />
          <MetricBox label="Mes 2 (Día 31-60)" value={`${props.optData.mes2.neto_ab.toLocaleString()} AB`} color="text-gray-400" />
          <MetricBox label="Mes 3 (Día 61-90)" value={`${props.optData.mes3.neto_ab.toLocaleString()} AB`} color="text-gray-400" />
          <MetricBox label={`🌟 Óptimo (Día ${props.optData.optimo.dia_inicio})`} value={`${props.optData.optimo.neto_ab.toLocaleString()} AB`} color="text-amber-400" />
        </div>
        <div className="p-4 bg-gradient-to-br from-blue-900/20 to-indigo-900/10 border border-blue-500/20 rounded-xl text-sm text-gray-300">
          🧠 <strong>Recomendación:</strong> Compra Explorer Club el <strong className="text-amber-400">Día {props.optData.optimo.dia_inicio}</strong> ({props.optData.optimo.fecha_compra}).<br />
          Capturarás <strong className="text-green-400">{props.optData.optimo.ab_pase.toLocaleString()} AB totales</strong> vs {props.optData.optimo.ab_gratis.toLocaleString()} AB gratis = <strong className="text-amber-400">+{props.optData.optimo.neto_ab.toLocaleString()} AB netos</strong> 🚀
        </div>
      </GlowCard>

      {/* ROI Analysis */}
      <GlowCard>
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">📈 Análisis de ROI</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#0e0e0e] rounded-xl p-4 border border-white/5">
            <div className="text-xs text-gray-400 mb-1">🌍 ROI Global</div>
            <div className="text-lg font-bold text-white">{props.roiGlobalDias > 0 ? (props.motor as any).formato_tiempo_exacto(props.roiGlobalDias) : "N/A"}</div>
            <div className="text-[10px] text-gray-500 mt-1">Tiempo en recuperar la inversión con TODAS tus ganancias.</div>
          </div>
          <div className="bg-[#0e0e0e] rounded-xl p-4 border border-white/5">
            <div className="text-xs text-gray-400 mb-1">⚡ ROI Marginal</div>
            <div className={`text-lg font-bold ${props.roiMarginalDias <= 365 ? "text-green-400" : props.roiMarginalDias <= 1095 ? "text-orange-400" : "text-red-400"}`}>
              {props.roiMarginalDias > 0 ? (props.motor as any).formato_tiempo_exacto(props.roiMarginalDias) : props.rentaAdicional <= 0 ? "Nunca (Pérdida)" : "N/A"}
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
    </div>
  );
}

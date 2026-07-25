// src/components/dashboard-tab.tsx
// Tab de Dashboard con métricas principales, progreso meta, AB proyectados y estrategia

"use client";
import { StatCard, MetricBox, GlowCard } from "./stat-card";
import type { MotorAtlasEarth } from "@/utils/atlasMath";

interface DashboardTabProps {
  motor: MotorAtlasEarth;
  multTier: number;
  pais: string;
  tasa: number;
  moneda: string;
  rentaDia: number;
  rentaSem: number;
  rentaMes: number;
  rentaAnio: number;
  metaUsdDia: number;
  parcelasMeta: number;
  faltantesMeta: number;
  tramo_actual: number;
  siguiente_tramo: number;
  faltantesTier: number;
  desgloseF2p: { total_mes: number; promedio_diario: number; ruleta_diaria: number; anuncios_diarios: number; asistencia_mes: number; minijuegos_mes: number };
  desgloseEc: { total_mes: number; promedio_diario: number; ruleta_diaria: number; anuncios_diarios: number; asistencia_mes: number; minijuegos_mes: number };
  veredictoEstrategia: string;
  totalParcelas: number;
}

export default function DashboardTab(props: DashboardTabProps) {
  const pctMeta = Math.min(100, (props.motor.total_parcelas / props.parcelasMeta) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Métricas principales */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">
          💎 Rendimiento Actual — {props.totalParcelas} Parcelas · {props.multTier}x Multiplicador
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Por Día" usd={props.rentaDia} local={props.rentaDia * props.tasa} moneda={props.moneda} />
          <StatCard label="Por Semana" usd={props.rentaSem} local={props.rentaSem * props.tasa} moneda={props.moneda} />
          <StatCard label="Por Mes" usd={props.rentaMes} local={props.rentaMes * props.tasa} moneda={props.moneda} />
          <StatCard label="Por Año" usd={props.rentaAnio} local={props.rentaAnio * props.tasa} moneda={props.moneda} />
        </div>
      </div>

      {/* Progreso Meta + Tier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlowCard>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">🎯 Estado de tu Meta</div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Meta diaria</span>
              <span className="font-bold text-orange-400">${props.metaUsdDia.toFixed(4)} USD/día</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Parcelas necesarias</span>
              <span className="font-bold text-white">{props.parcelasMeta.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Parcelas que faltan</span>
              <span className={`font-bold text-2xl ${props.faltantesMeta > 0 ? "text-orange-400" : "text-green-400"}`}>
                {props.faltantesMeta > 0 ? `${props.faltantesMeta} parcelas` : "✅ Meta Alcanzada"}
              </span>
            </div>
            {props.faltantesMeta > 0 && (
              <>
                <div className="w-full bg-[#222] rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 via-amber-400 to-green-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${pctMeta}%` }} />
                </div>
                <div className="text-[11px] text-gray-500 text-right">{pctMeta.toFixed(1)}% de la meta</div>
              </>
            )}
          </div>
        </GlowCard>

        <GlowCard>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">🏆 Progreso al Siguiente Tier</div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Tier actual</span>
              <span className="font-bold text-cyan-400">{props.tramo_actual} parcelas</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Siguiente salto</span>
              <span className="font-bold text-yellow-400">{props.siguiente_tramo} parcelas</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Parcelas faltantes</span>
              <span className="font-bold text-pink-400">{props.faltantesTier}</span>
            </div>
            <div className="w-full bg-[#222] rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${props.siguiente_tramo > 0 ? Math.min(100, (props.totalParcelas / props.siguiente_tramo) * 100) : 100}%` }} />
            </div>
            <div className="text-[11px] text-gray-500 text-right">
              {props.siguiente_tramo > 0 ? Math.min(100, (props.totalParcelas / props.siguiente_tramo) * 100).toFixed(1) : 100}% del camino
            </div>
          </div>
        </GlowCard>
      </div>

      {/* AB Proyectados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlowCard>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">🌱 AB Proyectados (F2P)</div>
          <div className="text-3xl font-black bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">+{props.desgloseF2p.total_mes.toLocaleString()} AB/mes</div>
          <div className="text-sm text-gray-400 mt-1">≈ {props.desgloseF2p.promedio_diario.toFixed(1)} AB/día</div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <MetricBox label="Ruleta" value={`${props.desgloseF2p.ruleta_diaria.toFixed(1)}/d`} color="text-cyan-400" />
            <MetricBox label="Anuncios" value={`${props.desgloseF2p.anuncios_diarios}/d`} color="text-blue-400" />
            <MetricBox label="Asistencia" value={`${props.desgloseF2p.asistencia_mes}/mes`} color="text-purple-400" />
          </div>
        </GlowCard>

        <GlowCard className="border-amber-500/20">
          <div className="text-xs text-amber-400 uppercase tracking-widest mb-3">🔥 AB Proyectados (Explorer Club)</div>
          <div className="text-3xl font-black bg-gradient-to-r from-amber-400 to-orange-300 bg-clip-text text-transparent">+{props.desgloseEc.total_mes.toLocaleString()} AB/mes</div>
          <div className="text-sm text-gray-400 mt-1">≈ {props.desgloseEc.promedio_diario.toFixed(1)} AB/día</div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <MetricBox label="Ruleta" value={`${props.desgloseEc.ruleta_diaria.toFixed(1)}/d`} color="text-cyan-400" />
            <MetricBox label="Anuncios" value={`${props.desgloseEc.anuncios_diarios}/d`} color="text-blue-400" />
            <MetricBox label="Asistencia" value={`${props.desgloseEc.asistencia_mes}/mes`} color="text-purple-400" />
          </div>
        </GlowCard>
      </div>

      {/* Estrategia */}
      <GlowCard>
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">🧠 Estrategia Inteligente</div>
        <div className="text-sm text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: props.veredictoEstrategia }} />
      </GlowCard>
    </div>
  );
}

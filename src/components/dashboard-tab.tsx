// src/components/dashboard-tab.tsx
// Tab de Dashboard con métricas principales, progreso meta, AB proyectados y estrategia
// FREE: solo ve renta diaria + total parcelas + multiplicador
// PRO: dashboard completo
// ULTRA: dashboard completo + AB proyectados EC + multi-país

"use client";
import { StatCard, MetricBox, GlowCard } from "./stat-card";
import { fmt, type MotorAtlasEarth, type DesgloseMensual } from "@/utils/atlasMath";
import { sanitizeHTML } from "@/utils/sanitize";
import TierComparativa from "./tier-comparativa";
import LockedFeature from "./LockedFeature";
import type { Permissions } from "@/hooks/usePermissions";

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
  desgloseF2p: DesgloseMensual;
  desgloseEc: DesgloseMensual;
  veredictoEstrategia: string;
  totalParcelas: number;
  horasSrb: number;
  eficiencia: number;
  horasBoost: number;
  tipoPase?: string;
  permissions: Permissions;
}

export default function DashboardTab(props: DashboardTabProps) {
  const pctMeta = Math.min(100, (props.motor.total_parcelas / props.parcelasMeta) * 100);

  // ===== FREE: solo ve la renta diaria + total parcelas =====
  if (!props.permissions.canViewFullRent) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">
            💎 Tu renta actual
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard label="Por Día" usd={props.rentaDia} local={props.rentaDia * props.tasa} moneda={props.moneda} />
            <GlowCard className="flex flex-col items-center justify-center text-center p-6 border-white/5">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">🏞️ Total Parcelas</div>
              <div className="text-3xl font-black text-white">{props.totalParcelas}</div>
              <div className="text-xs text-gray-500 mt-1">{props.multTier}x Multiplicador</div>
            </GlowCard>
          </div>
        </div>

        <LockedFeature
          title="📊 Dashboard Completo"
          description="Desbloquea renta semanal, mensual y anual, proyecciones de AB, estrategia inteligente y más. Datos precisos en tu moneda local."
          preview={
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-white/10 rounded animate-pulse w-1/2" />
                  <div className="h-8 bg-white/10 rounded animate-pulse" />
                  <div className="h-4 bg-white/10 rounded animate-pulse w-2/3" />
                </div>
              ))}
            </div>
          }
        />
        
        <LockedFeature
          title="🎯 Meta y Progreso"
          description="Sigue tu progreso hacia tu meta financiera y visualiza los saltos de Tier."
          compact
          requiredPlan="PRO"
        />

        <LockedFeature
          title="🧠 Estrategia Inteligente"
          description="Recomendaciones personalizadas: ¿parcelas, insignias o esperar? Decisiones basadas en tu setup real."
          requiredPlan="PRO"
        />
      </div>
    );
  }

  // ===== PRO / ULTRA: dashboard completo =====
  const baseSec = props.motor.renta_base;
  const passMult = props.motor.pasaporte_mult;
  const mult = props.multTier;
  const srbH = props.horasSrb;

  // 24/7 Boost (24 horas con boost xMult, 0 horas sin boost)
  const rentaDia24 = baseSec * 3600 * 24 * mult * passMult;
  const horasNorm24 = Math.max(0, 720 - srbH);
  const rentaMes24 = (baseSec * 3600 * srbH * 50 + baseSec * 3600 * horasNorm24 * mult) * passMult;
  const rentaMesDia24 = rentaMes24 / 30;

  // 22h/7d Boost (22 horas con boost xMult, 2 horas sin boost x1)
  const rentaDia22 = (baseSec * 3600 * 22 * mult + baseSec * 3600 * 2 * 1) * passMult;
  const horasNorm22 = Math.max(0, 720 - srbH);
  const hBoost22 = horasNorm22 * (22 / 24);
  const hSin22 = horasNorm22 - hBoost22;
  const rentaMes22 = (baseSec * 3600 * srbH * 50 + baseSec * 3600 * hBoost22 * mult + baseSec * 3600 * hSin22 * 1) * passMult;
  const rentaMesDia22 = rentaMes22 / 30;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ≡≡≡ MÉTRICAS PRINCIPALES ≡≡≡ */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-4 flex flex-wrap items-center justify-between gap-2">
          <span>💎 Rendimiento Actual — {props.totalParcelas} Parcelas · {props.multTier}x Multiplicador</span>
          <span className="text-[11px] text-gray-400 font-mono normal-case">
            Boost actual: <strong className="text-cyan-400">{props.horasBoost}h/día</strong> {props.horasBoost === 24 ? "(⚡ 24/7)" : props.horasBoost === 22 ? "(🌙 22h/7d)" : ""}
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Por Día" usd={props.rentaDia} local={props.rentaDia * props.tasa} moneda={props.moneda} />
          <StatCard label="Por Semana" usd={props.rentaSem} local={props.rentaSem * props.tasa} moneda={props.moneda} />
          <StatCard label="Por Mes" usd={props.rentaMes} local={props.rentaMes * props.tasa} moneda={props.moneda} />
          <StatCard label="Por Año" usd={props.rentaAnio} local={props.rentaAnio * props.tasa} moneda={props.moneda} />
        </div>

        {/* Comparativa rápida de ritmos de Boost (24/7 vs 22h/7d) */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0c0c12] border border-white/5 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <span>⚡</span> Con Explorer Club (Boost 24/7):
            </span>
            <span className="text-white font-mono font-bold">${fmt(rentaDia24, 4)} USD/día</span>
            <span className="text-gray-500 text-[11px]">(${fmt(rentaMesDia24, 4)}/d prom. con {props.horasSrb}h SRB)</span>
          </div>
          <div className="hidden sm:block text-gray-700">|</div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              <span>🌙</span> Modo Normal (Boost 22h/7d):
            </span>
            <span className="text-white font-mono font-bold">${fmt(rentaDia22, 4)} USD/día</span>
            <span className="text-gray-500 text-[11px]">(${fmt(rentaMesDia22, 4)}/d prom. con {props.horasSrb}h SRB)</span>
          </div>
        </div>
      </div>

      {/* ≡≡≡ PROGRESO META + TIER ≡≡≡ */}
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

      {/* ≡≡≡ AB PROYECTADOS — F2P (PRO+) / EC (ULTRA) ≡≡≡ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlowCard>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">🌱 AB Proyectados (F2P Gratuito)</div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 p-3 bg-emerald-500/[0.04] rounded-xl border border-emerald-500/10">
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">📅 Por Mes (30 Días)</div>
              <div className="text-2xl font-black bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
                +{props.desgloseF2p.total_mes.toLocaleString()} AB/mes
              </div>
              <div className="text-xs text-gray-400 mt-0.5">≈ {props.desgloseF2p.promedio_diario.toFixed(1)} AB/día</div>
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold text-xs border border-emerald-500/20">
                🏞️ +{Math.floor(props.desgloseF2p.total_mes / 100)} parcelas / mes
              </div>
            </div>
            <div>
              <div className="text-[10px] text-emerald-400 uppercase tracking-wider mb-0.5 font-bold">🏆 Ciclo 90 Días</div>
              <div className="text-2xl font-black text-emerald-300">
                +{props.desgloseF2p.total_90d.toLocaleString()} AB
              </div>
              <div className="text-xs text-gray-400 mt-0.5">≈ {props.desgloseF2p.promedio_diario_90d.toFixed(1)} AB/día</div>
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold text-xs border border-emerald-500/20">
                🏞️ +{Math.floor(props.desgloseF2p.total_90d / 100)} parcelas en total
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <MetricBox label="Ruleta (5/d)" value={`${props.desgloseF2p.ruleta_diaria.toFixed(1)}/d`} color="text-cyan-400" />
            <MetricBox label="Anuncios" value={`${props.desgloseF2p.anuncios_diarios}/d`} color="text-blue-400" />
            <MetricBox label="Asistencia" value={`${props.desgloseF2p.asistencia_mes}/mes`} color="text-purple-400" />
            <MetricBox label="Asist. 90d" value={`${props.desgloseF2p.asistencia_90d} AB`} color="text-emerald-400" />
          </div>

          <div className="mt-3 p-2 rounded-lg bg-black/40 border border-white/5 text-[11px] text-gray-300 flex items-center justify-between">
            <span className="text-cyan-400 font-semibold flex items-center gap-1">
              <span>🌙</span> Renta a 22h/7d:
            </span>
            <span className="font-mono text-white font-bold">
              ${fmt(rentaDia22, 4)} USD/día <span className="text-gray-500 font-normal">(${fmt(rentaMesDia22, 4)} con SRB)</span>
            </span>
          </div>
        </GlowCard>

        {props.permissions.canUseECOptimizer ? (
          <GlowCard className={`border-amber-500/20 ${props.tipoPase?.includes("Explorer Club") ? "ring-1 ring-amber-500/40 shadow-lg shadow-amber-900/10" : ""}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-amber-400 uppercase tracking-widest font-bold">
                🔥 AB Proyectados (Explorer Club)
              </div>
              {props.tipoPase?.includes("Explorer Club") && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  👑 TU PASE ACTIVO
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 p-3 bg-amber-500/[0.05] rounded-xl border border-amber-500/20">
              <div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">📅 Por Mes (30 Días)</div>
                <div className="text-2xl font-black bg-gradient-to-r from-amber-400 to-orange-300 bg-clip-text text-transparent">
                  +{props.desgloseEc.total_mes.toLocaleString()} AB/mes
                </div>
                <div className="text-xs text-gray-400 mt-0.5">≈ {props.desgloseEc.promedio_diario.toFixed(1)} AB/día</div>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                  🏞️ +{Math.floor(props.desgloseEc.total_mes / 100)} parcelas / mes
                </div>
              </div>
              <div>
                <div className="text-[10px] text-amber-400 uppercase tracking-wider mb-0.5 font-bold">🏆 Ciclo Completo (90 Días)</div>
                <div className="text-2xl font-black text-amber-300">
                  +{props.desgloseEc.total_90d.toLocaleString()} AB
                </div>
                <div className="text-xs text-gray-400 mt-0.5">≈ {props.desgloseEc.promedio_diario_90d.toFixed(1)} AB/día</div>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                  🏞️ +{Math.floor(props.desgloseEc.total_90d / 100)} parcelas en total
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <MetricBox label="Ruleta (7/d)" value={`${props.desgloseEc.ruleta_diaria.toFixed(1)}/d`} color="text-cyan-400" />
              <MetricBox label="Anuncios" value={`${props.desgloseEc.anuncios_diarios}/d`} color="text-blue-400" />
              <MetricBox label="Asistencia F2P" value={`${props.desgloseEc.asistencia_mes}/mes`} color="text-purple-400" />
              <MetricBox label="👑 Bonus Club" value={`+${props.desgloseEc.pase_mes.toLocaleString()}/mes`} color="text-amber-400" />
            </div>

            <div className="mt-3 p-2 rounded-lg bg-black/40 border border-amber-500/20 text-[11px] text-gray-300 flex items-center justify-between">
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <span>⚡</span> Renta a 24/7 (EC):
              </span>
              <span className="font-mono text-white font-bold">
                ${fmt(rentaDia24, 4)} USD/día <span className="text-amber-300/80 font-normal">(${fmt(rentaMesDia24, 4)} con SRB)</span>
              </span>
            </div>

            <div className="mt-3 p-2.5 bg-black/40 rounded-lg border border-amber-500/15 text-[11px] text-gray-300 flex items-start gap-2">
              <span className="text-amber-400 text-sm shrink-0">💡</span>
              <div>
                <strong className="text-amber-300">Duración del Ciclo de 90 Días:</strong> El calendario completo otorga <strong className="text-white">+10,550 AB</strong> de bonus de Explorer Club (+448 AB gratuitos), alcanzando hitos masivos en los días 7 (100 AB), 14 (300 AB), 30 (500 AB), 60 (800 AB) y 90 (1,200 AB).
              </div>
            </div>
          </GlowCard>
        ) : (
          <LockedFeature
            title="AB Proyectados (Explorer Club)"
            description="Compara cuánto más ganarías con Explorer Club vs F2P. Datos exactos mes a mes y a 90 días."
            compact
            requiredPlan="ULTRA"
          />
        )}
      </div>

      {/* ≡≡≡ COMPARATIVA TIERS — PRO/ULTRA con multi-país solo ULTRA ≡≡≡ */}
      {props.permissions.canCompareTiers ? (
        <TierComparativa
          motor={props.motor}
          paisActual={props.pais}
          allowMultiCountry={props.permissions.canMultiCountryUltra}
        />
      ) : (
        <LockedFeature
          title="Comparativa Detallada de Tiers"
          description="Comparamos tu renta nivel por nivel frente a todos los países disponibles en Atlas Earth."
          preview={
            <div className="p-4 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="h-8 bg-white/10 rounded animate-pulse" />
                  <div className="h-6 bg-white/10 rounded animate-pulse w-3/4" />
                  <div className="h-6 bg-white/10 rounded animate-pulse w-1/2" />
                </div>
                <div className="space-y-2">
                  <div className="h-8 bg-white/10 rounded animate-pulse" />
                  <div className="h-6 bg-white/10 rounded animate-pulse w-3/4" />
                  <div className="h-6 bg-white/10 rounded animate-pulse w-1/2" />
                </div>
              </div>
            </div>
          }
        />
      )}

      {/* ≡≡≡ ESTRATEGIA — Solo PRO+ ≡≡≡ */}
      <GlowCard>
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">🧠 Estrategia Inteligente</div>
        <div className="text-sm text-gray-300 leading-relaxed prose prose-invert prose-sm
          prose-headings:text-cyan-300 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
          prose-strong:text-amber-300 prose-strong:font-bold
          prose-li:text-gray-300 prose-p:text-gray-300 prose-p:leading-relaxed
          [&_h1]:text-base [&_h1]:font-black [&_h1]:text-cyan-300
          [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-cyan-300
          [&_.highlight]:bg-cyan-900/20 [&_.highlight]:rounded [&_.highlight]:px-2 [&_.highlight]:py-0.5
          [&_.stat]:font-mono [&_.stat]:text-cyan-300
          [&_.badge]:inline-block [&_.badge]:text-[10px] [&_.badge]:font-bold [&_.badge]:uppercase [&_.badge]:px-2 [&_.badge]:py-0.5 [&_.badge]:rounded
          [&_.badge-green]:bg-green-900/40 [&_.badge-green]:text-green-300
          [&_.badge-red]:bg-red-900/40 [&_.badge-red]:text-red-300
          [&_.badge-gold]:bg-amber-900/40 [&_.badge-gold]:text-amber-300"
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(props.veredictoEstrategia) }} />
      </GlowCard>
    </div>
  );
}

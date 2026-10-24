// src/components/auditoria-tab.tsx
// Tab de Auditoría Completa con análisis detallado de la cuenta
// FREE: bloqueado con preview
// PRO/ULTRA: completo

"use client";
import { GlowCard } from "./stat-card";
import type { MotorAtlasEarth } from "@/utils/atlasMath";
import { sanitizeHTML } from "@/utils/sanitize";
import LockedFeature from "./LockedFeature";
import type { Permissions } from "@/hooks/usePermissions";

interface AuditoriaTabProps {
  motor: MotorAtlasEarth;
  parcelasC: number; parcelasR: number; parcelasE: number; parcelasL: number;
  pasaporte: number;
  abPorDia: number;
  tipoPase: string;
  metaUsdDia: number;
  parcelasMeta: number;
  faltantesMeta: number;
  costoMetaAb: number;
  tiempoFree: string; diasFree: number;
  tiempoEc: string; diasEc2: number;
  tramo_actual: number;
  siguiente_tramo: number;
  faltantesTier: number;
  faltanNetosAb: number;
  porcentajeEsc: number;
  colapso: boolean;
  nivelActualPasaporte: number;
  nivelSiguientePasaporte: number;
  insigniasFaltantes: number;
  costoAbPasaporte: number;
  aumentoPasaporte: number;
  parcelasEq: number;
  aumentoParcelas: number;
  veredictoEstrategia: string;
  metaRenta: number;
  permissions: Permissions;
}

export default function AuditoriaTab(props: AuditoriaTabProps) {
  // FREE: bloque completo
  if (!props.permissions.canViewFullAudit) {
    return (
      <div className="space-y-6 animate-fade-in">
        <LockedFeature
          title="📋 Auditoría Completa de tu Cuenta"
          description="Obtén un análisis detallado en 5 pasos: estado actual, meta financiera, escalera de Tiers, estrategia de compras y acción táctica inmediata. Datos precisos basados en tu setup real."
          preview={
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <div className="h-6 bg-white/10 rounded w-1/3 animate-pulse" />
                <div className="h-4 bg-white/10 rounded w-full animate-pulse" />
                <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-20 bg-white/5 rounded-xl animate-pulse" />
              </div>
              <div className="h-28 bg-white/5 rounded-xl animate-pulse" />
              <div className="h-16 bg-white/5 rounded-xl animate-pulse" />
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <span>📋</span> Auditoría Completa de tu Cuenta & Portafolio
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Diagnóstico integral en 5 fases estratégicas con números auditados en tiempo real
          </p>
        </div>
        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
          {props.motor.total_parcelas} Parcelas · Pasaporte Lvl {props.pasaporte}
        </span>
      </div>

      {/* 1. Estado Actual */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
            FASE 1
          </span>
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Estado Actual del Portafolio
          </span>
        </div>
        <GlowCard className="p-4 sm:p-5">
          <div className="text-xs text-gray-400 mb-3">
            Tienes un portafolio de <strong className="text-cyan-400 text-sm">{props.motor.total_parcelas} parcelas</strong> ({props.parcelasC} Comunes · {props.parcelasR} Raras · {props.parcelasE} Épicas · {props.parcelasL} Legendarias). Tu Pasaporte es <strong className="text-yellow-400">Nivel {props.pasaporte}</strong> (+{props.pasaporte * 5}% en rentas). Generas aproximadamente <strong className="text-green-400 font-mono font-bold">{props.abPorDia.toFixed(1)} AB/día</strong> en modo {props.tipoPase === "Ninguno (F2P)" ? "Free to Play (F2P)" : props.tipoPase}.
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="bg-[#0b1019] p-2.5 rounded-lg border border-white/5">
              <div className="text-[10px] text-gray-500">🟢 Comunes</div>
              <div className="text-base font-bold font-mono text-white mt-0.5">{props.parcelasC}</div>
            </div>
            <div className="bg-[#0b1019] p-2.5 rounded-lg border border-white/5">
              <div className="text-[10px] text-gray-500">🔵 Raras</div>
              <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">{props.parcelasR}</div>
            </div>
            <div className="bg-[#0b1019] p-2.5 rounded-lg border border-white/5">
              <div className="text-[10px] text-gray-500">🟣 Épicas</div>
              <div className="text-base font-bold font-mono text-purple-400 mt-0.5">{props.parcelasE}</div>
            </div>
            <div className="bg-[#0b1019] p-2.5 rounded-lg border border-white/5">
              <div className="text-[10px] text-gray-500">🟡 Legendarias</div>
              <div className="text-base font-bold font-mono text-amber-400 mt-0.5">{props.parcelasL}</div>
            </div>
          </div>
        </GlowCard>
      </section>

      {/* 2. Meta Financiera */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
            FASE 2
          </span>
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Camino a tu Meta Financiera Diaria
          </span>
        </div>
        <GlowCard className="p-4 sm:p-5">
          <p className="text-xs text-gray-300 leading-relaxed mb-3">
            Para ganar <strong className="text-orange-400 font-mono font-bold">${props.metaUsdDia.toFixed(4)} USD/día</strong>,
            necesitas un portafolio de <strong className="text-white font-mono">{props.parcelasMeta.toLocaleString()} parcelas</strong>.
            {props.faltantesMeta > 0
              ? <> Te faltan <strong className="text-orange-400 font-mono font-bold">+{props.faltantesMeta} parcelas</strong> (≈{props.costoMetaAb.toLocaleString()} AB).</>
              : <strong className="text-emerald-400"> ¡Meta ya alcanzada o superada! 🎉</strong>}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`rounded-xl p-3.5 border ${!props.tipoPase.includes("Explorer Club") ? "bg-[#0b1019] border-white/10" : "bg-[#0b1019] border-white/5 opacity-80"}`}>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">⏱️ Tiempo Estimado Free to Play (F2P)</div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">{props.tiempoFree}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{props.diasFree.toFixed(1)} días al ritmo diario F2P</div>
            </div>
            <div className={`rounded-xl p-3.5 border ${props.tipoPase.includes("Explorer Club") ? "bg-amber-950/20 border-amber-500/40 ring-1 ring-amber-500/30" : "bg-[#0b1019] border-amber-500/20"}`}>
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">⏱️ Con Explorer Club (24/7)</div>
                {props.tipoPase.includes("Explorer Club") && (
                  <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">TU RITMO</span>
                )}
              </div>
              <div className="text-lg font-bold font-mono text-amber-300 mt-1">{props.tiempoEc}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{props.diasEc2.toFixed(1)} días al ritmo de Explorer Club</div>
            </div>
          </div>
        </GlowCard>
      </section>

      {/* 3. Escalera de Tiers & Alerta */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20">
            FASE 3
          </span>
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Escalera de Tiers & Prevención de Colapso
          </span>
        </div>
        <div className={`p-4 sm:p-5 rounded-2xl border ${props.colapso ? "bg-red-950/30 border-red-500/30" : "bg-gradient-to-br from-[#121622] to-[#0a0f18] border-cyan-900/30"}`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`font-bold ${props.colapso ? "text-red-400" : "text-yellow-400"} text-sm flex items-center gap-1.5`}>
              <span>{props.colapso ? "🛑" : "🏆"}</span>
              <span>{props.colapso ? "Zona de Riesgo: No compres parcelas sueltas" : "Progreso hacia el Siguiente Límite de Tier"}</span>
            </div>
            <span className="text-xs font-mono font-bold text-white">{props.motor.total_parcelas} / {props.siguiente_tramo}</span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed mb-3">
            Estás en el tramo de <strong className="text-cyan-400 font-bold">{props.tramo_actual} parcelas</strong>.
            El siguiente tramo de multiplicador es a las <strong className="text-yellow-400 font-bold">{props.siguiente_tramo} parcelas</strong>.
            Te faltan <strong className="text-white font-bold">{props.faltantesTier} parcelas</strong>
            {props.faltanNetosAb > 0 && <> (<strong className="text-cyan-300 font-mono font-bold">{props.faltanNetosAb.toLocaleString()} AB</strong> requeridos)</>}.
          </p>
          <div className="w-full bg-[#111] rounded-full h-2.5 overflow-hidden border border-white/5">
            <div className={`h-full rounded-full transition-all duration-700 ${
              props.colapso ? "bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500" : "bg-gradient-to-r from-yellow-500 via-green-400 to-emerald-500"
            }`} style={{ width: `${Math.min(100, Math.max(0, props.porcentajeEsc))}%` }} />
          </div>
          <div className="text-[11px] text-gray-400 mt-1 text-right">{props.porcentajeEsc.toFixed(1)}% del ahorro completado</div>
          {props.colapso && (
            <div className="mt-3 p-3 bg-red-900/30 rounded-xl border border-red-500/30 text-xs text-red-200 leading-relaxed flex items-start gap-2">
              <span className="text-base shrink-0">⚠️</span>
              <div>
                <strong className="text-white">Alerta Táctica:</strong> Si compras 1 parcela individual en el límite, tu multiplicador bajará y tu renta diaria se reducirá temporalmente. La estrategia óptima es acumular los <strong className="text-white font-mono">{props.faltanNetosAb.toLocaleString()} AB</strong> y realizar el salto completo de una sola vez.
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. Estrategia Detallada */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
            FASE 4
          </span>
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Estrategia de Asignación de Capital (Insignias vs Parcelas)
          </span>
        </div>
        <GlowCard className="p-4 sm:p-5 space-y-3">
          {props.nivelActualPasaporte < 5 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              <div className="bg-[#0b1019] rounded-xl p-3.5 border border-amber-500/20 text-center">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">🛂 Pasaporte Nivel {props.nivelSiguientePasaporte}</div>
                <div className="text-lg font-bold font-mono text-yellow-400">+${props.aumentoPasaporte.toFixed(5)}/día</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Costo: {props.costoAbPasaporte.toLocaleString()} AB ({props.insigniasFaltantes} insignias)</div>
              </div>
              <div className="bg-[#0b1019] rounded-xl p-3.5 border border-cyan-500/20 text-center">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">🏞️ {props.parcelasEq} Parcelas</div>
                <div className="text-lg font-bold font-mono text-green-400">+${props.aumentoParcelas.toFixed(5)}/día</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Misma inversión en AB</div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 flex items-center gap-2">
              <span>✅</span>
              <span><strong>Pasaporte al máximo (Nivel 5 — 101+ insignias, +25% permanente).</strong> Todo tu capital debe destinarse a saltos estratégicos de parcelas.</span>
            </div>
          )}
          <div className="p-3.5 bg-gradient-to-br from-blue-950/30 to-purple-950/20 border border-blue-500/30 rounded-xl text-xs text-gray-300 leading-relaxed">
            <strong className="text-cyan-300 block mb-1">🧠 Veredicto Estratégico:</strong>
            <span dangerouslySetInnerHTML={{ __html: sanitizeHTML(props.veredictoEstrategia) }} />
          </div>
        </GlowCard>
      </section>

      {/* 5. Acción Táctica Inmediata */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            FASE 5
          </span>
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Acción Táctica Inmediata
          </span>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0c1a16] to-[#0a120e] border border-emerald-500/30 text-xs text-emerald-200 leading-relaxed flex items-start gap-3">
          <span className="text-xl shrink-0">🎯</span>
          <div>
            <strong className="text-white text-sm block mb-1">Tu siguiente paso recomendado:</strong>
            {props.motor.total_parcelas < 40 ? (
              <span>🌱 <strong>Fase Inicial:</strong> Tu objetivo primario es alcanzar 40 parcelas antes de gastar en insignias. Continúa farmeando anuncios de 2 AB cada 20 minutos.</span>
            ) : props.colapso ? (
              <span>🛑 <strong>Ahorro para Salto de Tier:</strong> No compres parcelas individuales sueltas. Acumula <strong className="text-white font-mono">{props.faltanNetosAb.toLocaleString()} AB</strong> para saltar de inmediato al límite de {props.siguiente_tramo} parcelas sin perder renta diaria.</span>
            ) : props.nivelActualPasaporte < 5 && props.aumentoPasaporte > props.aumentoParcelas && props.insigniasFaltantes > 0 ? (
              <span>🛂 <strong>Comprar Insignias:</strong> Compra las <strong className="text-white">{props.insigniasFaltantes} insignias</strong> faltantes para alcanzar el siguiente nivel de pasaporte (Nivel {props.nivelSiguientePasaporte}), ya que te otorga un retorno superior a las parcelas.</span>
            ) : (
              <span>🔋 <strong>Acumulación de Parcelas:</strong> Continúa acumulando parcelas hacia el siguiente escalón. Te faltan {props.faltantesTier} parcelas para completar el tramo.</span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

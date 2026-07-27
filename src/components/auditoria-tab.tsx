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
    <GlowCard className="space-y-6 animate-fade-in">
      <div className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5 pb-3">
        📋 Auditoría Completa de tu Cuenta
      </div>

      <div className="space-y-5 text-sm leading-relaxed text-gray-300">
        {/* 1. Estado Actual */}
        <div>
          <div className="font-bold text-white text-base mb-2">1. 📊 Estado Actual</div>
          <p>
            Tienes un portafolio de <strong className="text-cyan-400">{props.motor.total_parcelas} parcelas</strong> ({props.parcelasC}C · {props.parcelasR}R · {props.parcelasE}E · {props.parcelasL}L).
            Tu Pasaporte es <strong className="text-yellow-400">Nivel {props.pasaporte}</strong> (+{props.pasaporte * 5}% en rentas).
            Generas aproximadamente <strong className="text-green-400">{props.abPorDia.toFixed(1)} AB/día</strong> en modo{" "}
            {props.tipoPase === "Ninguno (F2P)" ? "F2P" : "con pase activo"}.
          </p>
        </div>

        {/* 2. Meta */}
        <div>
          <div className="font-bold text-white text-base mb-2">2. 🎯 Camino a tu Meta Financiera</div>
          <p>
            Para ganar <strong className="text-orange-400">${props.metaUsdDia.toFixed(4)} USD/día</strong>,
            necesitas <strong className="text-white">{props.parcelasMeta.toLocaleString()} parcelas</strong>.
            {props.faltantesMeta > 0
              ? <> Te faltan <strong className="text-orange-400">{props.faltantesMeta} parcelas</strong> (≈{props.costoMetaAb.toLocaleString()} AB).</>
              : <strong className="text-green-400"> ¡Meta ya alcanzada! 🎉</strong>}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div className="bg-[#0e0e0e] rounded-lg p-3 border border-white/5">
              <div className="text-[10px] text-gray-500">⏱️ Tiempo F2P</div>
              <div className="text-base font-bold text-green-400">{props.tiempoFree}</div>
              <div className="text-[10px] text-gray-500">{props.diasFree.toFixed(1)} días</div>
            </div>
            <div className="bg-[#0e0e0e] rounded-lg p-3 border border-amber-500/20">
              <div className="text-[10px] text-gray-500">⏱️ Con Explorer Club</div>
              <div className="text-base font-bold text-amber-400">{props.tiempoEc}</div>
              <div className="text-[10px] text-gray-500">{props.diasEc2.toFixed(1)} días</div>
            </div>
          </div>
        </div>

        {/* 3. Tier Warning */}
        <div className={`p-4 rounded-xl border ${props.colapso ? "bg-red-950/40 border-red-500/20" : "bg-yellow-950/40 border-yellow-500/20"}`}>
          <div className={`font-bold ${props.colapso ? "text-red-400" : "text-yellow-400"} text-base mb-2`}>
            {props.colapso ? "⚠️ 3. ¡PELIGRO! Límite de Tier" : "3. 🏆 Escalera de Tiers"}
          </div>
          <p>
            Estás en el Tier de <strong className="text-cyan-400">{props.tramo_actual} parcelas</strong>.
            El siguiente límite es <strong className="text-yellow-400">{props.siguiente_tramo} parcelas</strong>.
            Te faltan <strong className="text-white">{props.faltantesTier} parcelas</strong>
            {props.faltanNetosAb > 0 && <> ({props.faltanNetosAb.toLocaleString()} AB)</>}.
          </p>
          <div className="mt-2 w-full bg-[#222] rounded-full h-2 overflow-hidden">
            <div className={`h-2 rounded-full transition-all duration-700 ${
              props.colapso ? "bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500" : "bg-gradient-to-r from-yellow-500 via-green-400 to-emerald-500"
            }`} style={{ width: `${props.porcentajeEsc}%` }} />
          </div>
          <div className="text-xs text-gray-500 mt-1">{props.porcentajeEsc.toFixed(1)}% del ahorro completo</div>
          {props.colapso && (
            <div className="mt-2 text-sm text-red-400 font-bold">
              🛑 NO COMPRES parcelas individuales. Ahorra {props.faltanNetosAb.toLocaleString()} AB para saltar de golpe a {props.siguiente_tramo} parcelas.
            </div>
          )}
        </div>

        {/* 4. Estrategia Detallada */}
        <div>
          <div className="font-bold text-white text-base mb-2">4. 💡 Estrategia Detallada</div>
          {props.nivelActualPasaporte < 5 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
              <div className="bg-[#0e0e0e] rounded-lg p-3 border border-white/5 text-center">
                <div className="text-[10px] text-gray-400 mb-1">🛂 Pasaporte Nivel {props.nivelSiguientePasaporte}</div>
                <div className="text-lg font-bold text-yellow-400">+${props.aumentoPasaporte.toFixed(5)}/día</div>
                <div className="text-[10px] text-gray-500">Costo: {props.costoAbPasaporte.toLocaleString()} AB</div>
              </div>
              <div className="bg-[#0e0e0e] rounded-lg p-3 border border-white/5 text-center">
                <div className="text-[10px] text-gray-400 mb-1">🏞️ {props.parcelasEq} Parcelas</div>
                <div className="text-lg font-bold text-green-400">+${props.aumentoParcelas.toFixed(5)}/día</div>
                <div className="text-[10px] text-gray-500">Misma inversión</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400 mb-3">✅ Pasaporte al máximo (Nivel 5). Crecimiento solo por parcelas.</div>
          )}
          <div className="p-3 bg-gradient-to-br from-blue-900/20 to-indigo-900/10 border border-blue-500/20 rounded-lg text-sm">
            <strong className="text-blue-400">🧠 Veredicto:</strong>{" "}
            <span dangerouslySetInnerHTML={{ __html: sanitizeHTML(props.veredictoEstrategia) }} />
          </div>
        </div>

        {/* 5. Paso a paso */}
        <div>
          <div className="font-bold text-white text-base mb-2">5. 🎯 Acción Táctica Inmediata</div>
          <div className="text-sm text-gray-300">
            {props.motor.total_parcelas < 40 ? (
              <>🌱 <strong>Fase Inicial.</strong> Tu objetivo es llegar a 40 parcelas antes de comprar insignias. Sigue farmeando anuncios.</>
            ) : props.colapso ? (
              <>🛑 <strong>Zona de Riesgo.</strong> NO compres parcelas individuales. Acumula {props.faltanNetosAb.toLocaleString()} AB para saltar el Tier.</>
            ) : props.nivelActualPasaporte < 5 && props.aumentoPasaporte > props.aumentoParcelas && props.insigniasFaltantes > 0 ? (
              <>🛂 <strong>Compra {props.insigniasFaltantes} insignias</strong> para subir a Pasaporte Nivel {props.nivelSiguientePasaporte}.</>
            ) : (
              <>🔋 <strong>Acumulación.</strong> Sigue comprando parcelas. Faltan {props.faltantesTier} para el siguiente Tier.</>
            )}
          </div>
        </div>
      </div>
    </GlowCard>
  );
}

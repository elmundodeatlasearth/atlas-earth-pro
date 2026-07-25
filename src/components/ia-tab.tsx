// src/components/ia-tab.tsx
// Tab de IA con asistente de estrategia, créditos y visualización

"use client";
import type { User } from "@supabase/supabase-js";
import { GlowCard } from "./stat-card";

interface IaTabProps {
  user: User | null;
  isUltra: boolean;
  aiCredits: number;
  aiLoading: boolean;
  aiAdvice: string;
  aiError: string;
  totalParcelas: number;
  pasaporte: number;
  abPorDia: number;
  metaUsdDia: number;
  handleGenerateAI: () => Promise<void>;
}

export default function IaTab(props: IaTabProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <GlowCard className="bg-gradient-to-br from-purple-900/30 via-indigo-900/20 to-[#111] border-purple-500/20">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">
          🤖 Asistente de Estrategia
          {props.isUltra && <span className="ml-2 text-purple-400 font-bold animate-pulse">👑 ULTRA</span>}
        </div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent mb-3">
          Análisis Personalizado de tu Cuenta
        </h2>

        {/* Mini métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
          {[
            { label: "Parcelas", value: props.totalParcelas, color: "text-cyan-400" },
            { label: "Pasaporte", value: `Nivel ${props.pasaporte}`, color: "text-amber-400" },
            { label: "AB/día", value: props.abPorDia.toFixed(0), color: "text-purple-400" },
            { label: "Meta", value: `$${props.metaUsdDia.toFixed(4)}/día`, color: "text-orange-400" },
          ].map((m) => (
            <div key={m.label} className="bg-[#0e0e0e] p-2.5 rounded-lg border border-white/5 text-center">
              <div className="text-[10px] text-gray-500 uppercase">{m.label}</div>
              <div className={`text-sm font-bold ${m.color}`}>{m.value}</div>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-500 mb-4">
          Créditos disponibles: <strong className="text-purple-400">{props.isUltra ? "∞ Ilimitados" : props.aiCredits}</strong>
        </div>

        {!props.user ? (
          <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-xl text-red-300 text-sm font-semibold flex items-center gap-2">
            ⚠️ Debes iniciar sesión para usar el Asistente de IA.
          </div>
        ) : (
          <>
            <button onClick={props.handleGenerateAI} disabled={props.aiLoading || (!props.isUltra && props.aiCredits <= 0)}
              className="w-full py-4 rounded-xl font-bold text-white text-sm transition-all duration-300
                bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg shadow-purple-900/40 hover:shadow-purple-900/60 hover:scale-[1.01] active:scale-[0.99]">
              {props.aiLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analizando tu portafolio con IA...
                </span>
              ) : "✨ Generar Estrategia Optimizada"}
            </button>

            {props.aiError && (
              <div className="mt-4 p-4 bg-red-900/40 border border-red-500/30 rounded-xl text-red-300 text-sm font-semibold">
                ⚠️ {props.aiError}
              </div>
            )}

            {props.aiAdvice && (
              <div className="mt-6 p-6 bg-gradient-to-br from-[#0d0d0d] to-[#0a0a0a] rounded-xl border border-purple-500/10 text-gray-200 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: props.aiAdvice }} />
            )}

            {/* Regenerar */}
            {props.aiAdvice && !props.aiLoading && (
              <button onClick={props.handleGenerateAI}
                className="mt-2 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all border border-white/10">
                🔄 Regenerar Análisis
              </button>
            )}
          </>
        )}
      </GlowCard>
    </div>
  );
}

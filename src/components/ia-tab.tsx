// src/components/ia-tab.tsx
// Tab de IA con asistente de estrategia, créditos y visualización

"use client";
import type { User } from "@supabase/supabase-js";
import { GlowCard } from "./stat-card";
import { sanitizeHTML } from "@/utils/sanitize";

interface IaTabProps {
  user: User | null;
  isUltra: boolean;
  aiCredits: number;
  aiCreditsPerMonth: number;
  aiCreditsResetDate: string | null;
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

        <div className="text-xs text-gray-500 mb-4 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            Créditos disponibles:{" "}
            <strong className="text-purple-400">
              {props.isUltra
                ? `50 / mes (${props.aiCredits} restantes este mes)`
                : `${props.aiCredits} / ${props.aiCreditsPerMonth} restantes este mes`}
            </strong>
          </span>
          {props.aiCreditsResetDate && (
            <span className="text-[10px] text-gray-600">
              🔄 Renovación mensual: <strong className="text-cyan-400">{new Date(props.aiCreditsResetDate).toLocaleDateString("es", { day: "numeric", month: "long" })}</strong>
            </span>
          )}
        </div>

        {!props.user ? (
          <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-xl text-red-300 text-sm font-semibold flex items-center gap-2">
            ⚠️ Debes iniciar sesión para usar el Asistente de IA.
          </div>
        ) : (
          <>
            {!props.isUltra && props.aiCredits <= 0 && (
              <div className="p-4 bg-amber-900/30 border border-amber-500/30 rounded-xl text-amber-300 text-sm font-semibold flex items-center gap-2 mb-4">
              💰 No tienes créditos IA disponibles. Los usuarios PRO reciben <strong>5 créditos/mes</strong>. Actualiza a Ultra para 50 créditos/mes o espera al próximo ciclo.
              </div>
            )}
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
              <div className="relative">
                <div className="mt-6 p-6 bg-gradient-to-br from-[#0d0d0d] to-[#0a0a0a] rounded-xl border border-purple-500/15 text-gray-200 text-sm leading-relaxed max-h-[500px] overflow-y-auto
                  prose prose-invert prose-sm prose-headings:text-purple-300 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
                  prose-strong:text-cyan-300 prose-strong:font-bold
                  prose-li:text-gray-300 prose-li:marker:text-purple-500
                  prose-p:text-gray-300 prose-p:leading-relaxed
                  prose-code:text-pink-300 prose-code:bg-white/5 prose-code:px-1 prose-code:rounded
                  prose-hr:border-white/10
                  [&_h1]:text-lg [&_h1]:font-black [&_h1]:text-purple-300 [&_h1]:border-b [&_h1]:border-purple-500/20 [&_h1]:pb-2
                  [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-purple-300 [&_h2]:border-b [&_h2]:border-purple-500/20 [&_h2]:pb-1.5
                  [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-purple-200
                  [&_ul]:space-y-1 [&_ul]:my-2
                  [&_li]:text-xs
                  [&_.highlight]:bg-purple-900/30 [&_.highlight]:rounded [&_.highlight]:px-2 [&_.highlight]:py-0.5 [&_.highlight]:text-purple-200
                  [&_.stat]:inline-flex [&_.stat]:bg-white/5 [&_.stat]:rounded [&_.stat]:px-2 [&_.stat]:py-0.5 [&_.stat]:text-xs [&_.stat]:font-mono [&_.stat]:text-cyan-300
                  [&_.badge]:inline-flex [&_.badge]:text-[10px] [&_.badge]:font-bold [&_.badge]:uppercase [&_.badge]:tracking-wider
                  [&_.badge-green]:bg-green-900/40 [&_.badge-green]:text-green-300 [&_.badge-green]:px-2 [&_.badge-green]:py-0.5 [&_.badge-green]:rounded
                  [&_.badge-red]:bg-red-900/40 [&_.badge-red]:text-red-300 [&_.badge-red]:px-2 [&_.badge-red]:py-0.5 [&_.badge-red]:rounded
                  [&_.badge-gold]:bg-amber-900/40 [&_.badge-gold]:text-amber-300 [&_.badge-gold]:px-2 [&_.badge-gold]:py-0.5 [&_.badge-gold]:rounded
                  [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_table]:my-3
                  [&_td]:border [&_td]:border-white/10 [&_td]:p-2 [&_td]:text-gray-300
                  [&_th]:border [&_th]:border-white/10 [&_th]:p-2 [&_th]:bg-purple-900/30 [&_th]:text-purple-200 [&_th]:font-bold
                  [&_.card]:bg-white/5 [&_.card]:rounded-lg [&_.card]:p-3 [&_.card]:border [&_.card]:border-white/10 [&_.card]:my-2
                  [&_.card-green]:bg-green-900/20 [&_.card-green]:border-green-500/20
                  [&_.card-red]:bg-red-900/20 [&_.card-red]:border-red-500/20
                  [&_.card-blue]:bg-blue-900/20 [&_.card-blue]:border-blue-500/20
                  [&_.card-gold]:bg-amber-900/20 [&_.card-gold]:border-amber-500/20
                  scrollbar-custom"
                  dangerouslySetInnerHTML={{ __html: sanitizeHTML(props.aiAdvice) }} />
                {/* Fade gradient + scroll indicator */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0a0a0a] to-transparent rounded-b-xl" />
                <div className="text-[10px] text-gray-600 text-center mt-1">⬇️ Desplázate para ver el análisis completo</div>
              </div>
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

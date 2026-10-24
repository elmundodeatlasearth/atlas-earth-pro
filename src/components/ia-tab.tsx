// src/components/ia-tab.tsx
// Tab de IA con asistente de estrategia, créditos y visualización en secciones
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
      {/* ≡≡≡ SECCIÓN 1: 📊 DATOS DEL PORTAFOLIO & CRÉDITOS ≡≡≡ */}
      <section className="space-y-2.5">
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
            SECCIÓN 1
          </span>
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Motor de Inteligencia Artificial & Snapshot de Cuenta
          </span>
        </div>

        <GlowCard className="bg-gradient-to-br from-purple-950/40 via-indigo-950/20 to-[#0d0f18] border-purple-500/30 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
            <div>
              <div className="text-xs text-purple-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                <span>🤖</span> Asistente Estratégico Especializado en Atlas Earth
                {props.isUltra && <span className="ml-1 text-[9px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">👑 ULTRA</span>}
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                Generador de Recomendaciones Financieras Autónomas
              </h2>
            </div>
            <div className="text-xs text-gray-400 text-right">
              <div>Créditos mensuales: <strong className="text-purple-300">{props.isUltra ? "50/mes" : `${props.aiCreditsPerMonth}/mes`}</strong></div>
              <div className="text-[10px] text-gray-500">Restantes este ciclo: <strong className="text-white">{props.aiCredits}</strong></div>
            </div>
          </div>

          {/* Mini métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              { label: "Parcelas", value: props.totalParcelas, color: "text-cyan-400" },
              { label: "Pasaporte", value: `Nivel ${props.pasaporte}`, color: "text-amber-400" },
              { label: "AB / Día", value: props.abPorDia.toFixed(1), color: "text-purple-400" },
              { label: "Meta USD", value: `$${props.metaUsdDia.toFixed(4)}/d`, color: "text-orange-400" },
            ].map((m) => (
              <div key={m.label} className="bg-black/40 p-2.5 rounded-xl border border-white/5 text-center">
                <div className="text-[10px] text-gray-400 uppercase">{m.label}</div>
                <div className={`text-sm font-bold font-mono mt-0.5 ${m.color}`}>{m.value}</div>
              </div>
            ))}
          </div>

          {props.aiCreditsResetDate && (
            <div className="text-[11px] text-gray-400 bg-black/30 p-2 rounded-lg border border-white/5 flex items-center justify-between">
              <span>🔄 Fecha de renovación de créditos:</span>
              <strong className="text-cyan-400 font-mono">
                {new Date(props.aiCreditsResetDate).toLocaleDateString("es", { day: "numeric", month: "long" })}
              </strong>
            </div>
          )}

          {!props.user ? (
            <div className="p-3.5 bg-red-950/30 border border-red-500/30 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span> Debes iniciar sesión para consultar al Asistente de IA (con tus créditos mensuales incluidos).
            </div>
          ) : (
            <>
              {!props.isUltra && props.aiCredits <= 0 && (
                <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-semibold flex items-center gap-2">
                  <span>💰</span> No tienes créditos IA disponibles este mes. Los usuarios PRO reciben 5 créditos/mes. Actualiza a Ultra para 50 créditos/mes.
                </div>
              )}
              <button
                onClick={props.handleGenerateAI}
                disabled={props.aiLoading || (!props.isUltra && props.aiCredits <= 0)}
                className="w-full py-3.5 rounded-xl font-bold text-white text-xs sm:text-sm transition-all duration-300
                  bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-lg shadow-purple-900/40 hover:shadow-purple-900/60 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {props.aiLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Analizando tu portafolio y simulaciones con IA...</span>
                  </>
                ) : (
                  <span>✨ Generar Estrategia Optimizada con IA</span>
                )}
              </button>

              {props.aiError && (
                <div className="p-3.5 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs font-semibold">
                  ⚠️ {props.aiError}
                </div>
              )}
            </>
          )}
        </GlowCard>
      </section>

      {/* ≡≡≡ SECCIÓN 2: 🧠 DICTAMEN ESTRATÉGICO GENERADO ≡≡≡ */}
      {props.aiAdvice && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
              SECCIÓN 2
            </span>
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Dictamen Estratégico Generado por IA
            </span>
          </div>

          <GlowCard className="p-5 sm:p-6 space-y-4">
            <div className="relative">
              <div
                className="p-4 sm:p-5 bg-gradient-to-br from-[#0c0f18] to-[#080a10] rounded-xl border border-purple-500/20 text-gray-200 text-xs sm:text-sm leading-relaxed max-h-[500px] overflow-y-auto
                prose prose-invert prose-sm prose-headings:text-purple-300 prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2
                prose-strong:text-cyan-300 prose-strong:font-bold
                prose-li:text-gray-300 prose-li:marker:text-purple-500
                prose-p:text-gray-300 prose-p:leading-relaxed
                prose-code:text-pink-300 prose-code:bg-white/5 prose-code:px-1 prose-code:rounded
                prose-hr:border-white/10
                scrollbar-custom"
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(props.aiAdvice) }}
              />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#080a10] to-transparent rounded-b-xl" />
            </div>

            {!props.aiLoading && (
              <button
                onClick={props.handleGenerateAI}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 hover:text-white transition-all border border-white/10 flex items-center justify-center gap-2 font-semibold"
              >
                <span>🔄</span> Regenerar Análisis de IA
              </button>
            )}
          </GlowCard>
        </section>
      )}
    </div>
  );
}

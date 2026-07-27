// src/components/historial-tab.tsx
// Tab de Historial con chart y formulario de registro de progreso diario
// FREE: solo formulario sin chart
// PRO/ULTRA: chart + formulario completo

"use client";
import type { User } from "@supabase/supabase-js";
import type { HistorialEntry } from "./HistorialChart";
import HistorialChart from "./HistorialChart";
import { GlowCard } from "./stat-card";
import LockedFeature from "./LockedFeature";
import type { Permissions } from "@/hooks/usePermissions";

interface HistorialTabProps {
  user: User | null;
  historialData: HistorialEntry[];
  histFecha: string; setHistFecha: (v: string) => void;
  histAb: number; setHistAb: (v: number) => void;
  histUsd: number; setHistUsd: (v: number) => void;
  histDiam: number; setHistDiam: (v: number) => void;
  histMsg: string;
  guardarHistorial: () => Promise<void>;
  permissions: Permissions;
}

export default function HistorialTab(props: HistorialTabProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Chart — solo PRO+ */}
      {props.user && props.historialData.length > 0 && props.permissions.canHistoryChart ? (
        <GlowCard>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">📈 Progreso en el Tiempo</div>
          <div className="h-64">
            <HistorialChart data={props.historialData} />
          </div>
        </GlowCard>
      ) : props.user && props.historialData.length > 0 && !props.permissions.canHistoryChart ? (
        <LockedFeature
          title="📈 Gráfico de Progreso"
          description="Visualiza tu evolución en el tiempo con gráficos interactivos de AB generados, USD y diamantes."
          compact
          requiredPlan="PRO"
        />
      ) : null}

      {/* Formulario — todos pueden verlo pero solo PRO+ guarda */}
      <GlowCard>
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">
          📝 Registrar Progreso Diario
          {!props.user && <span className="ml-2 text-red-400">(Inicia sesión para guardar)</span>}
          {props.user && !props.permissions.canSaveHistory && (
            <span className="ml-2 text-amber-400">(🔒 PRO+ para guardar historial)</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">📅 Fecha</label>
            <input type="date" value={props.histFecha} onChange={e => props.setHistFecha(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">💰 AB Generados</label>
            <input type="number" value={props.histAb} onChange={e => props.setHistAb(Number(e.target.value))}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">💵 USD Generados</label>
            <input type="number" value={props.histUsd} onChange={e => props.setHistUsd(Number(e.target.value))}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">💎 Diamantes</label>
            <input type="number" value={props.histDiam} onChange={e => props.setHistDiam(Number(e.target.value))}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none transition-all" />
          </div>
          <div className="flex items-end">
            <button onClick={props.guardarHistorial}
              disabled={!props.user || !props.permissions.canSaveHistory}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-900/30">
              💾 Guardar
            </button>
          </div>
        </div>
        {props.histMsg && (
          <div className={`text-xs text-center font-bold mt-2 ${props.histMsg.includes("Error") ? "text-red-400" : "text-green-400"}`}>
            {props.histMsg}
          </div>
        )}
      </GlowCard>
    </div>
  );
}

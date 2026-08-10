// src/components/historial-tab.tsx
// Tab de Historial con chart y formulario de registro de progreso diario
// FREE: solo formulario sin chart
// PRO/ULTRA: chart + formulario completo

"use client";
import type { User } from "@supabase/supabase-js";
import type { HistorialEntry } from "./HistorialChart";
import dynamic from "next/dynamic";

// Lazy-load: chart.js (~200KB) solo se descarga cuando el usuario abre el tab
// Historial, no en el bundle inicial.
const HistorialChart = dynamic(() => import("./HistorialChart"), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center text-gray-500 text-sm animate-pulse">
      Cargando gráfico…
    </div>
  ),
});
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
  borrarHistorial: (id: number) => Promise<void>;
  permissions: Permissions;
}

export default function HistorialTab(props: HistorialTabProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Chart — solo PRO+ */}
      {props.user && props.historialData.length > 0 && props.permissions.canHistoryChart ? (
        <GlowCard>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-gray-500 uppercase tracking-widest">📈 Progreso en el Tiempo</div>
          </div>
          <div className="h-64">
            <HistorialChart data={props.historialData} />
          </div>
          {/* Lista de entradas con botón borrar */}
          <div className="mt-4 space-y-2">
            {props.historialData.slice().reverse().map(entry => (
              <div key={entry.id} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2">
                <div className="flex gap-4 text-xs text-gray-300">
                  <span className="font-mono">📅 {entry.fecha}</span>
                  <span className="text-purple-300">💎 {entry.ab_generado} AB</span>
                  <span className="text-green-400">💰 ${Number(entry.usd_generado || 0).toFixed(4)}</span>
                  {entry.diamantes_obtenidos > 0 && <span className="text-cyan-300">💎 {entry.diamantes_obtenidos} diam</span>}
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`¿Eliminar el registro del ${entry.fecha}?`)) props.borrarHistorial(entry.id!);
                  }}
                  className="text-gray-500 hover:text-red-400 bg-white/5 hover:bg-red-900/30 px-2 py-1 rounded transition-all text-[10px] font-bold"
                  title="Eliminar registro"
                >
                  🗑️
                </button>
              </div>
            ))}
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

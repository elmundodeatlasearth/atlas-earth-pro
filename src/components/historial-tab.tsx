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
      {/* Chart interactivo */}
      {props.historialData.length > 0 ? (
        <GlowCard>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="text-xs text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <span>📈</span> Progreso en el Tiempo ({props.historialData.length} registros)
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
              {props.user ? "☁️ Sincronizado con Supabase" : "💾 Almacenamiento Local Activo"}
            </span>
          </div>
          <div className="h-64">
            <HistorialChart data={props.historialData} />
          </div>
          {/* Lista de entradas con botón borrar */}
          <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-1">
            {props.historialData.slice().reverse().map(entry => (
              <div key={entry.id} className="flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-lg px-3 py-2 transition-colors">
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-gray-300">
                  <span className="font-mono text-cyan-400 font-bold">📅 {entry.fecha}</span>
                  <span className="text-purple-300 font-mono">🪙 {entry.ab_generado} AB</span>
                  <span className="text-emerald-400 font-mono font-bold">💰 ${Number(entry.usd_generado || 0).toFixed(4)} USD</span>
                  {entry.diamantes_obtenidos > 0 && <span className="text-blue-300 font-mono">💎 {entry.diamantes_obtenidos} diam</span>}
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`¿Eliminar el registro del ${entry.fecha}?`)) props.borrarHistorial(entry.id!);
                  }}
                  className="text-gray-500 hover:text-red-400 bg-white/5 hover:bg-red-900/30 px-2 py-1 rounded transition-all text-xs font-bold"
                  title="Eliminar registro"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </GlowCard>
      ) : null}

      {/* Formulario de registro diario */}
      <GlowCard>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="text-xs text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
            <span>📝</span> Registrar Progreso Diario
          </div>
          <span className="text-[10px] text-gray-500">
            {props.user ? "Sincronización en la nube + Respaldo local" : "Modo local (guardado seguro en este dispositivo)"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">📅 Fecha</label>
            <input type="date" value={props.histFecha} onChange={e => props.setHistFecha(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">🪙 AB Generados</label>
            <input type="number" value={props.histAb} onChange={e => props.setHistAb(Number(e.target.value))}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">💵 USD Generados</label>
            <input type="number" step="0.0001" value={props.histUsd} onChange={e => props.setHistUsd(Number(e.target.value))}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none transition-all" />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">💎 Diamantes</label>
            <input type="number" value={props.histDiam} onChange={e => props.setHistDiam(Number(e.target.value))}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none transition-all" />
          </div>
          <div className="flex items-end">
            <button onClick={props.guardarHistorial}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white transition-all shadow-md shadow-cyan-900/30">
              💾 Guardar Registro
            </button>
          </div>
        </div>
        {props.histMsg && (
          <div className={`text-xs text-center font-bold mt-2 ${props.histMsg.includes("Error") ? "text-red-400" : "text-emerald-400"}`}>
            {props.histMsg}
          </div>
        )}
      </GlowCard>
    </div>
  );
}

// src/components/historial-tab.tsx
// Tab de Historial con chart, KPIs, formulario y gestión completa de registros
"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { HistorialEntry } from "./HistorialChart";
import dynamic from "next/dynamic";
import { GlowCard } from "./stat-card";
import type { Permissions } from "@/hooks/usePermissions";
import { exportHistorialCSV } from "@/utils/export-csv";

const HistorialChart = dynamic(() => import("./HistorialChart"), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center text-gray-500 text-sm animate-pulse">
      Cargando gráfico interactivo…
    </div>
  ),
});

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
  limpiarTodoHistorial?: () => Promise<void>;
  iniciarHistorialDesdeHoy?: (ab?: number, usd?: number, diam?: number) => Promise<void>;
  permissions: Permissions;
  abAhorrados?: number;
  rentaDia?: number;
  moneda?: string;
}

export default function HistorialTab(props: HistorialTabProps) {
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetMode, setResetMode] = useState<"actuales" | "ceros">("actuales");
  const [isResetting, setIsResetting] = useState(false);

  // Handlers para fechas rápidas
  const setFechaHoy = () => {
    props.setHistFecha(new Date().toISOString().split("T")[0]);
  };
  const setFechaAyer = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    props.setHistFecha(d.toISOString().split("T")[0]);
  };

  // Cálculo de KPIs rápidos
  const totalRegistros = props.historialData.length;
  const ultimoRegistro = totalRegistros > 0 ? props.historialData[totalRegistros - 1] : null;
  const primerRegistro = totalRegistros > 0 ? props.historialData[0] : null;

  // Promedios diarios
  const deltaAb = ultimoRegistro && primerRegistro && totalRegistros > 1
    ? (ultimoRegistro.ab_generado - primerRegistro.ab_generado) / (totalRegistros - 1)
    : 0;

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      if (resetMode === "actuales") {
        if (props.iniciarHistorialDesdeHoy) {
          await props.iniciarHistorialDesdeHoy(props.abAhorrados || 0, props.rentaDia || 0, 0);
        }
      } else {
        if (props.iniciarHistorialDesdeHoy) {
          await props.iniciarHistorialDesdeHoy(0, 0, 0);
        } else if (props.limpiarTodoHistorial) {
          await props.limpiarTodoHistorial();
        }
      }
      setShowResetModal(false);
    } finally {
      setIsResetting(false);
    }
  };

  const handleCargarValoresActuales = () => {
    props.setHistFecha(new Date().toISOString().split("T")[0]);
    props.setHistAb(props.abAhorrados || 0);
    props.setHistUsd(Number((props.rentaDia || 0).toFixed(4)));
    props.setHistDiam(0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ===== BARRA HERO / CONTROL PRINCIPAL ===== */}
      <div className="bg-gradient-to-r from-[#0d131f] via-[#0f172a] to-[#130f24] border border-cyan-500/30 rounded-2xl p-4 lg:p-5 shadow-xl shadow-cyan-950/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📈</span>
              <h2 className="text-base lg:text-lg font-black text-white tracking-wide">
                Historial de Progreso & Auditoría Diaria
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Monitorea tus ingresos, ganancias de Atlas Bucks y renta acumulada en el tiempo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowResetModal(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-red-600/30 to-amber-600/30 hover:from-red-600/50 hover:to-amber-600/50 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-1.5"
              title="Limpiar registros antiguos e iniciar desde 0 hoy"
            >
              <span>🧹</span> Empezar desde 0 (Hoy)
            </button>

            {props.historialData.length > 0 && (
              <>
                <button
                  onClick={() => exportHistorialCSV(props.historialData)}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                  title="Descargar archivo CSV compatible con Excel"
                >
                  <span>📥</span> Exportar CSV
                </button>

                <button
                  onClick={() => {
                    if (window.confirm("¿Seguro que deseas vaciar TODOS los registros históricos?")) {
                      if (props.limpiarTodoHistorial) props.limpiarTodoHistorial();
                    }
                  }}
                  className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold transition-all"
                  title="Eliminar todos los registros"
                >
                  🗑️ Limpiar Todo
                </button>
              </>
            )}
          </div>
        </div>

        {/* Resumen KPIs */}
        {totalRegistros > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10">
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Días Registrados</span>
              <span className="text-base font-black text-cyan-300">{totalRegistros}</span>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Último AB Reportado</span>
              <span className="text-base font-black text-yellow-400">🪙 {ultimoRegistro?.ab_generado?.toLocaleString() || 0}</span>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Último USD Reportado</span>
              <span className="text-base font-black text-emerald-400">💵 ${Number(ultimoRegistro?.usd_generado || 0).toFixed(4)}</span>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Ritmo Estimado</span>
              <span className="text-base font-black text-purple-300">
                {deltaAb > 0 ? `+${Math.round(deltaAb)} AB/d` : "En seguimiento"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ===== CHART INTERACTIVO Y LISTADO ===== */}
      {props.historialData.length > 0 ? (
        <GlowCard>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="text-xs text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <span>📊</span> Evolución Temporal ({props.historialData.length} registros)
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-medium">
              {props.user ? "☁️ Sincronizado en la Nube (Supabase)" : "💾 Almacenamiento Local Seguro"}
            </span>
          </div>

          <div className="h-64 sm:h-72">
            <HistorialChart data={props.historialData} />
          </div>

          {/* Lista de Entradas Estilizada */}
          <div className="mt-5 space-y-2.5 max-h-72 overflow-y-auto pr-1">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
              Registros Históricos
            </div>
            {props.historialData.slice().reverse().map((entry, index) => {
              const esHoy = entry.fecha === props.histFecha;
              return (
                <div
                  key={entry.id || entry.fecha || index}
                  className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                    esHoy
                      ? "bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-purple-950/30 border-cyan-500/40 shadow-sm shadow-cyan-900/20"
                      : "bg-[#121620]/70 hover:bg-[#161c2a] border-white/5 hover:border-white/10"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-cyan-300 font-black text-sm">📅 {entry.fecha}</span>
                      {esHoy && (
                        <span className="text-[9px] bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.5 rounded border border-cyan-500/30">
                          HOY
                        </span>
                      )}
                    </div>
                    <span className="text-yellow-400 font-mono font-bold flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                      🪙 {entry.ab_generado.toLocaleString()} AB
                    </span>
                    <span className="text-emerald-400 font-mono font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      💰 ${Number(entry.usd_generado || 0).toFixed(4)} USD
                    </span>
                    {entry.diamantes_obtenidos > 0 && (
                      <span className="text-blue-300 font-mono flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        💎 {entry.diamantes_obtenidos} diam
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm(`¿Eliminar el registro del ${entry.fecha}?`)) {
                        if (entry.id) props.borrarHistorial(entry.id);
                      }
                    }}
                    className="text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-950/50 border border-white/5 hover:border-red-500/30 px-2.5 py-1.5 rounded-lg transition-all text-xs font-bold"
                    title="Eliminar este registro"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        </GlowCard>
      ) : (
        <div className="bg-[#0f1420]/80 border border-cyan-500/20 rounded-2xl p-8 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl">
            🚀
          </div>
          <h3 className="text-base font-bold text-white">Historial Limpio y Listo para Empezar</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            No tienes registros antiguos guardados. Puedes registrar tu progreso diario con el formulario a continuación o pulsar &quot;Cargar Valores Actuales&quot;.
          </p>
          <button
            onClick={handleCargarValoresActuales}
            className="px-4 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-bold transition-all shadow-md"
          >
            ⚡ Iniciar con mi Portafolio Actual
          </button>
        </div>
      )}

      {/* ===== FORMULARIO DE REGISTRO DIARIO RENOVADO ===== */}
      <GlowCard>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="text-xs text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
            <span>📝</span> Registrar Progreso Diario
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCargarValoresActuales}
              className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1"
            >
              ⚡ Usar Valores Actuales
            </button>
            <span className="text-[10px] text-gray-500 hidden sm:inline">
              {props.user ? "Sincronizado en la nube" : "Modo local seguro"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-4">
          {/* Fecha con atajos */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] text-gray-300 font-medium">📅 Fecha</label>
              <div className="flex gap-1 text-[9px]">
                <button
                  type="button"
                  onClick={setFechaHoy}
                  className="px-1.5 py-0.5 rounded transition-colors text-gray-400 hover:text-white hover:bg-white/10"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={setFechaAyer}
                  className="px-1.5 py-0.5 rounded transition-colors text-gray-400 hover:text-white hover:bg-white/10"
                >
                  Ayer
                </button>
              </div>
            </div>
            <input
              type="date"
              value={props.histFecha}
              onChange={e => props.setHistFecha(e.target.value)}
              className="w-full bg-[#151922] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/40 transition-all"
            />
          </div>

          {/* AB Generados */}
          <div>
            <label className="text-[11px] text-gray-300 font-medium block mb-1">🪙 AB Acumulados / Día</label>
            <input
              type="number"
              value={props.histAb}
              onChange={e => props.setHistAb(Number(e.target.value))}
              placeholder="0"
              className="w-full bg-[#151922] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-400/40 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {/* USD Generados */}
          <div>
            <label className="text-[11px] text-gray-300 font-medium block mb-1">💵 Renta USD Acumulada</label>
            <input
              type="number"
              step="0.0001"
              value={props.histUsd}
              onChange={e => props.setHistUsd(Number(e.target.value))}
              placeholder="0.0000"
              className="w-full bg-[#151922] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/40 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {/* Diamantes */}
          <div>
            <label className="text-[11px] text-gray-300 font-medium block mb-1">💎 Diamantes en Mano</label>
            <input
              type="number"
              value={props.histDiam}
              onChange={e => props.setHistDiam(Number(e.target.value))}
              placeholder="0"
              className="w-full bg-[#151922] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400/40 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {/* Botón Guardar */}
          <div className="flex items-end">
            <button
              onClick={props.guardarHistorial}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:via-blue-500 hover:to-indigo-500 text-xs font-bold text-white transition-all shadow-lg shadow-cyan-900/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              <span>💾</span> Guardar Registro
            </button>
          </div>
        </div>

        {props.histMsg && (
          <div className={`text-xs text-center font-bold p-2 rounded-xl transition-all ${
            props.histMsg.includes("Error")
              ? "bg-red-950/50 text-red-400 border border-red-500/30"
              : "bg-emerald-950/40 text-emerald-300 border border-emerald-500/30"
          }`}>
            {props.histMsg}
          </div>
        )}
      </GlowCard>

      {/* ===== MODAL DE REINICIO DESDE CERO (HOY) ===== */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#10141f] border border-cyan-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
                🧹
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reiniciar Historial desde 0</h3>
                <p className="text-xs text-gray-400">Elimina registros anteriores y empieza desde hoy</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              ¿Cómo deseas configurar el punto de partida inicial de tu nuevo historial?
            </p>

            <div className="space-y-2.5">
              <label
                onClick={() => setResetMode("actuales")}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  resetMode === "actuales"
                    ? "bg-cyan-950/40 border-cyan-500/60 text-white"
                    : "bg-white/[0.02] border-white/10 text-gray-400 hover:bg-white/[0.04]"
                }`}
              >
                <input
                  type="radio"
                  name="resetMode"
                  checked={resetMode === "actuales"}
                  onChange={() => setResetMode("actuales")}
                  className="mt-1"
                />
                <div>
                  <div className="font-bold text-xs text-cyan-300">
                    ⚡ Iniciar con mi Portafolio Actual (Recomendado)
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    Toma tus {props.abAhorrados || 0} AB ahorrados y tu renta estimada actual como punto de referencia para hoy.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setResetMode("ceros")}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  resetMode === "ceros"
                    ? "bg-cyan-950/40 border-cyan-500/60 text-white"
                    : "bg-white/[0.02] border-white/10 text-gray-400 hover:bg-white/[0.04]"
                }`}
              >
                <input
                  type="radio"
                  name="resetMode"
                  checked={resetMode === "ceros"}
                  onChange={() => setResetMode("ceros")}
                  className="mt-1"
                />
                <div>
                  <div className="font-bold text-xs text-gray-200">
                    ⚪ Iniciar en Cero Absoluto (0 AB, $0 USD)
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    Comienza el contador de ganancias totalmente en blanco a partir de hoy.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-950/40"
              >
                {isResetting ? "Reiniciando…" : "Confirmar y Reiniciar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

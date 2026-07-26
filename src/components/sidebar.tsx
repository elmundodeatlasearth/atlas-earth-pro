// src/components/sidebar.tsx
// Sidebar completo con todos los parámetros y configuración

"use client";
import type { User } from "@supabase/supabase-js";
import AuthSection from "./auth-section";
import { PAISES_DISPONIBLES, MONEDAS_DISPONIBLES, MAP_MONEDAS } from "@/utils/atlasMath";

interface SidebarProps {
  // Params
  parcelasC: number; setParcelasC: (v: number) => void;
  parcelasR: number; setParcelasR: (v: number) => void;
  parcelasE: number; setParcelasE: (v: number) => void;
  parcelasL: number; setParcelasL: (v: number) => void;
  insignias: number; setInsignias: (v: number) => void;
  abAhorrados: number; setAbAhorrados: (v: number) => void;
  horasBoost: number; setHorasBoost: (v: number) => void;
  eficiencia: number; setEficiencia: (v: number) => void;
  pais: string; setPais: (v: string) => void;
  moneda: string; setMoneda: (v: string) => void;
  meta: number; setMeta: (v: number) => void;
  metaPeriodo: "day" | "month" | "year"; setMetaPeriodo: (v: "day" | "month" | "year") => void;
  horasSrb: number; setHorasSrb: (v: number) => void;
  tipoPase: string; setTipoPase: (v: string) => void;
  diaAsistencia: number; setDiaAsistencia: (v: number) => void;
  horaInicio: string; setHoraInicio: (v: string) => void;
  horaFin: string; setHoraFin: (v: string) => void;
  eficienciaAnuncios: number; setEficienciaAnuncios: (v: number) => void;
  metaParcelas: number; setMetaParcelas: (v: number) => void;

  // Auth
  user: User | null;
  authEmail: string; setAuthEmail: (v: string) => void;
  authPass: string; setAuthPass: (v: string) => void;
  authLoading: boolean; authMsg: string;
  isPro: boolean; isUltra: boolean; aiCredits: number;
  handleAuth: (mode: "login" | "signup") => Promise<void>;
  handleLogout: () => Promise<void>;

  // Profiles
  profileName: string; setProfileName: (v: string) => void;
  profileList: string[]; setProfileList: (v: string[]) => void;
  showSaveMsg: boolean;
  guardarPerfil: () => void;
  cargarPerfil: (nombre: string) => void;
  guardarPerfilNube: () => Promise<void>;

  // Summary
  totalParcelas: number;
  multTier: number;
  pasaporte: number;
  siguiente_tramo: number;
  faltantesTier: number;
  faltantesMeta: number;
  tasa: number;
}

function InputRow({ label, value, set, min = 0, max }: { label: string; value: number; set: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs text-gray-400">{label}</label>
      <input type="number" value={value} min={min} max={max} onChange={e => set(Number(e.target.value))}
        className="w-16 bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-cyan-500 transition-all duration-200" />
    </div>
  );
}

export default function Sidebar(props: SidebarProps) {
  return (
    <aside className="w-96 bg-[#0d0d0d]/95 backdrop-blur-xl border-r border-white/5 flex flex-col overflow-y-auto shrink-0">
      {/* Logo + Auth */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center text-xl font-black shadow-lg shadow-cyan-500/30 animate-pulse-glow">
            🌎
          </div>
          <div>
            <div className="font-black text-white text-base leading-tight">Atlas Earth</div>
            <div className="text-[10px] text-cyan-400 font-semibold uppercase tracking-widest">PRO Calculator</div>
          </div>
        </div>

        <AuthSection
          user={props.user}
          authEmail={props.authEmail} authPass={props.authPass}
          authLoading={props.authLoading} authMsg={props.authMsg}
          isPro={props.isPro} isUltra={props.isUltra} aiCredits={props.aiCredits}
          setAuthEmail={props.setAuthEmail} setAuthPass={props.setAuthPass}
          handleAuth={props.handleAuth} handleLogout={props.handleLogout}
        />
      </div>

      <div className="px-5 py-4 space-y-5 flex-1">
        {/* Perfiles */}
        <Section title="📁 Perfil">
          <div className="flex gap-1">
            <select value={props.profileName} onChange={e => props.cargarPerfil(e.target.value)}
              className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none">
              {props.profileList.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <MiniButton onClick={() => {
              const name = window.prompt("Nombre del nuevo perfil:");
              if (name && name.trim() !== "") {
                const safeName = name.trim();
                if (!props.profileList.includes(safeName)) {
                  props.setProfileList([...props.profileList, safeName]);
                }
                props.setProfileName(safeName);
              }
            }} className="bg-green-600/50 hover:bg-green-500/80 text-green-300 border border-green-500/30" title="Añadir Nuevo Perfil">+</MiniButton>
            <MiniButton onClick={props.guardarPerfil} className="bg-cyan-600 hover:bg-cyan-500 text-white" title="Guardar Perfil Actual">💾</MiniButton>
            {props.user && (
              <MiniButton onClick={props.guardarPerfilNube} className="bg-indigo-600 hover:bg-indigo-500 text-white" title="Guardar en la Nube">☁️</MiniButton>
            )}
          </div>
          {props.showSaveMsg && <div className="text-[10px] text-green-400 mt-1">✅ Guardado</div>}
        </Section>

        {/* Moneda + País */}
        <Section title="🌍 Moneda">
          <div className="space-y-1.5">
            <select value={props.moneda} onChange={e => props.setMoneda(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none">
              {MONEDAS_DISPONIBLES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={props.pais} onChange={e => { props.setPais(e.target.value); props.setMoneda(MAP_MONEDAS[e.target.value] || "USD"); }}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none">
              {PAISES_DISPONIBLES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </Section>

        {/* Inventario */}
        <Section title="🗺️ Inventario">
          <div className="space-y-1.5">
            {[
              { label: "🟢 Comunes", v: props.parcelasC, s: props.setParcelasC },
              { label: "🔵 Raras", v: props.parcelasR, s: props.setParcelasR },
              { label: "🟣 Épicas", v: props.parcelasE, s: props.setParcelasE },
              { label: "🟡 Legend.", v: props.parcelasL, s: props.setParcelasL },
            ].map(({ label, v, s }) => (
              <StepperRow key={label} label={label} value={v} set={s} />
            ))}
          </div>
        </Section>

        {/* Resumen rápido */}
        <SummaryCard
          totalParcelas={props.totalParcelas}
          multTier={props.multTier}
          pasaporte={props.pasaporte}
          siguiente_tramo={props.siguiente_tramo}
          faltantesTier={props.faltantesTier}
          faltantesMeta={props.faltantesMeta}
        />

        {/* Parámetros */}
        <Section title="⚙️ Parámetros">
          <div className="space-y-1.5">
            <InputRow label="🏅 Insignias" value={props.insignias} set={props.setInsignias} />
            <InputRow label="💰 AB" value={props.abAhorrados} set={props.setAbAhorrados} />
            <InputRow label="⏰ Boost/día" value={props.horasBoost} set={props.setHorasBoost} max={24} />
            <InputRow label="🎯 Eficiencia %" value={props.eficiencia} set={props.setEficiencia} max={100} />
            <InputRow label="🚀 SRB hrs/mes" value={props.horasSrb} set={props.setHorasSrb} max={200} />
          </div>
        </Section>

        {/* Pase */}
        <Section title="💎 Pase Mensual">
          <select value={props.tipoPase} onChange={e => props.setTipoPase(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none">
            <option>Ninguno (F2P)</option>
            <option>Escalera Anticipada ($9.99)</option>
            <option>Escalera Tardía ($14.99)</option>
            <option>Explorer Club ($50.00)</option>
          </select>
        </Section>

        {/* Meta */}
        <Section title="🎯 Meta de Renta">
          <div className="flex gap-1">
            <div className="relative flex-1">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
              <input type="number" value={props.meta} min={0.01} step={0.5} onChange={e => props.setMeta(Number(e.target.value))}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg pl-5 pr-2 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none" />
            </div>
            <select value={props.metaPeriodo} onChange={e => props.setMetaPeriodo(e.target.value as "day" | "month" | "year")}
              className="bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none">
              <option value="day">/día</option>
              <option value="month">/mes</option>
              <option value="year">/año</option>
            </select>
          </div>
        </Section>

        {/* Anuncios */}
        <Section title="📺 Anuncios">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">Inicio</label>
              <input type="time" value={props.horaInicio} onChange={e => props.setHoraInicio(e.target.value)}
                className="bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">Fin</label>
              <input type="time" value={props.horaFin} onChange={e => props.setHoraFin(e.target.value)}
                className="bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 transition-all" />
            </div>
            <InputRow label="Eficiencia %" value={props.eficienciaAnuncios} set={props.setEficienciaAnuncios} max={100} />
          </div>
        </Section>

        {/* Día asistencia */}
        <Section title="📅 Día Asistencia">
          <input type="range" value={props.diaAsistencia} min={1} max={90} onChange={e => props.setDiaAsistencia(Number(e.target.value))}
            className="w-full accent-cyan-500" />
          <div className="text-xs text-gray-400 text-center">Día {props.diaAsistencia}</div>
        </Section>

        {/* Meta Parcelas */}
        <Section title="🎯 Meta Parcelas">
          <input type="number" value={props.metaParcelas} min={0} onChange={e => props.setMetaParcelas(Number(e.target.value))}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none" />
        </Section>

        {/* Paywalls */}
        {!props.isPro && !props.isUltra && (
          <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/30 rounded-xl p-4 border border-purple-500/20">
            <div className="text-xs font-bold text-purple-300 mb-1">⭐ Desbloquear PRO</div>
            <p className="text-[10px] text-gray-400 leading-relaxed mb-2">Todos los países, Pasaporte Nivel 5, IA y más.</p>
            <a href={process.env.NEXT_PUBLIC_STRIPE_PRO_LINK || "#"} target="_blank" rel="noopener noreferrer"
              className="block w-full text-center text-xs font-bold py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black transition-all shadow-md shadow-amber-900/40">
              ⭐ PRO $4.99/mes
            </a>
          </div>
        )}
        {!props.isUltra && (
          <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/30 rounded-xl p-4 border border-pink-500/20">
            <div className="text-xs font-bold text-pink-300 mb-1">👑 ULTRA</div>
            <p className="text-[10px] text-gray-400 leading-relaxed mb-2">IA ilimitada, prioridad y más.</p>
            <a href={process.env.NEXT_PUBLIC_STRIPE_ULTRA_LINK || "#"} target="_blank" rel="noopener noreferrer"
              className="block w-full text-center text-xs font-bold py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all shadow-md shadow-purple-900/40">
              👑 ULTRA $9.99/mes
            </a>
          </div>
        )}

        {/* Tasa de cambio */}
        {props.moneda !== "USD" && (
          <div className="text-[10px] text-gray-500 text-center">💱 1 USD = {props.tasa.toFixed(4)} {props.moneda}</div>
        )}
      </div>
    </aside>
  );
}

// Sub-components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">{title}</div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  );
}

function MiniButton({ onClick, className, title, children }: { onClick: () => void; className: string; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${className}`} title={title}>
      {children}
    </button>
  );
}

function StepperRow({ label, value, set }: { label: string; value: number; set: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-gray-400 w-20 shrink-0">{label}</label>
      <div className="flex items-center bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden flex-1">
        <button onClick={() => set(Math.max(0, value - 1))}
          className="px-2 py-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-bold">−</button>
        <input type="number" value={value} min={0} onChange={e => set(Math.max(0, Number(e.target.value)))}
          className="flex-1 bg-transparent text-center text-xs text-white focus:outline-none py-1 w-0" />
        <button onClick={() => set(value + 1)}
          className="px-2 py-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-bold">+</button>
      </div>
    </div>
  );
}

function SummaryCard({ totalParcelas, multTier, pasaporte, siguiente_tramo, faltantesTier, faltantesMeta }: {
  totalParcelas: number; multTier: number; pasaporte: number;
  siguiente_tramo: number; faltantesTier: number; faltantesMeta: number;
}) {
  return (
    <div className="bg-gradient-to-br from-[#141414] to-[#0d0d0d] rounded-xl p-3 border border-white/5 space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">Total Parcelas</span>
        <span className="font-bold text-cyan-400">{totalParcelas.toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">Multiplicador</span>
        <span className="font-bold text-yellow-400">{multTier}x</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">Pasaporte</span>
        <span className="font-bold text-amber-400">Nivel {pasaporte} (+{pasaporte * 5}%)</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">Próximo Salto ({siguiente_tramo})</span>
        <span className="font-bold text-pink-400">Faltan {faltantesTier}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">Faltan para Meta USD</span>
        <span className="font-bold text-orange-400">{faltantesMeta > 0 ? faltantesMeta : '✅ Alcanzada'}</span>
      </div>
      <div className="w-full bg-[#222] rounded-full h-1.5 mt-1">
        <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${siguiente_tramo > 0 ? Math.min(100, (totalParcelas / siguiente_tramo) * 100) : 100}%` }} />
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect, useCallback } from "react";
import { MotorAtlasEarth, obtenerTasaCambio, TiersDict } from "@/utils/atlasMath";
import { supabase } from "@/utils/supabase";

const MONEDAS = ["USD","MXN","EUR","CAD","GBP","AUD","BRL","NZD","ZAR"];
const PAISES = ["Estados Unidos"];

const TIERS: TiersDict = {
  "Estados Unidos": {
    limites:         [150, 220, 290, 365, 435, 545, 625, 730, 875, 1100, 1500, 2250, 3000, 10000],
    multiplicadores: [30,  20,  15,  12,  10,  8,   7,   6,   5,   4,    3,    2,    2,    2   ],
  },
};

function fmt(n: number, dec = 4) {
  if (!isFinite(n) || isNaN(n)) return "—";
  return n.toFixed(dec);
}

function StatCard({ label, usd, local, moneda }: { label: string; usd: number; local: number; moneda: string }) {
  return (
    <div className="bg-[#0e0e0e] rounded-xl p-4 border border-white/5">
      <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold text-green-400">${fmt(usd, usd < 1 ? 6 : 2)} USD</div>
      {moneda !== "USD" && (
        <div className="text-base font-semibold text-lime-400 mt-0.5">
          ≈ ${fmt(local, 2)} {moneda}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  // --- Inventario ---
  const [parcelasC, setParcelasC] = useState(150);
  const [parcelasR, setParcelasR] = useState(0);
  const [parcelasE, setParcelasE] = useState(0);
  const [parcelasL, setParcelasL] = useState(0);
  const [insignias, setInsignias] = useState(0);
  const [abAhorrados, setAbAhorrados] = useState(0);
  const [abMinijuegos, setAbMinijuegos] = useState(0);
  const [horasBoost, setHorasBoost] = useState(24);
  const [eficiencia, setEficiencia] = useState(100);
  const [moneda, setMoneda] = useState("USD");
  const [meta, setMeta] = useState(1.0);
  const [horas_srb, setHorasSrb] = useState(64);
  const [simExtra, setSimExtra] = useState(0);
  const [tasa, setTasa] = useState(1.0);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Auth state
  const [session, setSession] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");
  const [aiError, setAiError] = useState("");

  useEffect(() => { setTasa(obtenerTasaCambio(moneda)); }, [moneda]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) setAuthError(error.message);
    setAuthLoading(false);
  };

  const handleSignUp = async (e: any) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
    if (error) setAuthError(error.message);
    else setAuthError("Registro exitoso. Revisa tu correo o inicia sesión directamente.");
    setAuthLoading(false);
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080808]" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="bg-[#111] p-8 rounded-2xl border border-cyan-500/30 shadow-[0_0_50px_rgba(0,221,221,0.1)] w-full max-w-md">
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-3xl font-black shadow-lg shadow-cyan-500/30">🌎</div>
            <h1 className="text-2xl font-black text-white">Atlas Earth PRO</h1>
            <p className="text-gray-400 text-sm">Inicia sesión en la nube para guardar tu progreso y desbloquear la IA.</p>
          </div>

          <form className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Correo Electrónico</label>
              <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest mb-1 block">Contraseña</label>
              <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 focus:outline-none" />
            </div>

            {authError && <div className="text-red-400 text-sm text-center font-semibold bg-red-900/20 p-2 rounded-lg">{authError}</div>}

            <div className="flex gap-4 pt-4">
              <button onClick={handleLogin} disabled={authLoading}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
                Entrar
              </button>
              <button onClick={handleSignUp} disabled={authLoading}
                className="flex-1 bg-[#222] hover:bg-[#333] border border-white/10 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
                Registrarse
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const pasaporte = insignias >= 101 ? 5 : insignias >= 61 ? 4 : insignias >= 31 ? 3 : insignias >= 11 ? 2 : insignias >= 1 ? 1 : 0;

  const motor = new MotorAtlasEarth(parcelasC, parcelasR, parcelasE, parcelasL, pasaporte, horasBoost, eficiencia);
  const pais = "Estados Unidos";

  // Rentas actuales
  const rentaDia   = motor.calcular_renta_generica(motor.total_parcelas, pais, TIERS, horas_srb);
  const rentaSem   = rentaDia * 7;
  const rentaMes   = rentaDia * 30;
  const rentaAnio  = rentaDia * 365;

  // Simulador
  const simTotal   = motor.total_parcelas + simExtra;
  const simDia     = motor.calcular_renta_generica(simTotal, pais, TIERS, horas_srb);
  const simSem     = simDia * 7;
  const simMes     = simDia * 30;
  const simAnio    = simDia * 365;

  // Tier escalera
  const { tramo_actual, siguiente_tramo, faltantes: faltantesTier } = motor.calcular_escalera(pais, TIERS);
  const porcentajeTier = siguiente_tramo > 0
    ? Math.min(100, Math.round((motor.total_parcelas / siguiente_tramo) * 100))
    : 100;

  // Meta automática
  const { p_test: parcelasMeta } = motor.calcular_meta_automatica(meta, pais, TIERS, horas_srb);
  const faltantesMeta = Math.max(0, parcelasMeta - motor.total_parcelas);

  // AB cálculos
  const abDiarios = motor.renta_base * 3600 * 24 * 20 + abMinijuegos / 30;
  const abDiariosEc = abDiarios + 91;
  const abNecesariosMeta = Math.max(0, faltantesMeta * 100 - abAhorrados);
  const diasF2p = abDiarios > 0 ? abNecesariosMeta / abDiarios : Infinity;
  const diasEc  = abDiariosEc > 0 ? abNecesariosMeta / abDiariosEc : Infinity;
  const ahorroEc = diasF2p - diasEc;

  // AB para subir tier
  const abParaTier = Math.max(0, faltantesTier * 100 - abAhorrados);
  const diasTierF2p = abDiarios > 0 ? abParaTier / abDiarios : Infinity;

  const handleGenerateAI = useCallback(async () => {
    setAiLoading(true);
    setAiError("");
    setAiAdvice("");
    try {
      const res = await fetch("https://yzykfkuoievdwqccyjtc.supabase.co/functions/v1/ai-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "anon",
          parcelas: motor.total_parcelas,
          ab_diarios: abDiarios,
          ab_ahorrados: abAhorrados,
          meta_diaria: meta,
          dia_optimo_pase: 75,
          moneda,
          tasa,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error de servidor");
      setAiAdvice(typeof data === "string" ? data : data.advice || JSON.stringify(data));
    } catch (e: any) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  }, [motor.total_parcelas, abDiarios, abAhorrados, meta, moneda, tasa]);

  const tabs = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "simulador", label: "🧮 Simulador" },
    { id: "auditoria", label: "📋 Auditoría" },
    { id: "ia",        label: "🤖 IA PRO" },
  ];

  return (
    <div className="min-h-screen flex bg-[#080808]" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ===== SIDEBAR ===== */}
      <aside className="w-72 bg-[#0d0d0d] border-r border-white/5 flex flex-col overflow-y-auto shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-xl font-black shadow-lg shadow-cyan-500/30">🌎</div>
            <div>
              <div className="font-black text-white text-base leading-tight">Atlas Earth</div>
              <div className="text-[10px] text-cyan-400 font-semibold uppercase tracking-widest">PRO Calculator</div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-5 flex-1">
          {/* Moneda */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">🌍 Moneda Local</label>
            <select value={moneda} onChange={e => setMoneda(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none text-white">
              {MONEDAS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Meta */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">🎯 Meta Diaria (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input type="number" value={meta} min={0.01} step={0.5} onChange={e => setMeta(Number(e.target.value))}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg pl-7 pr-3 py-2 text-sm focus:border-cyan-500 focus:outline-none text-white" />
            </div>
          </div>

          {/* Inventario */}
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">🗺️ Inventario de Parcelas</div>
            <div className="space-y-2">
              {[
                { label: "🟢 Comunes", val: parcelasC, set: setParcelasC, color: "border-green-500/30" },
                { label: "🔵 Raras",   val: parcelasR, set: setParcelasR, color: "border-blue-500/30"  },
                { label: "🟣 Épicas",  val: parcelasE, set: setParcelasE, color: "border-purple-500/30"},
                { label: "🟡 Legend.", val: parcelasL, set: setParcelasL, color: "border-yellow-500/30"},
              ].map(({ label, val, set, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <label className="text-xs text-gray-400 w-20 shrink-0">{label}</label>
                  <div className="flex items-center bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden flex-1">
                    <button onClick={() => set(Math.max(0, val - 1))}
                      className="px-2 py-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-sm font-bold">−</button>
                    <input type="number" value={val} min={0} onChange={e => set(Math.max(0, Number(e.target.value)))}
                      className="flex-1 bg-transparent text-center text-sm text-white focus:outline-none py-1.5 w-0" />
                    <button onClick={() => set(val + 1)}
                      className="px-2 py-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-sm font-bold">+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen rápido inventario */}
          <div className="bg-[#141414] rounded-xl p-3 border border-white/5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Total Parcelas</span>
              <span className="font-bold text-cyan-400">{motor.total_parcelas.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Próximo Tier ({siguiente_tramo})</span>
              <span className="font-bold text-yellow-400">Faltan {faltantesTier}</span>
            </div>
            {/* Barra de progreso */}
            <div className="w-full bg-[#222] rounded-full h-1.5 mt-1">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${porcentajeTier}%` }} />
            </div>
            <div className="text-[10px] text-gray-600 text-right">{porcentajeTier}% del Tier {siguiente_tramo}</div>
          </div>

          {/* Más parámetros */}
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">⚙️ Parámetros</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">🏅 Insignias</label>
                <input type="number" value={insignias} min={0} onChange={e => setInsignias(Number(e.target.value))}
                  className="w-20 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">💰 AB Ahorrados</label>
                <input type="number" value={abAhorrados} min={0} onChange={e => setAbAhorrados(Number(e.target.value))}
                  className="w-20 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">⏰ Horas Boost/día</label>
                <input type="number" value={horasBoost} min={0} max={24} onChange={e => setHorasBoost(Number(e.target.value))}
                  className="w-20 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Pasaporte calculado */}
          <div className="bg-gradient-to-r from-yellow-900/30 to-amber-900/20 rounded-xl p-3 border border-yellow-600/20">
            <div className="text-[10px] text-yellow-400 uppercase tracking-widest mb-1">🛂 Pasaporte Detectado</div>
            <div className="text-xl font-black text-yellow-300">Nivel {pasaporte}</div>
            <div className="text-xs text-gray-400">+{pasaporte * 5}% en todas las rentas</div>
          </div>

          {/* Donar */}
          <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/30 rounded-xl p-4 border border-purple-500/20">
            <div className="text-xs font-bold text-purple-300 mb-1">☕ Apoya el Proyecto</div>
            <p className="text-[10px] text-gray-400 leading-relaxed mb-3">
              Mantener la IA y los servidores tiene un costo mensual. ¡Un café desbloquea 3 consultas de IA gratis!
            </p>
            <a href="https://buy.stripe.com/00w8wP7Mwf1Y3OdaCVcMM02" target="_blank" rel="noopener noreferrer"
              className="block w-full text-center text-xs font-bold py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all shadow-md shadow-purple-900/40">
              ☕ Donar — Desbloquear IA
            </a>
          </div>
          {/* Logout */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <button onClick={() => supabase.auth.signOut()}
              className="w-full bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-500/20 py-2 rounded-lg text-xs font-bold transition-colors">
              Cerrar Sesión ({session.user.email})
            </button>
          </div>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-[#080808]/90 backdrop-blur-md border-b border-white/5 px-8 py-3 flex items-center justify-between">
          <h1 className="text-lg font-black text-white">📊 Tablero de Estrategia PRO</h1>
          <div className="flex gap-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === t.id
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 space-y-8 animate-fade-in">

          {/* === TAB: DASHBOARD === */}
          {activeTab === "dashboard" && (
            <>
              {/* Métricas principales */}
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">💎 Rendimiento Actual — {motor.total_parcelas} Parcelas</div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Por Día"    usd={rentaDia}  local={rentaDia * tasa}  moneda={moneda} />
                  <StatCard label="Por Semana" usd={rentaSem}  local={rentaSem * tasa}  moneda={moneda} />
                  <StatCard label="Por Mes"    usd={rentaMes}  local={rentaMes * tasa}  moneda={moneda} />
                  <StatCard label="Por Año"    usd={rentaAnio} local={rentaAnio * tasa} moneda={moneda} />
                </div>
              </div>

              {/* Estado de la meta */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#111] rounded-2xl p-6 border border-white/5">
                  <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">🎯 Estado de tu Meta</div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Meta diaria</span>
                      <span className="font-bold text-orange-400">${meta.toFixed(2)} USD/día</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Parcelas necesarias</span>
                      <span className="font-bold text-white">{parcelasMeta.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Parcelas que te faltan</span>
                      <span className={`font-bold text-2xl ${faltantesMeta > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                        {faltantesMeta > 0 ? `${faltantesMeta} parcelas` : '✅ Meta Alcanzada'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111] rounded-2xl p-6 border border-white/5">
                  <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">🏆 Progreso al Siguiente Tier</div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Tier actual</span>
                      <span className="font-bold text-cyan-400">{tramo_actual} parcelas</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Siguiente salto</span>
                      <span className="font-bold text-yellow-400">{siguiente_tramo} parcelas</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Parcelas faltantes</span>
                      <span className="font-bold text-pink-400">{faltantesTier}</span>
                    </div>
                    <div className="w-full bg-[#222] rounded-full h-2 mt-2">
                      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-700"
                        style={{ width: `${porcentajeTier}%` }} />
                    </div>
                    <div className="text-[11px] text-gray-500 text-right">{porcentajeTier}% del camino al Tier {siguiente_tramo}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* === TAB: SIMULADOR === */}
          {activeTab === "simulador" && (
            <>
              <div className="bg-[#111] rounded-2xl p-6 border border-white/5">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">🧮 Simulador de Inversión Inmediata</div>
                <div className="mb-6">
                  <label className="text-sm text-gray-400 block mb-2">Parcelas adicionales a comprar:</label>
                  <div className="flex items-center bg-[#1a1a1a] border border-cyan-500/30 rounded-xl overflow-hidden">
                    <button onClick={() => setSimExtra(Math.max(0, simExtra - 1))}
                      className="px-5 py-3 text-gray-400 hover:text-white hover:bg-white/10 transition-colors font-bold text-lg">−</button>
                    <input type="number" value={simExtra} min={0} onChange={e => setSimExtra(Math.max(0, Number(e.target.value)))}
                      className="flex-1 bg-transparent text-center text-2xl font-bold text-white focus:outline-none py-3" />
                    <button onClick={() => setSimExtra(simExtra + 1)}
                      className="px-5 py-3 text-gray-400 hover:text-white hover:bg-white/10 transition-colors font-bold text-lg">+</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Ingreso 24 Horas",   usd: simDia,  local: simDia * tasa  },
                    { label: "Semanal Estimado",    usd: simSem,  local: simSem * tasa  },
                    { label: "Mensual Estimado",    usd: simMes,  local: simMes * tasa  },
                    { label: "Anual Estimado",      usd: simAnio, local: simAnio * tasa },
                  ].map(({ label, usd, local }) => (
                    <div key={label} className="bg-[#0d1a2e] rounded-xl p-4 border border-cyan-900/40">
                      <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{label}</div>
                      <div className="text-xl font-bold text-cyan-400">${fmt(usd, usd < 1 ? 6 : 2)} USD</div>
                      {moneda !== "USD" && (
                        <div className="text-sm font-semibold text-lime-400 mt-0.5">≈ ${fmt(local, 2)} {moneda}</div>
                      )}
                    </div>
                  ))}
                </div>

                {simExtra > 0 && (
                  <div className="mt-6 p-4 bg-green-900/20 border border-green-500/20 rounded-xl">
                    <div className="text-xs text-green-400 font-bold uppercase tracking-wider mb-2">📈 Ganancia Extra por la Inversión</div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { label: "Extra/Día",  v: simDia - rentaDia  },
                        { label: "Extra/Sem",  v: simSem - rentaSem  },
                        { label: "Extra/Mes",  v: simMes - rentaMes  },
                        { label: "Extra/Año",  v: simAnio - rentaAnio },
                      ].map(({ label, v }) => (
                        <div key={label}>
                          <div className="text-[10px] text-gray-500">{label}</div>
                          <div className="text-base font-bold text-green-400">+${fmt(v, v < 1 ? 6 : 2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* === TAB: AUDITORÍA === */}
          {activeTab === "auditoria" && (
            <div className="bg-[#111] rounded-2xl p-6 border border-white/5 space-y-6">
              <div className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5 pb-3">
                📋 Resumen Ejecutivo — Auditoría a Detalle
              </div>

              <div className="space-y-5 text-sm leading-relaxed text-gray-300">
                <div>
                  <span className="font-bold text-white text-base">1. Estado Actual</span>
                  <p className="mt-1">
                    Tienes un portafolio de <strong className="text-cyan-400">{motor.total_parcelas} parcelas</strong>{" "}
                    (Comunes: {parcelasC} · Raras: {parcelasR} · Épicas: {parcelasE} · Legendarias: {parcelasL}).
                    Tu Pasaporte es <strong className="text-yellow-400">Nivel {pasaporte}</strong> (+{pasaporte * 5}% extra en rentas).
                    Generas aproximadamente <strong className="text-green-400">{abDiarios.toFixed(1)} AB/día</strong> jugando gratis.
                  </p>
                </div>

                <div>
                  <span className="font-bold text-white text-base">2. Camino hacia tu Meta Financiera</span>
                  <p className="mt-1">
                    Para ganar <strong className="text-orange-400">${meta.toFixed(2)} USD cada 24 horas</strong>,
                    necesitas poseer un total de <strong className="text-white">{parcelasMeta.toLocaleString()} parcelas</strong>.
                    {faltantesMeta > 0
                      ? <> Te faltan <strong className="text-orange-400">{faltantesMeta} parcelas</strong> para lograr tu objetivo.</>
                      : <strong className="text-green-400"> ¡Meta ya alcanzada! 🎉</strong>
                    }
                  </p>
                </div>

                <div className="p-4 bg-red-950/40 border border-red-500/20 rounded-xl">
                  <span className="font-bold text-red-400 text-base">⚠️ 3. Límite de Tier — ¡Atención!</span>
                  <p className="mt-1">
                    Antes de llegar a tu meta, te toparás con el Tier de{" "}
                    <strong className="text-pink-400">{siguiente_tramo} parcelas</strong>.
                    Te faltan <strong className="text-white">{faltantesTier} parcelas</strong> para este muro.
                    Al llegar,{" "}
                    <strong className="text-red-400">DEJA DE COMPRAR parcelas individuales</strong>{" "}
                    y ahorra AB hasta poder cruzar de golpe al siguiente Tier.
                    Con tu ritmo actual lo alcanzarás en{" "}
                    <strong className="text-white">{isFinite(diasTierF2p) ? `${diasTierF2p.toFixed(1)} días` : '∞'}</strong>.
                  </p>
                </div>

                <div className="p-4 bg-yellow-950/40 border border-yellow-500/20 rounded-xl">
                  <span className="font-bold text-yellow-400 text-base">⭐ 4. El Acelerador: Explorer Club</span>
                  <p className="mt-1">
                    {isFinite(diasF2p) && diasF2p > 0 ? (
                      <>
                        Jugando gratis tardarás{" "}
                        <strong className="text-white">{diasF2p.toFixed(1)} días</strong> en acumular los AB para tu meta.
                        Con el <em>Explorer Club</em>, ese tiempo baja a{" "}
                        <strong className="text-yellow-400">{diasEc.toFixed(1)} días</strong>,
                        ahorrándote <strong className="text-green-400">{ahorroEc.toFixed(1)} días de farmeo</strong>.
                      </>
                    ) : (
                      "¡Tu meta de AB ya está alcanzada o no necesitas más parcelas!"
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* === TAB: IA === */}
          {activeTab === "ia" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/20 rounded-2xl p-6 border border-purple-500/20">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">🤖 Asistente de Estrategia — Powered by Morph LLM</div>
                <h2 className="text-xl font-bold text-purple-300 mb-3">Análisis Personalizado de tu Cuenta</h2>
                <p className="text-sm text-gray-400 mb-6">
                  La IA analizará tu perfil completo: {motor.total_parcelas} parcelas, Pasaporte nivel {pasaporte},
                  {abDiarios.toFixed(0)} AB/día, meta de ${meta.toFixed(2)} USD y te dará un plan de acción detallado.
                </p>

                <button onClick={handleGenerateAI} disabled={aiLoading}
                  className="w-full py-4 rounded-xl font-bold text-white text-sm transition-all
                    bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-lg shadow-purple-900/40 hover:shadow-purple-900/60 hover:scale-[1.01] active:scale-[0.99]">
                  {aiLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Analizando tu portafolio con IA...
                    </span>
                  ) : "✨ Generar Estrategia Optimizada"}
                </button>

                {aiError && (
                  <div className="mt-4 p-4 bg-red-900/40 border border-red-500/30 rounded-xl text-red-300 text-sm">
                    ⚠️ {aiError}
                  </div>
                )}

                {aiAdvice && (
                  <div className="mt-6 p-6 bg-[#0d0d0d] rounded-xl border border-purple-500/10 text-gray-200 text-sm leading-relaxed animate-fade-in"
                    dangerouslySetInnerHTML={{ __html: aiAdvice }} />
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

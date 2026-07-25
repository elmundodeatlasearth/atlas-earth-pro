"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  MotorAtlasEarth,
  obtenerTasaCambio,
  SimuladorDiario,
  optimizadorExplorerClub,
  calcularNivelPasaporte,
  EstrategiaPro,
  fmt,
  TIERS_COMPLETOS,
  PAISES_DISPONIBLES,
  MONEDAS_DISPONIBLES,
  MAP_MONEDAS,
  NIVELES_INSIGNIAS,
} from "@/utils/atlasMath";
import { supabase } from "@/utils/supabase";
import HistorialChart from "@/components/HistorialChart";
import type { VentanaEC } from "@/utils/atlasMath";

// ===== CONSTANTES =====
const TIERS = TIERS_COMPLETOS;

// ===== COMPONENTE STATCARD =====
function StatCard({ label, usd, local, moneda }: { label: string; usd: number; local: number; moneda: string }) {
  return (
    <div className="bg-[#0e0e0e] rounded-xl p-4 border border-white/5 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,221,221,0.1)]">
      <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-black text-green-400">${fmt(usd, usd < 1 ? 6 : 2)} USD</div>
      {moneda !== "USD" && (
        <div className="text-sm font-bold text-lime-400 mt-0.5">≈ ${fmt(local, 2)} {moneda}</div>
      )}
    </div>
  );
}

function MetricBox({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-[#0e0e0e] rounded-lg p-3 border border-white/5">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}

// ===== COMPONENTE PRINCIPAL =====
export default function Home() {
  // ===== ESTADO =====
  const [parcelasC, setParcelasC] = useState(150);
  const [parcelasR, setParcelasR] = useState(0);
  const [parcelasE, setParcelasE] = useState(0);
  const [parcelasL, setParcelasL] = useState(0);
  const [insignias, setInsignias] = useState(0);
  const [abAhorrados, setAbAhorrados] = useState(500);
  const [abMinijuegos, setAbMinijuegos] = useState(0);
  const [horasBoost, setHorasBoost] = useState(18);
  const [eficiencia, setEficiencia] = useState(95);
  const [pais, setPais] = useState("Estados Unidos");
  const [moneda, setMoneda] = useState("USD");
  const [meta, setMeta] = useState(1.0);
  const [metaPeriodo, setMetaPeriodo] = useState<"day" | "month" | "year">("day");
  const [horasSrb, setHorasSrb] = useState(32);
  const [simExtra, setSimExtra] = useState(0);
  const [tasa, setTasa] = useState(1.0);
  const [tipoPase, setTipoPase] = useState<string>("Ninguno (F2P)");
  const [diaAsistencia, setDiaAsistencia] = useState(1);
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFin, setHoraFin] = useState("22:00");
  const [eficienciaAnuncios, setEficienciaAnuncios] = useState(90);
  const [metaParcelas, setMetaParcelas] = useState(150);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Auth state
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMsg, setAuthMsg] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [isUltra, setIsUltra] = useState(false);
  const [aiCredits, setAiCredits] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");
  const [aiError, setAiError] = useState("");

  // Profile state
  const [profileName, setProfileName] = useState("Principal");
  const [profileList, setProfileList] = useState<string[]>(["Principal"]);
  const [showSaveMsg, setShowSaveMsg] = useState(false);

  // History state
  const [historialData, setHistorialData] = useState<any[]>([]);
  const [histFecha, setHistFecha] = useState(new Date().toISOString().split("T")[0]);
  const [histAb, setHistAb] = useState(0);
  const [histUsd, setHistUsd] = useState(0);
  const [histDiam, setHistDiam] = useState(0);
  const [histMsg, setHistMsg] = useState("");

  // Estado de login inicial
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) {
        setSession(s);
        setUser(s.user);
        setAuthEmail(s.user.email || "");
        cargarPerfilNube(s.user.id, s.access_token);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setAuthEmail(s.user.email || "");
        cargarPerfilNube(s.user.id, s.access_token);
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  // Perfiles locales
  useEffect(() => {
    const stored = localStorage.getItem("ae_profiles");
    if (stored) {
      try {
        const list = JSON.parse(stored);
        if (Array.isArray(list) && list.length > 0) setProfileList(list);
      } catch { /* ignore */ }
    }
  }, []);

  // Tasa de cambio
  useEffect(() => { setTasa(obtenerTasaCambio(moneda)); }, [moneda]);

  // Calcular pasaporte
  const pasaporte = useMemo(() => calcularNivelPasaporte(insignias), [insignias]);

  // Motor
  const motor = useMemo(
    () => new MotorAtlasEarth(parcelasC, parcelasR, parcelasE, parcelasL, pasaporte, horasBoost, eficiencia),
    [parcelasC, parcelasR, parcelasE, parcelasL, pasaporte, horasBoost, eficiencia]
  );

  // Rentas actuales
  const multTier = useMemo(() => motor._get_tier_mult(motor.total_parcelas, pais, TIERS), [motor, pais]);
  const rentaDia = useMemo(() => motor.calcular_renta(multTier, horasSrb), [motor, multTier, horasSrb]);
  const rentaSem = rentaDia * 7;
  const rentaMes = rentaDia * 30;
  const rentaAnio = rentaDia * 365;

  // Tiers
  const { tramo_actual, siguiente_tramo, faltantes: faltantesTier } = useMemo(
    () => motor.calcular_escalera(pais, TIERS), [motor, pais]
  );

  // Meta diaria
  const metaUsdDia = useMemo(() => {
    if (metaPeriodo === "month") return meta / 30;
    if (metaPeriodo === "year") return meta / 365;
    return meta;
  }, [meta, metaPeriodo]);

  const { p_test: parcelasMeta, renta_test: metaRenta } = useMemo(
    () => motor.calcular_meta_automatica(metaUsdDia, pais, TIERS, horasSrb),
    [motor, metaUsdDia, pais, horasSrb]
  );
  const faltantesMeta = Math.max(0, parcelasMeta - motor.total_parcelas);
  const costoMetaAb = Math.max(0, faltantesMeta * 100 - abAhorrados);
  const costoTiendaUsd = (costoMetaAb / 2400) * 99.99;

  // AB cálculos
  const [inicioMin, finMin] = useMemo(() => {
    const [ih, im] = horaInicio.split(":").map(Number);
    const [fh, fm] = horaFin.split(":").map(Number);
    let inicio = ih * 60 + im;
    let fin = fh * 60 + fm;
    if (fin < inicio) fin += 1440;
    return [inicio, fin];
  }, [horaInicio, horaFin]);
  const minutosTotales = finMin - inicioMin;
  const maxAnuncios = Math.max(0, Math.floor(minutosTotales / 20));
  const abAnunciosDia = maxAnuncios * 2 * (eficienciaAnuncios / 100);

  // AB Pases
  const abExtraMes = useMemo(() => {
    if (tipoPase === "Escalera Anticipada ($9.99)") return 1034;
    if (tipoPase === "Escalera Tardía ($14.99)") return 1034;
    if (tipoPase === "Explorer Club ($50.00)") return 3450 + 1034;
    return 0;
  }, [tipoPase]);

  const abPorDia = abAnunciosDia + abExtraMes / 30;
  const abEcDiarios = abPorDia + 91;

  // Simulador
  const simTotal = motor.total_parcelas + simExtra;
  const simMult = motor._get_tier_mult(simTotal, pais, TIERS);
  const simMotor = useMemo(
    () => new MotorAtlasEarth(
      parcelasC + Math.floor(simExtra * 0.5),
      parcelasR + Math.floor(simExtra * 0.3),
      parcelasE + Math.floor(simExtra * 0.15),
      parcelasL + simExtra - Math.floor(simExtra * 0.5) - Math.floor(simExtra * 0.3) - Math.floor(simExtra * 0.15),
      pasaporte, horasBoost, eficiencia
    ),
    [parcelasC, parcelasR, parcelasE, parcelasL, simExtra, pasaporte, horasBoost, eficiencia]
  );
  const simDia = simMotor.calcular_renta(simMult, horasSrb);
  const simSem = simDia * 7;
  const simMes = simDia * 30;
  const simAnio = simDia * 365;

  // Simulador 30 días (F2P vs EC)
  const sim = useMemo(() => new SimuladorDiario(diaAsistencia, maxAnuncios), [diaAsistencia, maxAnuncios]);
  const abEscaleraF2p = tipoPase !== "Ninguno (F2P)" ? 294 : 0;
  const abEscaleraEc = tipoPase !== "Ninguno (F2P)" ? 1324 : 0;
  const desgloseF2p = useMemo(() => sim.simular_mes_desglosado(false, abEscaleraF2p), [sim, abEscaleraF2p]);
  const desgloseEc = useMemo(() => sim.simular_mes_desglosado(true, abEscaleraEc), [sim, abEscaleraEc]);

  // Explorer Club Optimizer
  const optData = useMemo(() => optimizadorExplorerClub(diaAsistencia), [diaAsistencia]);

  // Estrategia
  const estrategia = useMemo(() => new EstrategiaPro(), []);

  // Tiempos
  const diasFree = abPorDia > 0 ? costoMetaAb / abPorDia : 0;
  const diasEc2 = abEcDiarios > 0 ? costoMetaAb / abEcDiarios : 0;
  const tiempoFree = motor.formato_tiempo(costoMetaAb, abPorDia);
  const tiempoEc = motor.formato_tiempo(costoMetaAb, abEcDiarios);

  // Escalera
  const balanceAlcanza = Math.floor(abAhorrados / 100);
  const parcelasComprar = Math.max(0, faltantesTier - balanceAlcanza);
  const faltanNetosAb = Math.max(0, faltantesTier * 100 - abAhorrados);
  const porcentajeEsc = faltantesTier > 0 ? Math.min(100, (abAhorrados / (faltantesTier * 100)) * 100) : 100;
  const tiempoEsc = motor.formato_tiempo(faltanNetosAb, abPorDia);

  // ROI
  const rentaAdicional = metaRenta - rentaDia;
  const roiGlobalDias = metaRenta > 0 && costoTiendaUsd > 0 ? costoTiendaUsd / metaRenta : 0;
  const roiMarginalDias = rentaAdicional > 0 && costoTiendaUsd > 0 ? costoTiendaUsd / rentaAdicional : 0;

  // Estrategia inteligente (parcela vs badge)
  const nivelActualPasaporte = pasaporte;
  const nivelSiguientePasaporte = Math.min(nivelActualPasaporte + 1, 5);
  const insigniasRequeridas = NIVELES_INSIGNIAS[nivelSiguientePasaporte] || 101;
  const insigniasFaltantes = Math.max(0, insigniasRequeridas - insignias);
  const costoAbPasaporte = insigniasFaltantes * 200;
  const rentaDiariaBruta = rentaDia / motor.pasaporte_mult;
  const aumentoPasaporte = rentaDiariaBruta * 0.05;
  const parcelasEq = insigniasFaltantes * 2;
  const multParcelasTest = motor._get_tier_mult(motor.total_parcelas + parcelasEq, pais, TIERS);
  const baseRentParcelas = motor.renta_base + parcelasEq * motor.renta_promedio_sec;
  const horasMes = 720;
  const horasNormalesMes = horasMes - horasSrb;
  const pctBoost = horasBoost / 24;
  const horasConBoost = horasNormalesMes * pctBoost * (eficiencia / 100);
  const horasSinBoost = horasNormalesMes - horasConBoost;
  const ingSrbP = baseRentParcelas * 3600 * horasSrb * 50;
  const ingBoostP = baseRentParcelas * 3600 * horasConBoost * multParcelasTest;
  const ingSinP = baseRentParcelas * 3600 * horasSinBoost * 1;
  const rentaFuturaParcelas = ((ingSrbP + ingBoostP + ingSinP) * motor.pasaporte_mult) / 30;
  const aumentoParcelas = rentaFuturaParcelas - rentaDia;
  const colapso = motor.total_parcelas + balanceAlcanza > tramo_actual && faltanNetosAb > 0;

  // ===== FUNCIONES =====
  const guardarPerfil = useCallback(() => {
    const perfil = {
      pais, moneda, horasBoost, eficiencia, horasSrb,
      c_comun: parcelasC, c_rara: parcelasR, c_epica: parcelasE, c_legendaria: parcelasL,
      insignias, ab_manuales: abAhorrados, eficiencia_anuncios: eficienciaAnuncios,
      tipo_pase: tipoPase, meta_dolar: meta, meta_periodo: metaPeriodo,
      meta_parcelas: metaParcelas, dia_asistencia: diaAsistencia,
    };
    localStorage.setItem(`ae_profile_${profileName}`, JSON.stringify(perfil));
    const updated = [...new Set([...profileList, profileName])];
    setProfileList(updated);
    localStorage.setItem("ae_profiles", JSON.stringify(updated));
    setShowSaveMsg(true);
    setTimeout(() => setShowSaveMsg(false), 2000);
  }, [pais, moneda, horasBoost, eficiencia, horasSrb, parcelasC, parcelasR, parcelasE, parcelasL,
      insignias, abAhorrados, eficienciaAnuncios, tipoPase, meta, metaPeriodo, metaParcelas,
      diaAsistencia, profileName, profileList]);

  const cargarPerfil = useCallback((nombre: string) => {
    const data = localStorage.getItem(`ae_profile_${nombre}`);
    if (data) {
      try {
        const p = JSON.parse(data);
        setPais(p.pais || "Estados Unidos");
        setMoneda(p.moneda || "USD");
        setHorasBoost(p.horas_boost ?? 18);
        setEficiencia(p.eficiencia ?? 95);
        setHorasSrb(p.horas_srb_mes ?? 32);
        setParcelasC(p.c_comun ?? 150);
        setParcelasR(p.c_rara ?? 0);
        setParcelasE(p.c_epica ?? 0);
        setParcelasL(p.c_legendaria ?? 0);
        setInsignias(p.insignias ?? 0);
        setAbAhorrados(p.ab_manuales ?? 500);
        setEficienciaAnuncios(p.eficiencia_anuncios ?? 90);
        setTipoPase(p.tipo_pase ?? "Ninguno (F2P)");
        setMeta(p.meta_dolar ?? 1);
        setMetaPeriodo(p.meta_periodo ?? "day");
        setMetaParcelas(p.meta_parcelas ?? 150);
        setDiaAsistencia(p.dia_asistencia ?? 1);
      } catch { /* ignore */ }
    }
    setProfileName(nombre);
  }, []);

  const cargarPerfilNube = async (userId: string, token: string) => {
    try {
      const { data, error } = await supabase
        .from("usuarios_atlas")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (data && !error) {
        if (data.perfil_data) {
          try {
            const p = JSON.parse(data.perfil_data);
            setPais(p.pais || "Estados Unidos");
            setMoneda(p.moneda || "USD");
            setHorasBoost(p.horas_boost ?? 18);
            setEficiencia(p.eficiencia ?? 95);
            setHorasSrb(p.horas_srb_mes ?? 32);
            setParcelasC(p.c_comun ?? 150);
            setParcelasR(p.c_rara ?? 0);
            setParcelasE(p.c_epica ?? 0);
            setParcelasL(p.c_legendaria ?? 0);
            setInsignias(p.insignias ?? 0);
            setAbAhorrados(p.ab_manuales ?? 500);
            setTipoPase(p.tipo_pase ?? "Ninguno (F2P)");
            setMeta(p.meta_dolar ?? 1);
          } catch { /* ignore */ }
        }
        setIsPro(data.is_vip || false);
        setIsUltra(data.is_ultra || false);
        setAiCredits(data.ai_credits || 0);
      }
    } catch { /* ignore */ }
  };

  const guardarPerfilNube = useCallback(async () => {
    if (!user) return;
    const perfil = {
      pais, moneda, horas_boost: horasBoost, eficiencia, horas_srb_mes: horasSrb,
      c_comun: parcelasC, c_rara: parcelasR, c_epica: parcelasE, c_legendaria: parcelasL,
      insignias, ab_manuales: abAhorrados, eficiencia_anuncios: eficienciaAnuncios,
      tipo_pase: tipoPase, meta_dolar: meta, meta_periodo: metaPeriodo,
      meta_parcelas: metaParcelas, dia_asistencia: diaAsistencia,
    };
    const { error } = await supabase.from("usuarios_atlas").upsert({
      user_id: user.id,
      email: user.email,
      perfil_data: JSON.stringify(perfil),
      is_vip: isPro,
      is_ultra: isUltra,
      ai_credits: aiCredits,
    }, { onConflict: "user_id" });
    if (!error) setShowSaveMsg(true);
    setTimeout(() => setShowSaveMsg(false), 2000);
  }, [user, isPro, isUltra, aiCredits, pais, moneda, horasBoost, eficiencia, horasSrb,
      parcelasC, parcelasR, parcelasE, parcelasL, insignias, abAhorrados, eficienciaAnuncios,
      tipoPase, meta, metaPeriodo, metaParcelas, diaAsistencia]);

  const handleAuth = async (mode: "login" | "signup") => {
    setAuthLoading(true);
    setAuthMsg("");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPass });
        if (error) setAuthMsg(`❌ ${error.message}`);
        else setAuthMsg("✅ Cuenta creada. Revisa tu correo para verificar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPass });
        if (error) setAuthMsg(`❌ ${error.message}`);
        else setAuthMsg("✅ Sesión iniciada.");
      }
    } catch (e: any) {
      setAuthMsg(`❌ ${e.message}`);
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsPro(false);
    setIsUltra(false);
    setAiCredits(0);
  };

  const handleGenerateAI = useCallback(async () => {
    setAiLoading(true);
    setAiError("");
    setAiAdvice("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-advisor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          },
          body: JSON.stringify({
            user_id: user?.id || "anon",
            parcelas: motor.total_parcelas,
            ab_diarios: abPorDia,
            ab_ahorrados: abAhorrados,
            meta_diaria: metaUsdDia,
            dia_optimo_pase: optData.optimo.dia_inicio,
            moneda,
            tasa,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error del servidor");
      setAiAdvice(typeof data === "string" ? data : data.advice || JSON.stringify(data));
    } catch (e: any) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  }, [motor, abPorDia, abAhorrados, metaUsdDia, optData, moneda, tasa, user]);

  const guardarHistorial = async () => {
    if (!user) { setHistMsg("Debes iniciar sesión"); return; }
    const { error } = await supabase.from("historial_atlas").upsert({
      user_id: user.id,
      fecha: histFecha,
      ab_generado: histAb,
      usd_generado: histUsd,
      diamantes_obtenidos: histDiam,
    }, { onConflict: "user_id,fecha" });
    if (error) setHistMsg("Error al guardar");
    else setHistMsg("✅ Progreso guardado");
    setTimeout(() => setHistMsg(""), 3000);
  };

  const cargarHistorial = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("historial_atlas")
      .select("*")
      .eq("user_id", user.id)
      .order("fecha", { ascending: true });
    if (data) setHistorialData(data);
  }, [user]);

  useEffect(() => { if (user) cargarHistorial(); }, [user, cargarHistorial]);

  // Veredicto estratégico
  const veredictoEstrategia = useMemo(() => {
    if (colapso) {
      return `⚠️ ZONA DE RIESGO: Estás en el límite del Tier (${motor.total_parcelas} parcelas). No compres parcelas individuales. Ahorra ${faltanNetosAb.toLocaleString()} AB para saltar a ${siguiente_tramo}.`;
    }
    if (nivelActualPasaporte < 5 && aumentoPasaporte > aumentoParcelas && insigniasFaltantes > 0) {
      return `✅ Compra ${insigniasFaltantes} insignias para subir a Nivel ${nivelSiguientePasaporte}. Te dará +$${aumentoPasaporte.toFixed(5)}/día.`;
    }
    if (faltantesTier > 0) {
      return `✅ Sigue comprando parcelas. Faltan ${faltantesTier} para el siguiente Tier.`;
    }
    return "✅ Todo en orden. Sigue acumulando.";
  }, [colapso, motor.total_parcelas, faltanNetosAb, siguiente_tramo, nivelActualPasaporte,
      aumentoPasaporte, aumentoParcelas, insigniasFaltantes, nivelSiguientePasaporte, faltantesTier]);

  // ===== RENDER =====
  const tabs = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "simulador", label: "🧮 Simulador" },
    { id: "auditoria", label: "📋 Auditoría" },
    { id: "ia", label: "🤖 IA PRO" },
    { id: "historial", label: "📈 Historial" },
  ];

  const inyectarEscenario = (prefix: string, esc: VentanaEC) => ({
    [`${prefix}_INICIO`]: esc.dia_inicio,
    [`${prefix}_FIN`]: esc.dia_fin,
    [`${prefix}_AB_PASE`]: esc.ab_pase.toLocaleString(),
    [`${prefix}_AB_GRATIS`]: esc.ab_gratis.toLocaleString(),
    [`${prefix}_NETO`]: esc.neto_ab.toLocaleString(),
    [`${prefix}_PARCELAS`]: Math.floor(esc.neto_ab / 100).toLocaleString(),
    [`${prefix}_ESPERA`]: esc.dias_espera,
    [`${prefix}_FECHA`]: esc.fecha_compra,
  });

  return (
    <div className="min-h-screen flex bg-[#080808]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ===== SIDEBAR ===== */}
      <aside className="w-80 bg-[#0d0d0d] border-r border-white/5 flex flex-col overflow-y-auto shrink-0">
        {/* Logo + Auth */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-xl font-black shadow-lg shadow-cyan-500/30">
              🌎
            </div>
            <div>
              <div className="font-black text-white text-base leading-tight">Atlas Earth</div>
              <div className="text-[10px] text-cyan-400 font-semibold uppercase tracking-widest">PRO Calculator</div>
            </div>
          </div>

          {/* Auth */}
          {!user ? (
            <div className="space-y-2">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">🔑 Iniciar Sesión</div>
              <input type="email" placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none placeholder:text-gray-600" />
              <input type="password" placeholder="Contraseña" value={authPass} onChange={e => setAuthPass(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none placeholder:text-gray-600" />
              <div className="flex gap-2">
                <button onClick={() => handleAuth("login")} disabled={authLoading}
                  className="flex-1 text-xs font-bold py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-all disabled:opacity-50">
                  {authLoading ? "..." : "Entrar"}
                </button>
                <button onClick={() => handleAuth("signup")} disabled={authLoading}
                  className="flex-1 text-xs font-bold py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50">
                  Registro
                </button>
              </div>
              {authMsg && <div className="text-[10px] text-gray-400 mt-1">{authMsg}</div>}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                <div className="text-xs text-gray-300 truncate">✅ {user.email}</div>
                <button onClick={handleLogout} className="text-[10px] text-red-400 hover:text-red-300 ml-2 shrink-0">
                  Salir
                </button>
              </div>
              <div className="flex gap-1 mt-2">
                {isUltra ? (
                  <span className="text-[10px] font-bold text-purple-400 bg-purple-900/30 px-2 py-1 rounded">👑 ULTRA</span>
                ) : isPro ? (
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded">✅ PRO</span>
                ) : (
                  <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded">🔒 Free</span>
                )}
                <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded">💎 {isUltra ? "∞" : aiCredits} créditos IA</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4 flex-1">
          {/* Perfiles */}
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">📁 Perfil</div>
            <div className="flex gap-1">
              <select value={profileName} onChange={e => cargarPerfil(e.target.value)}
                className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none">
                {profileList.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button onClick={() => {
                const name = window.prompt("Nombre del nuevo perfil:");
                if (name && name.trim() !== "") {
                  const safeName = name.trim();
                  setProfileName(safeName);
                  if (!profileList.includes(safeName)) setProfileList([...profileList, safeName]);
                }
              }}
                className="px-2 py-1.5 bg-green-600/50 hover:bg-green-500/80 text-green-300 border border-green-500/30 rounded-lg text-xs font-bold transition-all"
                title="Añadir Nuevo Perfil">
                +
              </button>
              <button onClick={guardarPerfil}
                className="px-2 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all"
                title="Guardar Perfil Actual">
                💾
              </button>
            </div>
            {showSaveMsg && <div className="text-[10px] text-green-400 mt-1">✅ Guardado</div>}
          </div>

          {/* Moneda */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">🌍 Moneda</label>
            <select value={moneda} onChange={e => setMoneda(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none">
              {MONEDAS_DISPONIBLES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* País */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">🗺️ País</label>
            <select value={pais} onChange={e => { setPais(e.target.value); setMoneda(MAP_MONEDAS[e.target.value] || "USD"); }}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none">
              {PAISES_DISPONIBLES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Parcelas */}
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">🗺️ Inventario</div>
            <div className="space-y-1.5">
              {[
                { label: "🟢 Comunes", val: parcelasC, set: setParcelasC },
                { label: "🔵 Raras", val: parcelasR, set: setParcelasR },
                { label: "🟣 Épicas", val: parcelasE, set: setParcelasE },
                { label: "🟡 Legend.", val: parcelasL, set: setParcelasL },
              ].map(({ label, val, set }) => (
                <div key={label} className="flex items-center gap-2">
                  <label className="text-xs text-gray-400 w-16 shrink-0">{label}</label>
                  <div className="flex items-center bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden flex-1">
                    <button onClick={() => set(Math.max(0, val - 1))}
                      className="px-2 py-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-bold">−</button>
                    <input type="number" value={val} min={0} onChange={e => set(Math.max(0, Number(e.target.value)))}
                      className="flex-1 bg-transparent text-center text-xs text-white focus:outline-none py-1 w-0" />
                    <button onClick={() => set(val + 1)}
                      className="px-2 py-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-bold">+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumen rápido */}
          <div className="bg-[#141414] rounded-xl p-3 border border-white/5 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Total Parcelas</span>
              <span className="font-bold text-cyan-400">{motor.total_parcelas.toLocaleString()}</span>
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
            {/* Barra tier */}
            <div className="w-full bg-[#222] rounded-full h-1.5 mt-1">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${siguiente_tramo > 0 ? Math.min(100, (motor.total_parcelas / siguiente_tramo) * 100) : 100}%` }} />
            </div>
          </div>

          {/* Parámetros */}
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">⚙️ Parámetros</div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">🏅 Insignias</label>
                <input type="number" value={insignias} min={0} onChange={e => setInsignias(Number(e.target.value))}
                  className="w-16 bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:outline-none" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">💰 AB</label>
                <input type="number" value={abAhorrados} min={0} onChange={e => setAbAhorrados(Number(e.target.value))}
                  className="w-16 bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:outline-none" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">⏰ Boost/día</label>
                <input type="number" value={horasBoost} min={0} max={24} onChange={e => setHorasBoost(Number(e.target.value))}
                  className="w-16 bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:outline-none" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">🎯 Eficiencia</label>
                <input type="number" value={eficiencia} min={0} max={100} onChange={e => setEficiencia(Number(e.target.value))}
                  className="w-16 bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:outline-none" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">🚀 SRB hrs/mes</label>
                <input type="number" value={horasSrb} min={0} max={200} onChange={e => setHorasSrb(Number(e.target.value))}
                  className="w-16 bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Pase */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">💎 Pase Mensual</label>
            <select value={tipoPase} onChange={e => setTipoPase(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none">
              <option>Ninguno (F2P)</option>
              <option>Escalera Anticipada ($9.99)</option>
              <option>Escalera Tardía ($14.99)</option>
              <option>Explorer Club ($50.00)</option>
            </select>
          </div>

          {/* Metas */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">🎯 Meta de Renta</label>
            <div className="flex gap-1">
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                <input type="number" value={meta} min={0.01} step={0.5} onChange={e => setMeta(Number(e.target.value))}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg pl-5 pr-2 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none" />
              </div>
              <select value={metaPeriodo} onChange={e => setMetaPeriodo(e.target.value as any)}
                className="bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none">
                <option value="day">/día</option>
                <option value="month">/mes</option>
                <option value="year">/año</option>
              </select>
            </div>
          </div>

          {/* Anuncios */}
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">📺 Anuncios</div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">Inicio</label>
                <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)}
                  className="bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">Fin</label>
                <input type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)}
                  className="bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">Eficiencia</label>
                <input type="number" value={eficienciaAnuncios} min={0} max={100} onChange={e => setEficienciaAnuncios(Number(e.target.value))}
                  className="w-16 bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:outline-none" />
              </div>
            </div>
          </div>

          {/* Día asistencia */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">📅 Día Asistencia (1-90)</label>
            <input type="range" value={diaAsistencia} min={1} max={90} onChange={e => setDiaAsistencia(Number(e.target.value))}
              className="w-full accent-cyan-500" />
            <div className="text-xs text-gray-400 text-center">Día {diaAsistencia}</div>
          </div>

          {/* Meta Parcelas */}
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">🎯 Meta Parcelas</label>
            <input type="number" value={metaParcelas} min={0} onChange={e => setMetaParcelas(Number(e.target.value))}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none" />
          </div>

          {/* Donar / Paywall */}
          {!isPro && !isUltra && (
            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/30 rounded-xl p-4 border border-purple-500/20">
              <div className="text-xs font-bold text-purple-300 mb-1">⭐ Desbloquear PRO</div>
              <p className="text-[10px] text-gray-400 leading-relaxed mb-2">
                Todos los países, Pasaporte Nivel 5, IA y más.
              </p>
              <a href={process.env.NEXT_PUBLIC_STRIPE_PRO_LINK || "#"} target="_blank" rel="noopener noreferrer"
                className="block w-full text-center text-xs font-bold py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black transition-all shadow-md shadow-amber-900/40">
                ⭐ PRO $4.99/mes
              </a>
            </div>
          )}
          {!isUltra && (
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
          {moneda !== "USD" && (
            <div className="text-[10px] text-gray-500 text-center">💱 1 USD = {tasa.toFixed(4)} {moneda}</div>
          )}
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-[#080808]/90 backdrop-blur-md border-b border-white/5 px-8 py-3 flex items-center justify-between">
          <h1 className="text-lg font-black text-white">
            {isPro || isUltra ? "📊 Atlas Earth PRO" : "📊 Atlas Earth"}
          </h1>
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
          {/* ===== TAB: DASHBOARD ===== */}
          {activeTab === "dashboard" && (
            <>
              {/* Métricas principales */}
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">
                  💎 Rendimiento Actual — {motor.total_parcelas} Parcelas · {multTier}x Multiplicador
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Por Día" usd={rentaDia} local={rentaDia * tasa} moneda={moneda} />
                  <StatCard label="Por Semana" usd={rentaSem} local={rentaSem * tasa} moneda={moneda} />
                  <StatCard label="Por Mes" usd={rentaMes} local={rentaMes * tasa} moneda={moneda} />
                  <StatCard label="Por Año" usd={rentaAnio} local={rentaAnio * tasa} moneda={moneda} />
                </div>
              </div>

              {/* Progreso Meta + Tier */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#111] rounded-2xl p-6 border border-white/5">
                  <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">🎯 Estado de tu Meta</div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Meta diaria</span>
                      <span className="font-bold text-orange-400">${metaUsdDia.toFixed(4)} USD/día</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Parcelas necesarias</span>
                      <span className="font-bold text-white">{parcelasMeta.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Parcelas que faltan</span>
                      <span className={`font-bold text-2xl ${faltantesMeta > 0 ? "text-orange-400" : "text-green-400"}`}>
                        {faltantesMeta > 0 ? `${faltantesMeta} parcelas` : "✅ Meta Alcanzada"}
                      </span>
                    </div>
                    {faltantesMeta > 0 && (
                      <>
                        <div className="w-full bg-[#222] rounded-full h-2">
                          <div className="bg-gradient-to-r from-orange-500 to-green-500 h-2 rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(100, (motor.total_parcelas / parcelasMeta) * 100)}%` }} />
                        </div>
                        <div className="text-[11px] text-gray-500 text-right">
                          {Math.min(100, ((motor.total_parcelas / parcelasMeta) * 100)).toFixed(1)}% de la meta
                        </div>
                      </>
                    )}
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
                        style={{ width: `${siguiente_tramo > 0 ? Math.min(100, (motor.total_parcelas / siguiente_tramo) * 100) : 100}%` }} />
                    </div>
                    <div className="text-[11px] text-gray-500 text-right">
                      {siguiente_tramo > 0 ? Math.min(100, (motor.total_parcelas / siguiente_tramo) * 100).toFixed(1) : 100}% del camino
                    </div>
                  </div>
                </div>
              </div>

              {/* AB Proyectados */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#111] rounded-2xl p-6 border border-white/5">
                  <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">🌱 AB Proyectados (F2P)</div>
                  <div className="text-3xl font-black text-green-400">+{desgloseF2p.total_mes.toLocaleString()} AB/mes</div>
                  <div className="text-sm text-gray-400 mt-1">≈ {desgloseF2p.promedio_diario.toFixed(1)} AB/día</div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <MetricBox label="Ruleta" value={`${desgloseF2p.ruleta_diaria.toFixed(1)}/d`} color="text-cyan-400" />
                    <MetricBox label="Anuncios" value={`${desgloseF2p.anuncios_diarios}/d`} color="text-blue-400" />
                    <MetricBox label="Asistencia" value={`${desgloseF2p.asistencia_mes}/mes`} color="text-purple-400" />
                  </div>
                </div>

                <div className="bg-[#111] rounded-2xl p-6 border border-amber-500/20">
                  <div className="text-xs text-amber-400 uppercase tracking-widest mb-3">🔥 AB Proyectados (Explorer Club)</div>
                  <div className="text-3xl font-black text-amber-400">+{desgloseEc.total_mes.toLocaleString()} AB/mes</div>
                  <div className="text-sm text-gray-400 mt-1">≈ {desgloseEc.promedio_diario.toFixed(1)} AB/día</div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <MetricBox label="Ruleta" value={`${desgloseEc.ruleta_diaria.toFixed(1)}/d`} color="text-cyan-400" />
                    <MetricBox label="Anuncios" value={`${desgloseEc.anuncios_diarios}/d`} color="text-blue-400" />
                    <MetricBox label="Asistencia" value={`${desgloseEc.asistencia_mes}/mes`} color="text-purple-400" />
                  </div>
                </div>
              </div>

              {/* Estrategia Inteligente */}
              <div className="bg-[#111] rounded-2xl p-6 border border-white/5">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">🧠 Estrategia Inteligente</div>
                <div className="text-sm text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: veredictoEstrategia }} />
              </div>
            </>
          )}

          {/* ===== TAB: SIMULADOR ===== */}
          {activeTab === "simulador" && (
            <>
              {/* Inversión Inmediata */}
              <div className="bg-[#111] rounded-2xl p-6 border border-white/5">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">🧮 Simulador de Inversión Inmediata</div>
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-2">
                    💡 Tienes <strong className="text-cyan-400">{abAhorrados.toLocaleString()} AB</strong> — podrías comprar <strong className="text-green-400">{Math.floor(abAhorrados / 100)} parcelas</strong> ahora.
                  </div>
                  <label className="text-sm text-gray-400 block mb-2">Parcelas adicionales a simular:</label>
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
                    { label: "Ingreso 24 Horas", usd: simDia, local: simDia * tasa },
                    { label: "Semanal Estimado", usd: simSem, local: simSem * tasa },
                    { label: "Mensual Estimado", usd: simMes, local: simMes * tasa },
                    { label: "Anual Estimado", usd: simAnio, local: simAnio * tasa },
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
                  <div className="mt-4 p-4 bg-green-900/20 border border-green-500/20 rounded-xl">
                    <div className="text-xs text-green-400 font-bold uppercase tracking-wider mb-2">📈 Ganancia Extra</div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { label: "Extra/Día", v: simDia - rentaDia },
                        { label: "Extra/Sem", v: simSem - rentaSem },
                        { label: "Extra/Mes", v: simMes - rentaMes },
                        { label: "Extra/Año", v: simAnio - rentaAnio },
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

              {/* Calculadora Parcela vs Insignia */}
              <div className="bg-[#111] rounded-2xl p-6 border border-white/5">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">⚖️ Calculadora: ¿Parcelas o Insignias?</div>
                {nivelActualPasaporte < 5 ? (
                  <>
                    <div className="text-sm text-gray-400 mb-3">
                      Te faltan <strong className="text-white">{insigniasFaltantes} insignias</strong> para el Nivel {nivelSiguientePasaporte} (${costoAbPasaporte.toLocaleString()} AB).
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#0e1a0e] rounded-xl p-4 border border-green-500/20 text-center">
                        <div className="text-xs text-gray-400 mb-1">🏞️ {parcelasEq} Parcelas</div>
                        <div className="text-lg font-bold text-green-400">+${aumentoParcelas.toFixed(5)}/día</div>
                      </div>
                      <div className="bg-[#1a1a0e] rounded-xl p-4 border border-yellow-500/20 text-center">
                        <div className="text-xs text-gray-400 mb-1">🛂 Pasaporte Nivel {nivelSiguientePasaporte}</div>
                        <div className="text-lg font-bold text-yellow-400">+${aumentoPasaporte.toFixed(5)}/día</div>
                      </div>
                    </div>
                    <div className={`mt-3 p-3 rounded-lg text-sm font-bold ${aumentoParcelas > aumentoPasaporte ? "bg-green-900/20 text-green-400" : "bg-yellow-900/20 text-yellow-400"}`}>
                      {aumentoParcelas > aumentoPasaporte
                        ? `✅ Compra ${parcelasEq} Parcelas — ganarás +$${(aumentoParcelas - aumentoPasaporte).toFixed(5)}/día más que con insignias.`
                        : `✅ Compra ${insigniasFaltantes} Insignias — ganarás +$${(aumentoPasaporte - aumentoParcelas).toFixed(5)}/día más que con parcelas.`}
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-400">Ya tienes Pasaporte Nivel 5 (Máximo). Concéntrate en saltos de Tier.</div>
                )}
              </div>

              {/* Explorer Club Optimizer */}
              <div className="bg-[#111] rounded-2xl p-6 border border-white/5">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">📆 Optimizador Explorer Club</div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <MetricBox label="Mes 1 (Día 1-30)" value={`${optData.mes1.neto_ab.toLocaleString()} AB`} color="text-gray-400" />
                  <MetricBox label="Mes 2 (Día 31-60)" value={`${optData.mes2.neto_ab.toLocaleString()} AB`} color="text-gray-400" />
                  <MetricBox label="Mes 3 (Día 61-90)" value={`${optData.mes3.neto_ab.toLocaleString()} AB`} color="text-gray-400" />
                  <MetricBox label={`🌟 Óptimo (Día ${optData.optimo.dia_inicio})`} value={`${optData.optimo.neto_ab.toLocaleString()} AB`} color="text-amber-400" />
                </div>
                <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl text-sm text-gray-300">
                  🧠 <strong>Recomendación:</strong> Compra Explorer Club el <strong className="text-amber-400">Día {optData.optimo.dia_inicio}</strong> ({optData.optimo.fecha_compra}).<br />
                  Capturarás <strong className="text-green-400">{optData.optimo.ab_pase.toLocaleString()} AB totales</strong> vs {optData.optimo.ab_gratis.toLocaleString()} AB gratis = <strong className="text-amber-400">+{optData.optimo.neto_ab.toLocaleString()} AB netos</strong> 🚀
                </div>
              </div>

              {/* ROI Analysis */}
              <div className="bg-[#111] rounded-2xl p-6 border border-white/5">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">📈 Análisis de ROI</div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-[#0e0e0e] rounded-xl p-4 border border-white/5">
                    <div className="text-xs text-gray-400 mb-1">🌍 ROI Global</div>
                    <div className="text-lg font-bold text-white">{roiGlobalDias > 0 ? motor.formato_tiempo_exacto(roiGlobalDias) : "N/A"}</div>
                    <div className="text-[10px] text-gray-500 mt-1">Tiempo en recuperar la inversión con TODAS tus ganancias.</div>
                  </div>
                  <div className="bg-[#0e0e0e] rounded-xl p-4 border border-white/5">
                    <div className="text-xs text-gray-400 mb-1">⚡ ROI Marginal</div>
                    <div className={`text-lg font-bold ${roiMarginalDias <= 365 ? "text-green-400" : roiMarginalDias <= 1095 ? "text-orange-400" : "text-red-400"}`}>
                      {roiMarginalDias > 0 ? motor.formato_tiempo_exacto(roiMarginalDias) : rentaAdicional <= 0 ? "Nunca (Pérdida)" : "N/A"}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">Tiempo en recuperar con SOLO las ganancias extra del salto.</div>
                  </div>
                </div>
                {costoTiendaUsd > 0 && (
                  <div className="mt-3 text-xs text-gray-500">
                    💰 Inversión total requerida: <strong className="text-white">${costoTiendaUsd.toFixed(2)} USD</strong> ({costoMetaAb.toLocaleString()} AB en tienda)
                  </div>
                )}
              </div>
            </>
          )}

          {/* ===== TAB: AUDITORÍA ===== */}
          {activeTab === "auditoria" && (
            <div className="bg-[#111] rounded-2xl p-6 border border-white/5 space-y-6">
              <div className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5 pb-3">
                📋 Auditoría Completa de tu Cuenta
              </div>

              <div className="space-y-5 text-sm leading-relaxed text-gray-300">
                {/* 1. Estado Actual */}
                <div>
                  <div className="font-bold text-white text-base mb-2">1. 📊 Estado Actual</div>
                  <p>
                    Tienes un portafolio de <strong className="text-cyan-400">{motor.total_parcelas} parcelas</strong> ({parcelasC}C · {parcelasR}R · {parcelasE}E · {parcelasL}L).
                    Tu Pasaporte es <strong className="text-yellow-400">Nivel {pasaporte}</strong> (+{pasaporte * 5}% en rentas).
                    Generas aproximadamente <strong className="text-green-400">{abPorDia.toFixed(1)} AB/día</strong> en modo{" "}
                    {tipoPase === "Ninguno (F2P)" ? "F2P" : "con pase activo"}.
                  </p>
                </div>

                {/* 2. Meta */}
                <div>
                  <div className="font-bold text-white text-base mb-2">2. 🎯 Camino a tu Meta Financiera</div>
                  <p>
                    Para ganar <strong className="text-orange-400">${metaUsdDia.toFixed(4)} USD/día</strong>,
                    necesitas <strong className="text-white">{parcelasMeta.toLocaleString()} parcelas</strong>.
                    {faltantesMeta > 0
                      ? <> Te faltan <strong className="text-orange-400">{faltantesMeta} parcelas</strong> (≈{costoMetaAb.toLocaleString()} AB).</>
                      : <strong className="text-green-400"> ¡Meta ya alcanzada! 🎉</strong>}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div className="bg-[#0e0e0e] rounded-lg p-3 border border-white/5">
                      <div className="text-[10px] text-gray-500">⏱️ Tiempo F2P</div>
                      <div className="text-base font-bold text-green-400">{tiempoFree}</div>
                      <div className="text-[10px] text-gray-500">{diasFree.toFixed(1)} días</div>
                    </div>
                    <div className="bg-[#0e0e0e] rounded-lg p-3 border border-amber-500/20">
                      <div className="text-[10px] text-gray-500">⏱️ Con Explorer Club</div>
                      <div className="text-base font-bold text-amber-400">{tiempoEc}</div>
                      <div className="text-[10px] text-gray-500">{diasEc2.toFixed(1)} días</div>
                    </div>
                  </div>
                </div>

                {/* 3. Tier Warning */}
                <div className={`p-4 rounded-xl border ${colapso ? "bg-red-950/40 border-red-500/20" : "bg-yellow-950/40 border-yellow-500/20"}`}>
                  <div className={`font-bold ${colapso ? "text-red-400" : "text-yellow-400"} text-base mb-2`}>
                    {colapso ? "⚠️ 3. ¡PELIGRO! Límite de Tier" : "3. 🏆 Escalera de Tiers"}
                  </div>
                  <p>
                    Estás en el Tier de <strong className="text-cyan-400">{tramo_actual} parcelas</strong>.
                    El siguiente límite es <strong className="text-yellow-400">{siguiente_tramo} parcelas</strong>.
                    Te faltan <strong className="text-white">{faltantesTier} parcelas</strong>
                    {faltanNetosAb > 0 && <> ({faltanNetosAb.toLocaleString()} AB)</>}.
                  </p>
                  <div className="mt-2 w-full bg-[#222] rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all duration-700 ${
                      colapso ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-yellow-500 to-green-500"
                    }`} style={{ width: `${porcentajeEsc}%` }} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{porcentajeEsc.toFixed(1)}% del ahorro completo</div>
                  {colapso && (
                    <div className="mt-2 text-sm text-red-400 font-bold">
                      🛑 NO COMPRES parcelas individuales. Ahorra {faltanNetosAb.toLocaleString()} AB para saltar de golpe a {siguiente_tramo} parcelas.
                    </div>
                  )}
                </div>

                {/* 4. Estrategia Detallada */}
                <div>
                  <div className="font-bold text-white text-base mb-2">4. 💡 Estrategia Detallada</div>
                  {nivelActualPasaporte < 5 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                      <div className="bg-[#0e0e0e] rounded-lg p-3 border border-white/5 text-center">
                        <div className="text-[10px] text-gray-400 mb-1">🛂 Pasaporte Nivel {nivelSiguientePasaporte}</div>
                        <div className="text-lg font-bold text-yellow-400">+${aumentoPasaporte.toFixed(5)}/día</div>
                        <div className="text-[10px] text-gray-500">Costo: {costoAbPasaporte.toLocaleString()} AB</div>
                      </div>
                      <div className="bg-[#0e0e0e] rounded-lg p-3 border border-white/5 text-center">
                        <div className="text-[10px] text-gray-400 mb-1">🏞️ {parcelasEq} Parcelas</div>
                        <div className="text-lg font-bold text-green-400">+${aumentoParcelas.toFixed(5)}/día</div>
                        <div className="text-[10px] text-gray-500">Misma inversión</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400 mb-3">✅ Pasaporte al máximo (Nivel 5). Crecimiento solo por parcelas.</div>
                  )}
                  <div className="p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg text-sm">
                    <strong className="text-blue-400">🧠 Veredicto:</strong>{" "}
                    <span dangerouslySetInnerHTML={{ __html: veredictoEstrategia }} />
                  </div>
                </div>

                {/* 5. Paso a paso */}
                <div>
                  <div className="font-bold text-white text-base mb-2">5. 🎯 Acción Táctica Inmediata</div>
                  <div className="text-sm text-gray-300">
                    {motor.total_parcelas < 40 ? (
                      <>🌱 <strong>Fase Inicial.</strong> Tu objetivo es llegar a 40 parcelas antes de comprar insignias. Sigue farmeando anuncios.</>
                    ) : colapso ? (
                      <>🛑 <strong>Zona de Riesgo.</strong> NO compres parcelas individuales. Acumula {faltanNetosAb.toLocaleString()} AB para saltar el Tier.</>
                    ) : nivelActualPasaporte < 5 && aumentoPasaporte > aumentoParcelas && insigniasFaltantes > 0 ? (
                      <>🛂 <strong>Compra {insigniasFaltantes} insignias</strong> para subir a Pasaporte Nivel {nivelSiguientePasaporte}.</>
                    ) : (
                      <>🔋 <strong>Acumulación.</strong> Sigue comprando parcelas. Faltan {faltantesTier} para el siguiente Tier.</>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== TAB: IA ===== */}
          {activeTab === "ia" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/20 rounded-2xl p-6 border border-purple-500/20">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">
                  🤖 Asistente de Estrategia
                  {isUltra && <span className="ml-2 text-purple-400 font-bold">👑 ULTRA</span>}
                </div>
                <h2 className="text-xl font-bold text-purple-300 mb-3">Análisis Personalizado de tu Cuenta</h2>
                <p className="text-sm text-gray-400 mb-4">
                  Analizaré tu perfil: {motor.total_parcelas} parcelas, Pasaporte Nivel {pasaporte},
                  {abPorDia.toFixed(0)} AB/día, meta de ${metaUsdDia.toFixed(2)} USD/día.
                </p>
                <div className="text-xs text-gray-500 mb-4">
                  Créditos disponibles: <strong className="text-purple-400">{isUltra ? "∞ Ilimitados" : aiCredits}</strong>
                </div>

                {!user ? (
                  <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-xl text-red-300 text-sm">
                    ⚠️ Debes iniciar sesión para usar el Asistente de IA.
                  </div>
                ) : (
                  <>
                    <button onClick={handleGenerateAI} disabled={aiLoading || (!isUltra && aiCredits <= 0)}
                      className="w-full py-4 rounded-xl font-bold text-white text-sm transition-all
                        bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500
                        disabled:opacity-50 disabled:cursor-not-allowed
                        shadow-lg shadow-purple-900/40 hover:shadow-purple-900/60 hover:scale-[1.01] active:scale-[0.99]">
                      {aiLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
                      <div className="mt-6 p-6 bg-[#0d0d0d] rounded-xl border border-purple-500/10 text-gray-200 text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: aiAdvice }} />
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ===== TAB: HISTORIAL ===== */}
          {activeTab === "historial" && (
            <div className="space-y-6">
              {/* Historial Chart */}
              {user && historialData.length > 0 && (
                <div className="bg-[#111] rounded-2xl p-6 border border-white/5">
                  <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">📈 Progreso en el Tiempo</div>
                  <div className="h-64">
                    <HistorialChart data={historialData} />
                  </div>
                </div>
              )}

              {/* Formulario de historial */}
              <div className="bg-[#111] rounded-2xl p-6 border border-white/5">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">
                  📝 Registrar Progreso Diario
                  {!user && <span className="ml-2 text-red-400">(Inicia sesión para guardar)</span>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">📅 Fecha</label>
                    <input type="date" value={histFecha} onChange={e => setHistFecha(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">💰 AB Generados</label>
                    <input type="number" value={histAb} onChange={e => setHistAb(Number(e.target.value))}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">💵 USD Generados</label>
                    <input type="number" value={histUsd} onChange={e => setHistUsd(Number(e.target.value))}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block mb-1">💎 Diamantes</label>
                    <input type="number" value={histDiam} onChange={e => setHistDiam(Number(e.target.value))}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none" />
                  </div>
                  <div className="flex items-end">
                    <button onClick={guardarHistorial} disabled={!user}
                      className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      💾 Guardar
                    </button>
                  </div>
                </div>
                {histMsg && <div className="text-xs text-center font-bold mt-2 text-green-400">{histMsg}</div>}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

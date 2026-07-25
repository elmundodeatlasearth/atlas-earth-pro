// src/hooks/useAtlasState.ts
// Custom hook con TODA la lógica de estado, cálculos y handlers
// Extraído del monolito page.tsx (1312 → ~SLOCs)

"use client";
import { useState, useEffect, useCallback, useMemo, startTransition } from "react";
import type { User, Session } from "@supabase/supabase-js";
import {
  MotorAtlasEarth,
  obtenerTasaCambio,
  SimuladorDiario,
  optimizadorExplorerClub,
  calcularNivelPasaporte,
  TIERS_COMPLETOS,
  PAISES_DISPONIBLES,
  MONEDAS_DISPONIBLES,
  MAP_MONEDAS,
  NIVELES_INSIGNIAS,
} from "@/utils/atlasMath";
import { supabase } from "@/utils/supabase";
import type { HistorialEntry } from "@/components/HistorialChart";

const TIERS = TIERS_COMPLETOS;

export interface AtlasState {
  // Inputs
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
  simExtra: number; setSimExtra: (v: number) => void;
  tipoPase: string; setTipoPase: (v: string) => void;
  diaAsistencia: number; setDiaAsistencia: (v: number) => void;
  horaInicio: string; setHoraInicio: (v: string) => void;
  horaFin: string; setHoraFin: (v: string) => void;
  eficienciaAnuncios: number; setEficienciaAnuncios: (v: number) => void;
  metaParcelas: number; setMetaParcelas: (v: number) => void;
  activeTab: string; setActiveTab: (v: string) => void;

  // Auth
  user: User | null;
  authEmail: string; setAuthEmail: (v: string) => void;
  authPass: string; setAuthPass: (v: string) => void;
  authLoading: boolean;
  authMsg: string;
  isPro: boolean;
  isUltra: boolean;
  aiCredits: number;
  handleAuth: (mode: "login" | "signup") => Promise<void>;
  handleLogout: () => Promise<void>;

  // AI
  aiLoading: boolean;
  aiAdvice: string;
  aiError: string;
  handleGenerateAI: () => Promise<void>;

  profileName: string; setProfileName: (v: string) => void;
  profileList: string[]; setProfileList: (v: string[]) => void;
  showSaveMsg: boolean;
  guardarPerfil: () => void;
  cargarPerfil: (nombre: string) => void;
  guardarPerfilNube: () => Promise<void>;

  // History
  historialData: HistorialEntry[];
  histFecha: string; setHistFecha: (v: string) => void;
  histAb: number; setHistAb: (v: number) => void;
  histUsd: number; setHistUsd: (v: number) => void;
  histDiam: number; setHistDiam: (v: number) => void;
  histMsg: string;
  guardarHistorial: () => Promise<void>;

  // Cálculos memorizados
  tasa: number;
  pasaporte: number;
  motor: MotorAtlasEarth;
  multTier: number;
  rentaDia: number; rentaSem: number; rentaMes: number; rentaAnio: number;
  tramo_actual: number; siguiente_tramo: number; faltantesTier: number;
  metaUsdDia: number;
  parcelasMeta: number; metaRenta: number;
  faltantesMeta: number; costoMetaAb: number; costoTiendaUsd: number;
  maxAnuncios: number; abAnunciosDia: number;
  abExtraMes: number; abPorDia: number; abEcDiarios: number;
  simTotal: number; simMult: number; simDia: number; simSem: number; simMes: number; simAnio: number;
  desgloseF2p: { total_mes: number; promedio_diario: number; ruleta_diaria: number; anuncios_diarios: number; asistencia_mes: number; minijuegos_mes: number };
  desgloseEc: { total_mes: number; promedio_diario: number; ruleta_diaria: number; anuncios_diarios: number; asistencia_mes: number; minijuegos_mes: number };
  optData: { mes1: any; mes2: any; mes3: any; optimo: any };
  diasFree: number; diasEc2: number; tiempoFree: string; tiempoEc: string;
  balanceAlcanza: number; faltanNetosAb: number; porcentajeEsc: number;
  rentaAdicional: number; roiGlobalDias: number; roiMarginalDias: number;
  nivelActualPasaporte: number; nivelSiguientePasaporte: number;
  insigniasRequeridas: number; insigniasFaltantes: number;
  costoAbPasaporte: number; aumentoPasaporte: number;
  parcelasEq: number; aumentoParcelas: number; colapso: boolean;
  veredictoEstrategia: string;
}

export function useAtlasState(): AtlasState {
  // ===== ESTADO =====
  const [parcelasC, setParcelasC] = useState(150);
  const [parcelasR, setParcelasR] = useState(0);
  const [parcelasE, setParcelasE] = useState(0);
  const [parcelasL, setParcelasL] = useState(0);
  const [insignias, setInsignias] = useState(0);
  const [abAhorrados, setAbAhorrados] = useState(500);
  const [horasBoost, setHorasBoost] = useState(18);
  const [eficiencia, setEficiencia] = useState(95);
  const [pais, setPais] = useState("Estados Unidos");
  const [moneda, setMoneda] = useState("USD");
  const [meta, setMeta] = useState(1.0);
  const [metaPeriodo, setMetaPeriodo] = useState<"day" | "month" | "year">("day");
  const [horasSrb, setHorasSrb] = useState(32);
  const [simExtra, setSimExtra] = useState(0);
  const [tipoPase, setTipoPase] = useState<string>("Ninguno (F2P)");
  const [diaAsistencia, setDiaAsistencia] = useState(1);
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFin, setHoraFin] = useState("22:00");
  const [eficienciaAnuncios, setEficienciaAnuncios] = useState(90);
  const [metaParcelas, setMetaParcelas] = useState(150);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [_session, setSession] = useState<Session | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMsg, setAuthMsg] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [isUltra, setIsUltra] = useState(false);
  const [aiCredits, setAiCredits] = useState(0);

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");
  const [aiError, setAiError] = useState("");

  // Profile state
  const [profileName, setProfileName] = useState("Principal");
  const [profileList, setProfileList] = useState<string[]>(["Principal"]);
  const [showSaveMsg, setShowSaveMsg] = useState(false);

  // History state
  const [historialData, setHistorialData] = useState<HistorialEntry[]>([]);
  const [histFecha, setHistFecha] = useState(new Date().toISOString().split("T")[0]);
  const [histAb, setHistAb] = useState(0);
  const [histUsd, setHistUsd] = useState(0);
  const [histDiam, setHistDiam] = useState(0);
  const [histMsg, setHistMsg] = useState("");

  // ===== EFFECTS =====

  // Auth init
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      startTransition(() => {
        if (s) {
          setSession(s);
          setUser(s.user);
          setAuthEmail(s.user.email || "");
          cargarPerfilNube(s.user.id);
        }
      });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      startTransition(() => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          setAuthEmail(s.user.email || "");
          cargarPerfilNube(s.user.id);
        }
      });
    });
    return () => subscription?.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Local profiles init
  useEffect(() => {
    const stored = localStorage.getItem("ae_profiles");
    if (stored) {
      try {
        const list = JSON.parse(stored);
        if (Array.isArray(list) && list.length > 0) startTransition(() => setProfileList(list));
      } catch { /* ignore */ }
    }
  }, []);

  // ===== CÁLCULOS MEMORIZADOS =====

  const tasa = useMemo(() => obtenerTasaCambio(moneda), [moneda]);

  const pasaporte = useMemo(() => calcularNivelPasaporte(insignias), [insignias]);

  const motor = useMemo(
    () => new MotorAtlasEarth(parcelasC, parcelasR, parcelasE, parcelasL, pasaporte, horasBoost, eficiencia),
    [parcelasC, parcelasR, parcelasE, parcelasL, pasaporte, horasBoost, eficiencia]
  );

  const multTier = useMemo(() => motor._get_tier_mult(motor.total_parcelas, pais, TIERS), [motor, pais]);
  const rentaDia = useMemo(() => motor.calcular_renta(multTier, horasSrb), [motor, multTier, horasSrb]);
  const rentaSem = rentaDia * 7;
  const rentaMes = rentaDia * 30;
  const rentaAnio = rentaDia * 365;

  const { tramo_actual, siguiente_tramo, faltantes: faltantesTier } = useMemo(
    () => motor.calcular_escalera(pais, TIERS), [motor, pais]
  );

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

  const [inicioMin, finMin] = useMemo(() => {
    const [ih, im] = horaInicio.split(":").map(Number);
    const [fh, fm] = horaFin.split(":").map(Number);
    const inicio = ih * 60 + im;
    let fin = fh * 60 + fm;
    if (fin < inicio) fin += 1440;
    return [inicio, fin];
  }, [horaInicio, horaFin]);
  const minutosTotales = finMin - inicioMin;
  const maxAnuncios = Math.max(0, Math.floor(minutosTotales / 20));
  const abAnunciosDia = maxAnuncios * 2 * (eficienciaAnuncios / 100);

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

  const sim = useMemo(() => new SimuladorDiario(diaAsistencia, maxAnuncios), [diaAsistencia, maxAnuncios]);
  const abEscaleraF2p = tipoPase !== "Ninguno (F2P)" ? 294 : 0;
  const abEscaleraEc = tipoPase !== "Ninguno (F2P)" ? 1324 : 0;
  const desgloseF2p = useMemo(() => sim.simular_mes_desglosado(false, abEscaleraF2p), [sim, abEscaleraF2p]);
  const desgloseEc = useMemo(() => sim.simular_mes_desglosado(true, abEscaleraEc), [sim, abEscaleraEc]);

  const optData = useMemo(() => optimizadorExplorerClub(diaAsistencia), [diaAsistencia]);

  // Tiempos
  const diasFree = abPorDia > 0 ? costoMetaAb / abPorDia : 0;
  const diasEc2 = abEcDiarios > 0 ? costoMetaAb / abEcDiarios : 0;
  const tiempoFree = motor.formato_tiempo(costoMetaAb, abPorDia);
  const tiempoEc = motor.formato_tiempo(costoMetaAb, abEcDiarios);

  const balanceAlcanza = Math.floor(abAhorrados / 100);
  const faltanNetosAb = Math.max(0, faltantesTier * 100 - abAhorrados);
  const porcentajeEsc = faltantesTier > 0 ? Math.min(100, (abAhorrados / (faltantesTier * 100)) * 100) : 100;

  // ROI
  const rentaAdicional = metaRenta - rentaDia;
  const roiGlobalDias = metaRenta > 0 && costoTiendaUsd > 0 ? costoTiendaUsd / metaRenta : 0;
  const roiMarginalDias = rentaAdicional > 0 && costoTiendaUsd > 0 ? costoTiendaUsd / rentaAdicional : 0;

  // Estrategia parcelas vs badge
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

  // ===== FUNCIONES =====

  const cargarPerfilNube = async (userId: string) => {
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
    } catch (e: unknown) {
      setAuthMsg(`❌ ${e instanceof Error ? e.message : String(e)}`);
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
      // Obtener JWT para autenticación segura
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const userId = user?.id || session?.user?.id || "anon";

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-advisor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            user_id: userId,
            pais,
            moneda,
            comunes: parcelasC,
            raras: parcelasR,
            epicas: parcelasE,
            legendarias: parcelasL,
            insignias,
            ab_ahorrados: abAhorrados,
            horas_boost: horasBoost,
            eficiencia,
            horas_srb: horasSrb,
            tipo_pase: tipoPase,
            hora_inicio: horaInicio,
            hora_fin: horaFin,
            eficiencia_anuncios: eficienciaAnuncios,
            dia_asistencia: diaAsistencia,
            meta_dolar: meta,
            meta_periodo: metaPeriodo,
            // Valores pre-computados para análisis IA consistente
            total_parcelas: motor.total_parcelas,
            mult_tier: multTier,
            pasaporte_nivel: pasaporte,
            renta_diaria: rentaDia,
            // Historial de progreso diario
            historial_progreso: historialData.slice(-30),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error del servidor");
      setAiAdvice(typeof data === "string" ? data : data.advice || JSON.stringify(data));

      // Actualizar créditos desde la respuesta
      if (data.remaining_credits !== undefined) {
        const parsed = parseInt(data.remaining_credits);
        if (!isNaN(parsed)) {
          setAiCredits(parsed);
        }
      }
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : String(e));
    } finally {
      setAiLoading(false);
    }
  }, [pais, moneda, parcelasC, parcelasR, parcelasE, parcelasL, insignias, abAhorrados,
      horasBoost, eficiencia, horasSrb, tipoPase, horaInicio, horaFin, eficienciaAnuncios,
      diaAsistencia, meta, metaPeriodo, motor, multTier, pasaporte, rentaDia, user, historialData]);

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

  useEffect(() => { startTransition(() => { cargarHistorial(); }); }, [user, cargarHistorial]);

  return {
    // Inputs
    parcelasC, setParcelasC, parcelasR, setParcelasR,
    parcelasE, setParcelasE, parcelasL, setParcelasL,
    insignias, setInsignias, abAhorrados, setAbAhorrados,
    horasBoost, setHorasBoost, eficiencia, setEficiencia,
    pais, setPais, moneda, setMoneda,
    meta, setMeta, metaPeriodo, setMetaPeriodo,
    horasSrb, setHorasSrb,
    simExtra, setSimExtra,
    tipoPase, setTipoPase,
    diaAsistencia, setDiaAsistencia,
    horaInicio, setHoraInicio, horaFin, setHoraFin,
    eficienciaAnuncios, setEficienciaAnuncios,
    metaParcelas, setMetaParcelas,
    activeTab, setActiveTab,

    // Auth
    user, authEmail, setAuthEmail, authPass, setAuthPass,
    authLoading, authMsg, isPro, isUltra, aiCredits,
    handleAuth, handleLogout,

    // AI
    aiLoading, aiAdvice, aiError, handleGenerateAI,

    // Profiles
    profileName, setProfileName, profileList, setProfileList, showSaveMsg,
    guardarPerfil, cargarPerfil, guardarPerfilNube,

    // History
    historialData, histFecha, setHistFecha, histAb, setHistAb,
    histUsd, setHistUsd, histDiam, setHistDiam, histMsg,
    guardarHistorial,

    // Cálculos
    tasa, pasaporte, motor, multTier,
    rentaDia, rentaSem, rentaMes, rentaAnio,
    tramo_actual, siguiente_tramo, faltantesTier,
    metaUsdDia, parcelasMeta, metaRenta,
    faltantesMeta, costoMetaAb, costoTiendaUsd,
    maxAnuncios, abAnunciosDia,
    abExtraMes, abPorDia, abEcDiarios,
    simTotal, simMult, simDia, simSem, simMes, simAnio,
    desgloseF2p, desgloseEc, optData,
    diasFree, diasEc2, tiempoFree, tiempoEc,
    balanceAlcanza, faltanNetosAb, porcentajeEsc,
    rentaAdicional, roiGlobalDias, roiMarginalDias,
    nivelActualPasaporte, nivelSiguientePasaporte,
    insigniasRequeridas, insigniasFaltantes,
    costoAbPasaporte, aumentoPasaporte,
    parcelasEq, aumentoParcelas, colapso,
    veredictoEstrategia,
  };
}

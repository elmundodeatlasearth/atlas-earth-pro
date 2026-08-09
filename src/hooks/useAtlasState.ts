// src/hooks/useAtlasState.ts
// Orchestrator — combina hooks atómicos en una sola API
"use client";
import { useState, useEffect, useCallback, useRef, startTransition } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";
import type { HistorialEntry } from "@/components/HistorialChart";
import type { AtlasCalculations } from "./useAtlasCalculations";
import { useAtlasInputs, type AtlasInputs } from "./useAtlasInputs";
import { useAtlasAuth, type AtlasAuth } from "./useAtlasAuth";
import { useAtlasCalculations } from "./useAtlasCalculations";
import { usePermissions, type Permissions } from "./usePermissions";

export interface AtlasState extends AtlasInputs, AtlasCalculations {
  // Auth (overrides para compatibilidad)
  user: User | null;
  authEmail: string; setAuthEmail: (v: string) => void;
  authPass: string; setAuthPass: (v: string) => void;
  authLoading: boolean;
  authMsg: string;
  isPro: boolean;
  isUltra: boolean;
  aiCredits: number;

  // Permissions
  permissions: Permissions;

  handleAuth: (mode: "login" | "signup") => Promise<void>;
  handleLogout: () => Promise<void>;

  // AI
  aiLoading: boolean;
  aiAdvice: string;
  aiError: string;
  handleGenerateAI: () => Promise<void>;

  // Profiles
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
}

export function useAtlasState(): AtlasState {
  const I = useAtlasInputs();
  const A = useAtlasAuth();
  const C = useAtlasCalculations(I);
  const P = usePermissions(A.isPro, A.isUltra);

  // ===== AI State =====
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");
  const [aiError, setAiError] = useState("");

  // ===== Profile State =====
  const [profileName, setProfileName] = useState("Principal");
  const [profileList, setProfileList] = useState<string[]>(["Principal"]);
  const [showSaveMsg, setShowSaveMsg] = useState(false);

  // ===== History State =====
  const [historialData, setHistorialData] = useState<HistorialEntry[]>([]);
  const [histFecha, setHistFecha] = useState(new Date().toISOString().split("T")[0]);
  const [histAb, setHistAb] = useState(0);
  const [histUsd, setHistUsd] = useState(0);
  const [histDiam, setHistDiam] = useState(0);
  const [histMsg, setHistMsg] = useState("");

  // Ref para cargar el perfil de la nube UNA sola vez por sesión iniciada.
  // Evita que onAuthStateChange (INITIAL_SESSION, TOKEN_REFRESHED, USER_UPDATED…)
  // sobreescriba los inputs del usuario con datos viejos de la nube → el "bucle".
  const cloudLoadedUserId = useRef<string | null>(null);
  // Evita que el autosave corra en el PRIMER render (montaje) y sobreescriba
  // los datos restaurados con los defaults (150, 0, 500, 18...).
  const isFirstRender = useRef(true);

  // Local profiles init + restore último estado guardado del perfil activo
  useEffect(() => {
    let list: string[] = ["Principal"];
    const stored = localStorage.getItem("ae_profiles");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      } catch { /* ignore */ }
    }
    startTransition(() => setProfileList(list));

    // Restaurar el perfil ACTIVO (el último usado), no siempre el primero
    const activeName = localStorage.getItem("ae_active_profile");
    const nombreActivo = activeName && list.includes(activeName) ? activeName : list[0];
    startTransition(() => setProfileName(nombreActivo));

    // Restaurar el estado guardado localmente para que los datos NO se pierdan
    const saved = localStorage.getItem(`ae_profile_${nombreActivo}`);
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (typeof p === "object" && p !== null && Object.keys(p).length >= 5) {
          startTransition(() => {
            I.setPais(p.pais || "Estados Unidos");
            I.setMoneda(p.moneda || "USD");
            I.setHorasBoost(p.horas_boost ?? 18);
            I.setEficiencia(p.eficiencia ?? 95);
            I.setHorasSrb(64);
            I.setParcelasC(p.c_comun ?? 150);
            I.setParcelasR(p.c_rara ?? 0);
            I.setParcelasE(p.c_epica ?? 0);
            I.setParcelasL(p.c_legendaria ?? 0);
            I.setInsignias(p.insignias ?? 0);
            I.setAbAhorrados(p.ab_manuales ?? 500);
            I.setEficienciaAnuncios(p.eficiencia_anuncios ?? 90);
            I.setTipoPase(p.tipo_pase ?? "Ninguno (F2P)");
            I.setMeta(p.meta_dolar ?? 1);
            I.setMetaPeriodo(p.meta_periodo ?? "day");
            I.setMetaParcelas(p.meta_parcelas ?? 150);
            I.setDiaAsistencia(p.dia_asistencia ?? 1);
            I.setHoraInicio(p.hora_inicio ?? "08:00");
            I.setHoraFin(p.hora_fin ?? "22:00");
          });
        }
      } catch { /* ignore */ }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cloud profile data load (extends auth loadCloudProfile)
  useEffect(() => {
    if (A.user) {
      // La nube NUNCA pisa los datos locales del usuario.
      // Si hay un perfil guardado localmente, ese es el que manda (el usuario editó aquí).
      // La nube solo se aplica si NO hay datos locales (primera vez / dispositivo nuevo).
      // Si este navegador ya guardó perfiles locales, los datos LOCALES mandan.
      // La nube solo se aplica en un dispositivo nuevo sin datos previos.
      const hasLocalData = localStorage.getItem("ae_profiles");
      if (hasLocalData) return;

      // Cargar la nube SOLO la primera vez que se inicia sesión con este userId.
      if (cloudLoadedUserId.current === A.user.id) return;
      cloudLoadedUserId.current = A.user.id;

      supabase.from("usuarios_atlas").select("perfil_data").eq("user_id", A.user.id).single().then(({ data }) => {
        if (data?.perfil_data && typeof data.perfil_data === "object" && Object.keys(data.perfil_data).length >= 5) {
          try {
            let p: Record<string, unknown> = data.perfil_data as Record<string, unknown>;
            // Si viene string (migración), parsearlo
            if (typeof data.perfil_data === "string") {
              try { p = JSON.parse(data.perfil_data); } catch { return; }
            }
            // Solo sobreescribir si el perfil de la nube tiene datos reales
            if (p && typeof p === "object" && Object.keys(p).length >= 5) {
              startTransition(() => {
                I.setPais((p.pais as string) || "Estados Unidos");
                I.setMoneda((p.moneda as string) || "USD");
                I.setHorasBoost((p.horas_boost as number) ?? 18);
                I.setEficiencia((p.eficiencia as number) ?? 95);
                I.setHorasSrb(64);
                I.setParcelasC((p.c_comun as number) ?? 150);
                I.setParcelasR((p.c_rara as number) ?? 0);
                I.setParcelasE((p.c_epica as number) ?? 0);
                I.setParcelasL((p.c_legendaria as number) ?? 0);
                I.setInsignias((p.insignias as number) ?? 0);
                I.setAbAhorrados((p.ab_manuales as number) ?? 500);
                I.setEficienciaAnuncios((p.eficiencia_anuncios as number) ?? 90);
                I.setTipoPase((p.tipo_pase as string) ?? "Ninguno (F2P)");
                I.setMeta((p.meta_dolar as number) ?? 1);
                I.setMetaPeriodo((p.meta_periodo as "day" | "month" | "year") ?? "day");
                I.setMetaParcelas((p.meta_parcelas as number) ?? 150);
                I.setDiaAsistencia((p.dia_asistencia as number) ?? 1);
                I.setHoraInicio((p.hora_inicio as string) || "08:00");
                I.setHoraFin((p.hora_fin as string) || "22:00");
              });
            }
          } catch { /* ignore */ }
        }
      });
    }
  }, [A.user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== Handlers =====

  const guardarPerfil = useCallback(() => {
    const perfil = {
      pais: I.pais, moneda: I.moneda, horas_boost: I.horasBoost, eficiencia: I.eficiencia, horas_srb_mes: 64,
      c_comun: I.parcelasC, c_rara: I.parcelasR, c_epica: I.parcelasE, c_legendaria: I.parcelasL,
      insignias: I.insignias, ab_manuales: I.abAhorrados, eficiencia_anuncios: I.eficienciaAnuncios,
      tipo_pase: I.tipoPase, meta_dolar: I.meta, meta_periodo: I.metaPeriodo,
      meta_parcelas: I.metaParcelas, dia_asistencia: I.diaAsistencia,
      hora_inicio: I.horaInicio, hora_fin: I.horaFin,
    };
    localStorage.setItem(`ae_profile_${profileName}`, JSON.stringify(perfil));
    const updated = [...new Set([...profileList, profileName])];
    setProfileList(updated);
    localStorage.setItem("ae_profiles", JSON.stringify(updated));
    setShowSaveMsg(true);
    setTimeout(() => setShowSaveMsg(false), 2000);
  }, [I.pais, I.moneda, I.horasBoost, I.eficiencia, I.horasSrb, I.parcelasC, I.parcelasR, I.parcelasE, I.parcelasL,
      I.insignias, I.abAhorrados, I.eficienciaAnuncios, I.tipoPase, I.meta, I.metaPeriodo, I.metaParcelas,
      I.diaAsistencia, I.horaInicio, I.horaFin, profileName, profileList]);

  const cargarPerfil = useCallback((nombre: string) => {
    const data = localStorage.getItem(`ae_profile_${nombre}`);
    if (data) {
      try {
        const p = JSON.parse(data);
        // Lectura retrocompatible: snake_case (nuevo formato) + camelCase (datos antiguos)
        const get = (snake: string, camel: string, fallback: number | string) => {
          const v = p[snake] ?? p[camel] ?? fallback;
          return v;
        };
        I.setPais(p.pais || "Estados Unidos");
        I.setMoneda(p.moneda || "USD");
        I.setHorasBoost(Number(get("horas_boost", "horasBoost", 18)));
        I.setEficiencia(Number(get("eficiencia", "eficiencia", 95)));
        I.setHorasSrb(64);
        I.setParcelasC(Number(get("c_comun", "c_comun", 150)));
        I.setParcelasR(Number(get("c_rara", "c_rara", 0)));
        I.setParcelasE(Number(get("c_epica", "c_epica", 0)));
        I.setParcelasL(Number(get("c_legendaria", "c_legendaria", 0)));
        I.setInsignias(Number(get("insignias", "insignias", 0)));
        I.setAbAhorrados(Number(get("ab_manuales", "ab_manuales", 500)));
        I.setEficienciaAnuncios(Number(get("eficiencia_anuncios", "eficienciaAnuncios", 90)));
        I.setTipoPase(String(get("tipo_pase", "tipoPase", "Ninguno (F2P)")));
        I.setMeta(Number(get("meta_dolar", "meta_dolar", 1)));
        I.setMetaPeriodo(String(get("meta_periodo", "metaPeriodo", "day")) as "day" | "month" | "year");
        I.setMetaParcelas(Number(get("meta_parcelas", "metaParcelas", 150)));
        I.setDiaAsistencia(Number(get("dia_asistencia", "diaAsistencia", 1)));
        if (p.hora_inicio) I.setHoraInicio(String(p.hora_inicio));
        if (p.hora_fin) I.setHoraFin(String(p.hora_fin));
      } catch { /* ignore */ }
    }
    setProfileName(nombre);
    localStorage.setItem("ae_active_profile", nombre);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const guardarPerfilNube = useCallback(async () => {
    if (!A.user) return;
    const perfil = {
      pais: I.pais, moneda: I.moneda, horas_boost: I.horasBoost, eficiencia: I.eficiencia, horas_srb_mes: 64,
      c_comun: I.parcelasC, c_rara: I.parcelasR, c_epica: I.parcelasE, c_legendaria: I.parcelasL,
      insignias: I.insignias, ab_manuales: I.abAhorrados, eficiencia_anuncios: I.eficienciaAnuncios,
      tipo_pase: I.tipoPase, meta_dolar: I.meta, meta_periodo: I.metaPeriodo,
      meta_parcelas: I.metaParcelas, dia_asistencia: I.diaAsistencia,
      hora_inicio: I.horaInicio, hora_fin: I.horaFin,
    };
    // NO tocar is_vip / is_ultra / ai_credits: esos campos los controla el webhook de Stripe
    // (service_role). Si usamos la anon key solo podemos actualizar la fila propia.
    const { error } = await supabase.from("usuarios_atlas").upsert({
      user_id: A.user.id,
      perfil_data: perfil, // JSONB nativo — sin JSON.stringify
    }, { onConflict: "user_id" });
    if (!error) {
      // Persistir también localmente para que la carga local tenga estos datos
      localStorage.setItem(`ae_profile_${profileName}`, JSON.stringify(perfil));
      const updated = [...new Set([...profileList, profileName])];
      localStorage.setItem("ae_profiles", JSON.stringify(updated));
      localStorage.setItem("ae_active_profile", profileName);
      setShowSaveMsg(true);
      setTimeout(() => setShowSaveMsg(false), 2000);
    } else {
      console.error("guardarPerfilNube error:", error);
    }
  }, [A.user, profileName, profileList,
      I.pais, I.moneda, I.horasBoost, I.eficiencia, I.horasSrb,
      I.parcelasC, I.parcelasR, I.parcelasE, I.parcelasL, I.insignias, I.abAhorrados, I.eficienciaAnuncios,
      I.tipoPase, I.meta, I.metaPeriodo, I.metaParcelas, I.diaAsistencia, I.horaInicio, I.horaFin]);

  // Auto-guardado local con debounce (1500ms) — evita perder datos al recargar
  useEffect(() => {
    // No correr en el primer render (montaje): la restauración local
    // todavía está cargando los datos guardados y no queremos pisarlos con defaults.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      const perfil = {
        pais: I.pais, moneda: I.moneda, horas_boost: I.horasBoost, eficiencia: I.eficiencia, horas_srb_mes: 64,
        c_comun: I.parcelasC, c_rara: I.parcelasR, c_epica: I.parcelasE, c_legendaria: I.parcelasL,
        insignias: I.insignias, ab_manuales: I.abAhorrados, eficiencia_anuncios: I.eficienciaAnuncios,
        tipo_pase: I.tipoPase, meta_dolar: I.meta, meta_periodo: I.metaPeriodo,
        meta_parcelas: I.metaParcelas, dia_asistencia: I.diaAsistencia,
        hora_inicio: I.horaInicio, hora_fin: I.horaFin,
      };
      localStorage.setItem(`ae_profile_${profileName}`, JSON.stringify(perfil));
      const updated = [...new Set([...profileList, profileName])];
      localStorage.setItem("ae_profiles", JSON.stringify(updated));
    }, 250);
    return () => clearTimeout(t);
  }, [I.pais, I.moneda, I.horasBoost, I.eficiencia, I.horasSrb, I.parcelasC, I.parcelasR,
      I.parcelasE, I.parcelasL, I.insignias, I.abAhorrados, I.eficienciaAnuncios, I.tipoPase,
      I.meta, I.metaPeriodo, I.metaParcelas, I.diaAsistencia, I.horaInicio, I.horaFin,
      profileName, profileList]);

  // Flush sincrónico al cerrar/recargar: garantiza que la última edición se guarde
  const latestRef = useRef<{ perfil: Record<string, unknown>; nombre: string }>({ perfil: {}, nombre: profileName });
  latestRef.current = {
    perfil: {
      pais: I.pais, moneda: I.moneda, horas_boost: I.horasBoost, eficiencia: I.eficiencia, horas_srb_mes: 64,
      c_comun: I.parcelasC, c_rara: I.parcelasR, c_epica: I.parcelasE, c_legendaria: I.parcelasL,
      insignias: I.insignias, ab_manuales: I.abAhorrados, eficiencia_anuncios: I.eficienciaAnuncios,
      tipo_pase: I.tipoPase, meta_dolar: I.meta, meta_periodo: I.metaPeriodo,
      meta_parcelas: I.metaParcelas, dia_asistencia: I.diaAsistencia,
      hora_inicio: I.horaInicio, hora_fin: I.horaFin,
    },
    nombre: profileName,
  };
  useEffect(() => {
    const flush = () => {
      const p = latestRef.current;
      if (p.nombre) {
        localStorage.setItem(`ae_profile_${p.nombre}`, JSON.stringify(p.perfil));
      }
    };
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
    return () => {
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  const handleGenerateAI = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setAiLoading(false);
      setAiError("Debes iniciar sesión para usar la IA. Crea una cuenta gratuita en el panel izquierdo.");
      return;
    }
    setAiLoading(true);
    setAiError("");
    setAiAdvice("");
    try {
      const token = session.access_token;
      const userId = session.user.id;

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
            pais: I.pais, moneda: I.moneda,
            comunes: I.parcelasC, raras: I.parcelasR, epicas: I.parcelasE, legendarias: I.parcelasL,
            insignias: I.insignias, ab_ahorrados: I.abAhorrados,
            horas_boost: I.horasBoost, eficiencia: I.eficiencia, horas_srb: I.horasSrb,
            tipo_pase: I.tipoPase, hora_inicio: I.horaInicio, hora_fin: I.horaFin,
            eficiencia_anuncios: I.eficienciaAnuncios, dia_asistencia: I.diaAsistencia,
            meta_dolar: I.meta, meta_periodo: I.metaPeriodo,
            total_parcelas: C.motor.total_parcelas,
            mult_tier: C.multTier, pasaporte_nivel: C.pasaporte, renta_diaria: C.rentaDia,
            // ≡≡≡ DATOS COMPUTADOS ADICIONALES para análisis experto ≡≡≡
            renta_semanal: C.rentaSem,
            renta_mensual: C.rentaMes,
            renta_anual: C.rentaAnio,
            siguiente_tramo: C.siguiente_tramo,
            faltantes_tier: C.faltantesTier,
            colapso_tier: C.colapso,
            porcentaje_escalera: C.porcentajeEsc,
            faltantes_meta: C.faltantesMeta,
            parcelas_meta: C.parcelasMeta,
            desglose_f2p_ab_mes: C.desgloseF2p.total_mes,
            desglose_f2p_ab_dia: C.desgloseF2p.promedio_diario,
            desglose_f2p_ab20min_dia: C.desgloseF2p.ab20min_diario,
            desglose_f2p_ab20min_mes: C.desgloseF2p.ab20min_mes,
            desglose_f2p_pase_mes: C.desgloseF2p.pase_mes,
            desglose_ec_ab_mes: C.desgloseEc.total_mes,
            desglose_ec_ab_dia: C.desgloseEc.promedio_diario,
            desglose_ec_ab20min_dia: C.desgloseEc.ab20min_diario,
            desglose_ec_ab20min_mes: C.desgloseEc.ab20min_mes,
            desglose_ec_pase_mes: C.desgloseEc.pase_mes,
            ec_optimo_dia_inicio: C.optData.optimo.dia_inicio,
            ec_optimo_ab_netos: C.optData.optimo.neto_ab,
            ec_optimo_ab_pase: C.optData.optimo.ab_pase,
            ec_optimo_ab_gratis: C.optData.optimo.ab_gratis,
            roi_global_dias: C.roiGlobalDias,
            roi_marginal_dias: C.roiMarginalDias,
            renta_adicional: C.rentaAdicional,
            costo_meta_ab: C.costoMetaAb,
            parcelas_eq: C.parcelasEq,
            aumento_parcelas: C.aumentoParcelas,
            aumento_pasaporte: C.aumentoPasaporte,
            veredicto_estrategia: C.veredictoEstrategia,
            nivel_pasaporte_actual: C.nivelActualPasaporte,
            nivel_pasaporte_siguiente: C.nivelSiguientePasaporte,
            insignias_faltantes: C.insigniasFaltantes,
            costo_ab_pasaporte: C.costoAbPasaporte,
            historial_progreso: historialData.slice(-30),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error del servidor");
      setAiAdvice(typeof data === "string" ? data : data.advice || JSON.stringify(data));

      if (data.remaining_credits !== undefined) {
        const parsed = parseInt(data.remaining_credits);
        if (!isNaN(parsed)) A.setAiCredits(parsed);
      }
    } catch (e: unknown) {
      setAiError(e instanceof Error ? e.message : String(e));
    } finally {
      setAiLoading(false);
    }
  }, [I.pais, I.moneda, I.parcelasC, I.parcelasR, I.parcelasE, I.parcelasL,
      I.insignias, I.abAhorrados, I.horasBoost, I.eficiencia, I.horasSrb,
      I.tipoPase, I.horaInicio, I.horaFin, I.eficienciaAnuncios, I.diaAsistencia,
      I.meta, I.metaPeriodo, C.motor, C.multTier, C.pasaporte, C.rentaDia, A.user, historialData, A.setAiCredits]);

  const guardarHistorial = async () => {
    if (!A.user) { setHistMsg("Debes iniciar sesión"); return; }
    const { error } = await supabase.from("historial_atlas").upsert({
      user_id: A.user.id,
      fecha: histFecha,
      ab_generado: histAb,
      usd_generado: histUsd,
      diamantes_obtenidos: histDiam,
    }, { onConflict: "user_id,fecha" });
    if (error) {
      console.error("guardarHistorial error:", error);
      setHistMsg(`❌ Error al guardar: ${error.message}`);
    } else setHistMsg("✅ Progreso guardado");
    setTimeout(() => setHistMsg(""), 4000);
  };

  const cargarHistorial = useCallback(async () => {
    if (!A.user) return;
    const { data } = await supabase
      .from("historial_atlas")
      .select("*")
      .eq("user_id", A.user.id)
      .order("fecha", { ascending: true });
    if (data) setHistorialData(data);
  }, [A.user]);

  useEffect(() => { startTransition(() => { cargarHistorial(); }); }, [A.user, cargarHistorial]);

  return {
    // Inputs
    ...I,
    // Auth
    user: A.user, authEmail: A.authEmail, setAuthEmail: A.setAuthEmail,
    authPass: A.authPass, setAuthPass: A.setAuthPass,
    authLoading: A.authLoading, authMsg: A.authMsg,
    isPro: A.isPro, isUltra: A.isUltra, aiCredits: A.aiCredits,
    // Permissions
    permissions: P,
    handleAuth: A.handleAuth, handleLogout: A.handleLogout,
    // AI
    aiLoading, aiAdvice, aiError, handleGenerateAI,
    // Profiles
    profileName, setProfileName, profileList, setProfileList, showSaveMsg,
    guardarPerfil, cargarPerfil, guardarPerfilNube,
    // History
    historialData, histFecha, setHistFecha, histAb, setHistAb,
    histUsd, setHistUsd, histDiam, setHistDiam, histMsg, guardarHistorial,
    // Calculations
    ...C,
  };
}

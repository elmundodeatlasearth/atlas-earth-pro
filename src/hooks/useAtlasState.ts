// src/hooks/useAtlasState.ts
// Orchestrator — combina hooks atómicos en una sola API
"use client";
import { useState, useEffect, useCallback, startTransition } from "react";
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

  // Cloud profile data load (extends auth loadCloudProfile)
  useEffect(() => {
    if (A.user) {
      supabase.from("usuarios_atlas").select("perfil_data").eq("user_id", A.user.id).single().then(({ data }) => {
        if (data?.perfil_data) {
          try {
            const p = JSON.parse(data.perfil_data);
            startTransition(() => {
              I.setPais(p.pais || "Estados Unidos");
              I.setMoneda(p.moneda || "USD");
              I.setHorasBoost(p.horas_boost ?? 18);
              I.setEficiencia(p.eficiencia ?? 95);
              I.setHorasSrb(p.horas_srb_mes ?? 32);
              I.setParcelasC(p.c_comun ?? 150);
              I.setParcelasR(p.c_rara ?? 0);
              I.setParcelasE(p.c_epica ?? 0);
              I.setParcelasL(p.c_legendaria ?? 0);
              I.setInsignias(p.insignias ?? 0);
              I.setAbAhorrados(p.ab_manuales ?? 500);
              I.setTipoPase(p.tipo_pase ?? "Ninguno (F2P)");
              I.setMeta(p.meta_dolar ?? 1);
            });
          } catch { /* ignore */ }
        }
      });
    }
  }, [A.user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== Handlers =====

  const guardarPerfil = useCallback(() => {
    const perfil = {
      pais: I.pais, moneda: I.moneda, horasBoost: I.horasBoost, eficiencia: I.eficiencia, horasSrb: I.horasSrb,
      c_comun: I.parcelasC, c_rara: I.parcelasR, c_epica: I.parcelasE, c_legendaria: I.parcelasL,
      insignias: I.insignias, ab_manuales: I.abAhorrados, eficiencia_anuncios: I.eficienciaAnuncios,
      tipo_pase: I.tipoPase, meta_dolar: I.meta, meta_periodo: I.metaPeriodo,
      meta_parcelas: I.metaParcelas, dia_asistencia: I.diaAsistencia,
    };
    localStorage.setItem(`ae_profile_${profileName}`, JSON.stringify(perfil));
    const updated = [...new Set([...profileList, profileName])];
    setProfileList(updated);
    localStorage.setItem("ae_profiles", JSON.stringify(updated));
    setShowSaveMsg(true);
    setTimeout(() => setShowSaveMsg(false), 2000);
  }, [I.pais, I.moneda, I.horasBoost, I.eficiencia, I.horasSrb, I.parcelasC, I.parcelasR, I.parcelasE, I.parcelasL,
      I.insignias, I.abAhorrados, I.eficienciaAnuncios, I.tipoPase, I.meta, I.metaPeriodo, I.metaParcelas,
      I.diaAsistencia, profileName, profileList]);

  const cargarPerfil = useCallback((nombre: string) => {
    const data = localStorage.getItem(`ae_profile_${nombre}`);
    if (data) {
      try {
        const p = JSON.parse(data);
        I.setPais(p.pais || "Estados Unidos");
        I.setMoneda(p.moneda || "USD");
        I.setHorasBoost(p.horas_boost ?? 18);
        I.setEficiencia(p.eficiencia ?? 95);
        I.setHorasSrb(p.horas_srb_mes ?? 32);
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
      } catch { /* ignore */ }
    }
    setProfileName(nombre);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const guardarPerfilNube = useCallback(async () => {
    if (!A.user) return;
    const perfil = {
      pais: I.pais, moneda: I.moneda, horas_boost: I.horasBoost, eficiencia: I.eficiencia, horas_srb_mes: I.horasSrb,
      c_comun: I.parcelasC, c_rara: I.parcelasR, c_epica: I.parcelasE, c_legendaria: I.parcelasL,
      insignias: I.insignias, ab_manuales: I.abAhorrados, eficiencia_anuncios: I.eficienciaAnuncios,
      tipo_pase: I.tipoPase, meta_dolar: I.meta, meta_periodo: I.metaPeriodo,
      meta_parcelas: I.metaParcelas, dia_asistencia: I.diaAsistencia,
    };
    const { error } = await supabase.from("usuarios_atlas").upsert({
      user_id: A.user.id,
      perfil_data: JSON.stringify(perfil),
      is_vip: A.isPro,
      is_ultra: A.isUltra,
      ai_credits: A.aiCredits,
    }, { onConflict: "user_id" });
    if (!error) setShowSaveMsg(true);
    setTimeout(() => setShowSaveMsg(false), 2000);
  }, [A.user, A.isPro, A.isUltra, A.aiCredits,
      I.pais, I.moneda, I.horasBoost, I.eficiencia, I.horasSrb,
      I.parcelasC, I.parcelasR, I.parcelasE, I.parcelasL, I.insignias, I.abAhorrados, I.eficienciaAnuncios,
      I.tipoPase, I.meta, I.metaPeriodo, I.metaParcelas, I.diaAsistencia]);

  const handleGenerateAI = useCallback(async () => {
    setAiLoading(true);
    setAiError("");
    setAiAdvice("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const userId = A.user?.id || session?.user?.id || "anon";

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
    if (error) setHistMsg("Error al guardar");
    else setHistMsg("✅ Progreso guardado");
    setTimeout(() => setHistMsg(""), 3000);
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

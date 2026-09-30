// src/hooks/useAtlasAuth.ts
// Hook de autenticación Supabase + planes
"use client";
import { useState, useEffect, startTransition } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";

export const OWNER_EMAILS = ["elmundodeatlasearth@gmail.com"];

export interface AtlasAuth {
  user: User | null;
  authEmail: string; setAuthEmail: (v: string) => void;
  authPass: string; setAuthPass: (v: string) => void;
  authLoading: boolean;
  authMsg: string;
  isPro: boolean;
  isUltra: boolean;
  isAdmin: boolean;
  aiCredits: number; setAiCredits: (v: number) => void;
  handleAuth: (mode: "login" | "signup") => Promise<void>;
  handleLogout: () => Promise<void>;
  loadCloudProfile: (userId: string) => Promise<void>;
  activarAdminLocal: () => void;
}

export function useAtlasAuth(): AtlasAuth {
  const [user, setUser] = useState<User | null>(null);
  const [, setSession] = useState<Session | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMsg, setAuthMsg] = useState("");
  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("atlas_admin_local") === "true";
    }
    return false;
  });
  const [isPro, setIsPro] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("atlas_admin_local") === "true";
    }
    return false;
  });
  const [isUltra, setIsUltra] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("atlas_admin_local") === "true";
    }
    return false;
  });
  const [aiCredits, setAiCredits] = useState(() => {
    if (typeof window !== "undefined" && localStorage.getItem("atlas_admin_local") === "true") {
      return 999;
    }
    return 0;
  });

  const evaluarAdmin = (u: User | null): boolean => {
    if (!u) return false;
    const email = (u.email || "").toLowerCase().trim();
    const role = u.user_metadata?.role || u.app_metadata?.role || "";
    return OWNER_EMAILS.includes(email) || role === "admin";
  };

  const loadCloudProfile = async (userId: string, currentUser?: User | null) => {
    const esAdmin = evaluarAdmin(currentUser ?? user);
    try {
      const { data, error } = await supabase
        .from("usuarios_atlas")
        .select("is_vip, is_ultra, ai_credits")
        .eq("user_id", userId)
        .single();
      if (data && !error) {
        startTransition(() => {
          setIsPro(esAdmin || Boolean(data.is_vip));
          setIsUltra(esAdmin || Boolean(data.is_ultra));
          setIsAdmin(esAdmin);
          setAiCredits(esAdmin ? 999 : (data.ai_credits || 0));
        });
      } else if (esAdmin) {
        startTransition(() => {
          setIsPro(true);
          setIsUltra(true);
          setIsAdmin(true);
          setAiCredits(999);
        });
      }
    } catch {
      if (esAdmin) {
        startTransition(() => {
          setIsPro(true);
          setIsUltra(true);
          setIsAdmin(true);
          setAiCredits(999);
        });
      }
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      startTransition(() => {
        if (s) {
          const esAdmin = evaluarAdmin(s.user);
          setSession(s);
          setUser(s.user);
          setAuthEmail(s.user.email || "");
          if (esAdmin) {
            setIsAdmin(true);
            setIsPro(true);
            setIsUltra(true);
            setAiCredits(999);
          }
          loadCloudProfile(s.user.id, s.user);
        }
      });
    }).catch(() => {
      // Ignorar error si Supabase está en pausa
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      startTransition(() => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          const esAdmin = evaluarAdmin(s.user);
          setAuthEmail(s.user.email || "");
          if (esAdmin) {
            setIsAdmin(true);
            setIsPro(true);
            setIsUltra(true);
            setAiCredits(999);
          }
          loadCloudProfile(s.user.id, s.user);
        }
      });
    });
    return () => subscription?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- suscripción única al ciclo de vida de Supabase Auth
  }, []);

  const handleAuth = async (mode: "login" | "signup") => {
    setAuthLoading(true);
    setAuthMsg("");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPass });
        if (error) {
          if (process.env.NEXT_PUBLIC_SUPABASE_URL === undefined || process.env.NEXT_PUBLIC_SUPABASE_URL === "") {
             setAuthMsg("❌ Error Crítico: Faltan las variables de entorno de Supabase en tu hosting (Vercel/Netlify).");
          } else {
             setAuthMsg(`❌ ${error.message}`);
          }
        }
        else setAuthMsg("✅ Cuenta creada. Revisa tu correo para verificar.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPass });
        if (error) {
          // Si falló y estamos en un build sin variables de entorno reales
          if (process.env.NEXT_PUBLIC_SUPABASE_URL === undefined || process.env.NEXT_PUBLIC_SUPABASE_URL === "") {
             setAuthMsg("❌ Error Crítico: Faltan las variables de entorno de Supabase en tu hosting (Vercel/Netlify).");
          }
          // Si es el correo del dueño y falló por timeout/DNS de Supabase, dar sugerencia clara
          else if (OWNER_EMAILS.includes(authEmail.toLowerCase().trim())) {
            setAuthMsg(`❌ Error de conexión: ${error.message}. (Verifica que tu proyecto de Supabase no esté en pausa en supabase.com/dashboard)`);
          } else if (error.message.toLowerCase().includes("invalid login credentials")) {
            setAuthMsg(`❌ Credenciales inválidas o correo NO confirmado. Si acabas de registrarte, revisa tu email y valida la cuenta.`);
          } else {
            setAuthMsg(`❌ ${error.message}`);
          }
        } else {
          setAuthMsg("✅ Sesión iniciada.");
          const esAdmin = evaluarAdmin(data?.user);
          if (esAdmin) {
            setIsAdmin(true);
            setIsPro(true);
            setIsUltra(true);
            setAiCredits(999);
          }
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setAuthMsg(`❌ Error de conexión con Supabase: ${msg}. (Si el proyecto fue pausado por inactividad, reactívalo en supabase.com/dashboard)`);
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    if (typeof window !== "undefined") {
      localStorage.removeItem("atlas_admin_local");
    }
    setUser(null);
    setSession(null);
    setIsPro(false);
    setIsUltra(false);
    setIsAdmin(false);
    setAiCredits(0);
  };

  const activarAdminLocal = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("atlas_admin_local", "true");
    }
    setIsAdmin(true);
    setIsPro(true);
    setIsUltra(true);
    setAiCredits(999);
    setAuthMsg("🛡️ Modo Administrador Local Activado.");
  };

  return {
    user, authEmail, setAuthEmail, authPass, setAuthPass,
    authLoading, authMsg, isPro, isUltra, isAdmin, aiCredits, setAiCredits,
    handleAuth, handleLogout, loadCloudProfile, activarAdminLocal,
  };
}

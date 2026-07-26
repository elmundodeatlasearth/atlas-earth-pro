// src/hooks/useAtlasAuth.ts
// Hook de autenticación Supabase + planes
"use client";
import { useState, useEffect, useCallback, startTransition } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";

export interface AtlasAuth {
  user: User | null;
  authEmail: string; setAuthEmail: (v: string) => void;
  authPass: string; setAuthPass: (v: string) => void;
  authLoading: boolean;
  authMsg: string;
  isPro: boolean;
  isUltra: boolean;
  aiCredits: number; setAiCredits: (v: number) => void;
  handleAuth: (mode: "login" | "signup") => Promise<void>;
  handleLogout: () => Promise<void>;
  loadCloudProfile: (userId: string) => Promise<void>;
}

export function useAtlasAuth(): AtlasAuth {
  const [user, setUser] = useState<User | null>(null);
  const [, setSession] = useState<Session | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMsg, setAuthMsg] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [isUltra, setIsUltra] = useState(false);
  const [aiCredits, setAiCredits] = useState(0);

  const loadCloudProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("usuarios_atlas")
        .select("is_vip, is_ultra, ai_credits")
        .eq("user_id", userId)
        .single();
      if (data && !error) {
        startTransition(() => {
          setIsPro(data.is_vip || false);
          setIsUltra(data.is_ultra || false);
          setAiCredits(data.ai_credits || 0);
        });
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      startTransition(() => {
        if (s) {
          setSession(s);
          setUser(s.user);
          setAuthEmail(s.user.email || "");
          loadCloudProfile(s.user.id);
        }
      });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      startTransition(() => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          setAuthEmail(s.user.email || "");
          loadCloudProfile(s.user.id);
        }
      });
    });
    return () => subscription?.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  return {
    user, authEmail, setAuthEmail, authPass, setAuthPass,
    authLoading, authMsg, isPro, isUltra, aiCredits, setAiCredits,
    handleAuth, handleLogout, loadCloudProfile,
  };
}

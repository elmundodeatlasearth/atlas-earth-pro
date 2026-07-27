// src/components/auth-section.tsx
// Componente de autenticación (login/signup/logout/badge)

"use client";
import type { User } from "@supabase/supabase-js";

interface AuthSectionProps {
  user: User | null;
  authEmail: string;
  authPass: string;
  authLoading: boolean;
  authMsg: string;
  isPro: boolean;
  isUltra: boolean;
  aiCredits: number;
  setAuthEmail: (v: string) => void;
  setAuthPass: (v: string) => void;
  handleAuth: (mode: "login" | "signup") => Promise<void>;
  handleLogout: () => Promise<void>;
}

export default function AuthSection({
  user, authEmail, authPass, authLoading, authMsg,
  isPro, isUltra, aiCredits,
  setAuthEmail, setAuthPass, handleAuth, handleLogout,
}: AuthSectionProps) {
  if (!user) {
    return (
      <div className="space-y-2">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">🔑 Iniciar Sesión</div>
        <div className="relative">
          <input type="email" placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none placeholder:text-gray-600 transition-all duration-300 focus:shadow-[0_0_10px_rgba(0,221,221,0.15)]" />
        </div>
        <div className="relative">
          <input type="password" placeholder="Contraseña" value={authPass} onChange={e => setAuthPass(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none placeholder:text-gray-600 transition-all duration-300 focus:shadow-[0_0_10px_rgba(0,221,221,0.15)]" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleAuth("login")} disabled={authLoading}
            className="flex-1 text-xs font-bold py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white transition-all disabled:opacity-50 shadow-md shadow-cyan-900/30 hover:shadow-cyan-900/50">
            {authLoading ? (
              <span className="flex items-center justify-center gap-1">
                <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                ...
              </span>
            ) : "Entrar"}
          </button>
          <button onClick={() => handleAuth("signup")} disabled={authLoading}
            className="flex-1 text-xs font-bold py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50 border border-white/10">
            Registro
          </button>
        </div>
        {authMsg && <div className={`text-[10px] mt-1 ${authMsg.includes("❌") ? "text-red-400" : "text-green-400"}`}>{authMsg}</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between bg-gradient-to-r from-white/5 to-white/[0.02] rounded-lg px-3 py-2 border border-white/5">
        <div className="text-xs text-gray-300 truncate flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          {user.email}
        </div>
        <button onClick={handleLogout} className="text-[10px] text-red-400 hover:text-red-300 ml-2 shrink-0 transition-colors">
          Salir
        </button>
      </div>
      <div className="flex gap-1 mt-2">
        {isUltra ? (
          <span className="text-[10px] font-bold text-purple-400 bg-purple-900/30 px-2 py-1 rounded border border-purple-500/20 animate-pulse-glow">👑 ULTRA</span>
        ) : isPro ? (
          <span className="text-[10px] font-bold text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded border border-cyan-500/20">✅ PRO</span>
        ) : (
          <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded">🔒 Free</span>
        )}
        <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded">💎 {isUltra ? `${aiCredits}/50 IA` : isPro ? `${aiCredits}/5 IA` : `0 IA`}</span>
      </div>
    </div>
  );
}

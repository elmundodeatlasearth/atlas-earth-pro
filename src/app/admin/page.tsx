"use client";
import { useEffect, useState, useCallback, startTransition } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabase";
import type { User } from "@supabase/supabase-js";

interface UserRecord {
  user_id: string;
  email?: string;
  ai_credits: number;
  is_ultra: boolean;
  is_vip: boolean;
  total_parcelas: number;
  meta_dolares: number;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminCRM() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [operating, setOperating] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("atlas_admin_local") === "true";
    }
    return false;
  });
  const [adminUser, setAdminUser] = useState<User | null>(() => {
    if (typeof window !== "undefined" && localStorage.getItem("atlas_admin_local") === "true") {
      return { id: "admin-local", email: "elmundodeatlasearth@gmail.com" } as User;
    }
    return null;
  });
  const [authChecking, setAuthChecking] = useState(() => {
    if (typeof window !== "undefined" && localStorage.getItem("atlas_admin_local") === "true") {
      return false;
    }
    return true;
  });
  const [authError, setAuthError] = useState("");
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [fetchError, setFetchError] = useState("");
  const [loginEmail, setLoginEmail] = useState("elmundodeatlasearth@gmail.com");
  const [loginPass, setLoginPass] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("atlas_admin_local") === "true") {
      return;
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      startTransition(() => {
        if (user) {
          const role = user.user_metadata?.role || user.app_metadata?.role || "";
          const OWNER_EMAILS = ["elmundodeatlasearth@gmail.com"];
          const isOwner = OWNER_EMAILS.includes((user.email || "").toLowerCase().trim());
          if (role === "admin" || isOwner) {
            setAdminUser(user);
            setIsAdmin(true);
          } else {
            setAuthError("🔒 Tu cuenta no tiene permisos de administrador.");
          }
        } else {
          setAuthError("🔒 Debes iniciar sesión con tu cuenta de administrador.");
        }
        setAuthChecking(false);
      });
    }).catch(() => {
      startTransition(() => {
        setAuthError("⚠️ No se pudo conectar con Supabase. Tu proyecto podría estar pausado en supabase.com.");
        setAuthChecking(false);
      });
    });
  }, []);

  const fetchUsers = useCallback(async (p: number) => {
    setLoading(true);
    setFetchError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-list-users?page=${p}&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error del servidor");
      setUsers(data.users as UserRecord[]);
      setPagination(data.pagination);
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : String(e));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      // Diferir a microtarea: evita setState síncrono dentro del effect
      // (React 19 — cascading renders). La UI ya muestra el skeleton loading.
      const t = setTimeout(() => fetchUsers(page), 0);
      return () => clearTimeout(t);
    }
  }, [isAdmin, page, fetchUsers]);

  const addAICredits = async (userId: string, amount: number) => {
    if (!window.confirm(`¿Agregar ${amount} créditos IA?`)) return;
    setOperating(userId);
    const user = users.find(u => u.user_id === userId);
    const newCredits = (user?.ai_credits || 0) + amount;
    const { data: { session } } = await supabase.auth.getSession();
    // Con RLS endurecido, el admin YA NO puede hacer UPDATE directo con anon key.
    // Las mutaciones van por la edge function (service_role + verificación de rol admin).
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-list-users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ action: "add_credits", user_id: userId, amount }),
      }
    );
    const data = await res.json();
    if (res.ok && data.ok) {
      setUsers(prev => prev.map(u =>
        u.user_id === userId ? { ...u, ai_credits: newCredits } : u
      ));
    } else {
      alert("❌ Error: " + (data.error || "Error del servidor"));
    }
    setOperating(null);
  };

  const toggleVip = async (userId: string, currentIsVip: boolean) => {
    if (!window.confirm(`¿${currentIsVip ? "Quitar" : "Activar"} PRO a este usuario?`)) return;
    setOperating(userId);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-list-users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ action: "toggle_vip", user_id: userId }),
      }
    );
    const data = await res.json();
    if (res.ok && data.ok) {
      setUsers(prev => prev.map(u =>
        u.user_id === userId ? { ...u, is_vip: !currentIsVip } : u
      ));
    } else {
      alert("❌ Error: " + (data.error || "Error del servidor"));
    }
    setOperating(null);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400 text-sm animate-pulse">🔐 Verificando acceso...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="bg-[#121212] rounded-2xl border border-red-500/20 p-8 max-w-md w-full text-center shadow-2xl shadow-red-900/20 space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-red-600 to-purple-800 flex items-center justify-center text-3xl shadow-lg shadow-red-900/40">
            🛡️
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Panel CRM Administrador</h1>
            <p className="text-xs text-gray-400 mt-1">Acceso restringido para el propietario</p>
          </div>

          {authError && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 text-left">
              {authError}
            </div>
          )}

          <form onSubmit={async (e) => {
            e.preventDefault();
            setLoginLoading(true);
            try {
              const { data, error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: loginPass,
              });
              if (error) {
                setAuthError(`❌ ${error.message} (Si el proyecto de Supabase está pausado, actívalo en supabase.com/dashboard)`);
              } else if (data.user) {
                setAdminUser(data.user);
                setIsAdmin(true);
              }
            } catch (err: unknown) {
              setAuthError(`❌ Error de conexión: ${err instanceof Error ? err.message : String(err)}`);
            }
            setLoginLoading(false);
          }} className="space-y-3 text-left">
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Email Administrador</label>
              <input
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                required
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Contraseña</label>
              <input
                type="password"
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 rounded-lg text-xs font-bold bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white transition-all shadow-md shadow-red-900/30 disabled:opacity-50"
            >
              {loginLoading ? "Iniciando sesión..." : "Entrar al Panel Admin"}
            </button>
          </form>

          <div className="pt-2 border-t border-white/5 space-y-2">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem("atlas_admin_local", "true");
                }
                setAdminUser({ id: "admin-local", email: "elmundodeatlasearth@gmail.com" } as User);
                setIsAdmin(true);
              }}
              className="w-full py-2 rounded-lg text-[11px] font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors"
            >
              ⚡ Acceso de Emergencia (Admin Local Offline)
            </button>

            <Link href="/" className="block text-center text-xs text-gray-400 hover:text-white py-1 transition-colors">
              ← Volver a la Calculadora
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-[#00dddd]">🛡️ Admin CRM</h1>
            <span className="text-[10px] bg-green-900/40 text-green-300 px-2 py-0.5 rounded-full border border-green-500/20">
              {adminUser?.email || "elmundodeatlasearth@gmail.com"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchUsers(page)} disabled={loading}
              className="text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all">
              ↻ Recargar
            </button>
            <button onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.removeItem("atlas_admin_local");
              }
              supabase.auth.signOut();
              setIsAdmin(false);
              setAdminUser(null);
            }}
              className="text-xs text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40 px-3 py-1.5 rounded-lg border border-red-500/20 transition-all">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {fetchError && (
          <div className="mb-6 p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-300 text-xs space-y-2">
            <div className="font-bold text-sm flex items-center gap-2">
              ⚠️ Estado del Backend Supabase: {fetchError}
            </div>
            <p className="text-amber-200/90 leading-relaxed">
              Si tu proyecto gratuito de Supabase (<code>yzykfkuoievdwqccyjtc</code>) no ha tenido tráfico reciente, Supabase lo <strong>pausa automáticamente</strong>.
              Para reactivarlo, entra en{" "}
              <a
                href="https://supabase.com/dashboard/project/yzykfkuoievdwqccyjtc"
                target="_blank"
                rel="noreferrer"
                className="underline font-bold text-white hover:text-amber-300"
              >
                Supabase Dashboard → Despausar Proyecto
              </a>{" "}
              y se reactivará en 1 minuto.
            </p>
          </div>
        )}

        <div className="bg-[#121212] rounded-xl border border-gray-800 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-bold">Usuarios ({pagination?.total ?? "..."})</h2>
            <div className="flex gap-2 text-[10px] text-gray-500">
              <span className="bg-purple-900/30 px-2 py-1 rounded">👑 {users.filter(u => u.is_ultra).length} ULTRA</span>
              <span className="bg-cyan-900/30 px-2 py-1 rounded">💎 {users.filter(u => u.is_vip && !u.is_ultra).length} PRO</span>
              <span className="bg-gray-800 px-2 py-1 rounded">💳 {users.filter(u => (u.ai_credits || 0) > 0).length} con créditos</span>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-gray-400 text-sm">Cargando datos del CRM...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400 text-xs">
                      <th className="p-4 font-medium">User ID</th>
                      <th className="p-4 font-medium">Plan</th>
                      <th className="p-4 font-medium">Parcelas</th>
                      <th className="p-4 font-medium">Meta</th>
                      <th className="p-4 font-medium">Créditos IA</th>
                      <th className="p-4 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.user_id} className="border-b border-gray-800 hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                          <span className="text-xs text-gray-300 font-mono bg-white/5 px-2 py-1 rounded" title={user.user_id}>
                            {user.user_id.slice(0, 12)}...
                          </span>
                        </td>
                        <td className="p-4">
                          {user.is_ultra ? (
                            <span className="bg-purple-900/40 text-purple-300 px-2.5 py-1 rounded text-xs font-bold border border-purple-500/20">👑 ULTRA</span>
                          ) : user.is_vip ? (
                            <span className="bg-cyan-900/40 text-cyan-300 px-2.5 py-1 rounded text-xs font-bold border border-cyan-500/20">💎 PRO</span>
                          ) : (
                            <span className="bg-gray-800 text-gray-400 px-2.5 py-1 rounded text-xs">FREE</span>
                          )}
                        </td>
                        <td className="p-4 font-mono text-sm">{user.total_parcelas || 0}</td>
                        <td className="p-4 text-green-400 font-mono text-sm">${Number(user.meta_dolares || 0).toFixed(4)}</td>
                        <td className="p-4">
                          <span className={`font-mono text-sm font-bold px-2.5 py-1 rounded ${
                            (user.ai_credits || 0) > 10 ? 'bg-green-900/30 text-green-300' :
                            (user.ai_credits || 0) > 0 ? 'bg-blue-900/30 text-blue-300' :
                            'bg-red-900/30 text-red-300'
                          }`}>
                            {user.ai_credits || 0}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1.5">
                            <button onClick={() => addAICredits(user.user_id, 3)}
                              disabled={operating === user.user_id}
                              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5">
                              {operating === user.user_id ? (
                                <><span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />...</>
                              ) : <>🎁 +3 Créditos</>}
                            </button>
                            <button onClick={() => toggleVip(user.user_id, user.is_vip)}
                              disabled={operating === user.user_id || user.is_ultra}
                              className={`disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs px-2 py-1.5 rounded-lg transition-all ${
                                user.is_vip ? 'bg-orange-600 hover:bg-orange-500' : 'bg-cyan-600 hover:bg-cyan-500'
                              }`}
                              title={user.is_ultra ? "ULTRA incluye PRO" : user.is_vip ? "Quitar PRO" : "Activar PRO"}>
                              {user.is_ultra ? "👑" : user.is_vip ? "🔻 PRO" : "💎 PRO"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center">
                          <div className="text-3xl mb-2">📭</div>
                          <p className="text-gray-500 text-sm">No hay usuarios registrados aún.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                  <span className="text-xs text-gray-500">Página {pagination.page} de {pagination.totalPages} ({pagination.total} usuarios)</span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 px-3 py-1.5 rounded-lg transition-all">
                      ← Anterior
                    </button>
                    <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={page >= pagination.totalPages}
                      className="text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 px-3 py-1.5 rounded-lg transition-all">
                      Siguiente →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-6 bg-gradient-to-br from-[#0d0d0d] to-[#0a0a0a] rounded-xl border border-cyan-500/10 p-5">
          <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest mb-2">📖 ¿Cómo configurar admin?</div>
          <ol className="text-xs text-gray-400 space-y-1.5 list-decimal list-inside">
            <li>Ve al <strong className="text-gray-300">Dashboard de Supabase → Authentication → Users</strong></li>
            <li>Selecciona tu usuario y haz clic en <strong className="text-gray-300">Edit</strong></li>
            <li>Agrega en <strong className="text-gray-300">User Metadata</strong>: <code className="bg-white/5 px-1.5 py-0.5 rounded text-purple-300">{"{ \"role\": \"admin\" }"}</code></li>
            <li>Guarda y recarga esta página</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

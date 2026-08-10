"use client";
import { useEffect, useState, useCallback } from "react";
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
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState("");
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const role = user.user_metadata?.role || user.app_metadata?.role || "";
        if (role === "admin") {
          setAdminUser(user);
          setIsAdmin(true);
        } else {
          setAuthError("🔒 No tienes permisos de administrador.");
        }
      } else {
        setAuthError("🔒 Debes iniciar sesión.");
      }
      setAuthChecking(false);
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
        <div className="bg-[#121212] rounded-xl border border-red-500/20 p-8 max-w-md text-center shadow-2xl shadow-red-900/20">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-white mb-2">Acceso Restringido</h1>
          <p className="text-sm text-gray-400 mb-6">{authError}</p>
          <Link href="/" className="inline-block text-xs font-bold py-2.5 px-8 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white transition-all shadow-lg shadow-cyan-900/30">
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
        <div className="bg-[#121212] rounded-xl border border-red-500/20 p-8 max-w-md text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-white mb-2">Sesión no encontrada</h1>
          <p className="text-sm text-gray-400 mb-6">Tu sesión expiró.</p>
          <Link href="/" className="inline-block text-xs font-bold py-2.5 px-8 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-all">Ir al Inicio</Link>
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
              {adminUser.email}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => fetchUsers(page)} disabled={loading}
              className="text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all">
              ↻ Recargar
            </button>
            <button onClick={() => supabase.auth.signOut()}
              className="text-xs text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40 px-3 py-1.5 rounded-lg border border-red-500/20 transition-all">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {fetchError && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/30 rounded-xl text-red-300 text-sm">
            ⚠️ {fetchError}
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

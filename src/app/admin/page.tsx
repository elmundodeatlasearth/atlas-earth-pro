"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import type { User } from "@supabase/supabase-js";

interface UserRecord {
  user_id: string;
  ai_credits: number;
  is_ultra: boolean;
  total_parcelas: number;
  meta_dolares: number;
  created_at: string;
}

export default function AdminCRM() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState("");

  // Verificar autenticación primero
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setAdminUser(user);
        setAuthChecking(false);
      } else {
        setAuthError("🔒 Debes iniciar sesión para acceder al panel de administración.");
        setAuthChecking(false);
      }
    });
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("usuarios_atlas")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUsers(data as UserRecord[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (adminUser) fetchUsers();
  }, [adminUser]);

  const addAICredits = async (userId: string, credits: number) => {
    if (!window.confirm(`¿Agregar ${credits} créditos IA al usuario?`)) return;

    const user = users.find(u => u.user_id === userId);
    if (!user) return;

    const newCredits = (user.ai_credits || 0) + credits;

    const { error } = await supabase
      .from("usuarios_atlas")
      .update({ ai_credits: newCredits })
      .eq("user_id", userId);

    if (!error) {
      alert(`✅ Se agregaron ${credits} créditos.`);
      fetchUsers();
    } else {
      alert("❌ Error al actualizar créditos.");
    }
  };

  // === LOADING ===
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400 text-sm">Verificando acceso...</div>
      </div>
    );
  }

  // === NO AUTH ===
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
        <div className="bg-[#121212] rounded-xl border border-red-500/30 p-8 max-w-md text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-white mb-2">Acceso Restringido</h1>
          <p className="text-sm text-gray-400">{authError}</p>
          <a href="/" className="mt-6 inline-block text-xs font-bold py-2 px-6 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-all">
            Volver al Inicio
          </a>
        </div>
      </div>
    );
  }

  // === AUTHENTICATED ADMIN VIEW ===
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-[#00dddd]">🛡️ Admin CRM - Atlas Earth PRO</h1>
        <button onClick={() => supabase.auth.signOut()}
          className="text-xs text-red-400 hover:text-red-300 bg-red-900/20 px-4 py-2 rounded-lg border border-red-500/20">
          Cerrar Sesión
        </button>
      </div>

      <div className="bg-[#121212] rounded-xl border border-gray-800 p-6 shadow-xl overflow-x-auto">
        <h2 className="text-xl font-bold mb-4">Base de Datos de Usuarios ({users.length})</h2>

        {loading ? (
          <p className="text-gray-400">Cargando datos del CRM...</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="p-3">User ID</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Parcelas</th>
                <th className="p-3">Meta Diaria</th>
                <th className="p-3">Créditos IA</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.user_id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="p-3 text-xs text-gray-300 font-mono">{user.user_id}</td>
                  <td className="p-3">
                    {user.is_ultra ? (
                      <span className="bg-purple-900/50 text-purple-400 px-2 py-1 rounded text-xs font-bold">ULTRA</span>
                    ) : (
                      <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">FREE</span>
                    )}
                  </td>
                  <td className="p-3 font-mono">{user.total_parcelas || 0}</td>
                  <td className="p-3 text-green-400">${user.meta_dolares || 0}</td>
                  <td className="p-3">
                    <span className={`font-bold ${user.ai_credits > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                      {user.ai_credits || 0}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => addAICredits(user.user_id, 3)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 rounded transition-colors"
                    >
                      +3 Créditos (Donación)
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">No hay usuarios registrados aún.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

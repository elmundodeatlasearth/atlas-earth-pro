"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";

export default function AdminCRM() {
  const [users, setUsers] = useState<{ user_id: string; ai_credits: number; is_ultra: boolean; total_parcelas: number; meta_dolares: number; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("usuarios_atlas")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const addAICredits = async (userId: string, credits: number) => {
    const user = users.find(u => u.user_id === userId);
    if (!user) return;
    
    const newCredits = (user.ai_credits || 0) + credits;
    
    const { error } = await supabase
      .from("usuarios_atlas")
      .update({ ai_credits: newCredits })
      .eq("user_id", userId);
      
    if (!error) {
      alert(`✅ Se agregaron ${credits} créditos al usuario.`);
      fetchUsers();
    } else {
      alert("❌ Error al actualizar créditos.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-[#00dddd]">🛡️ Admin CRM - Atlas Earth PRO</h1>
      
      <div className="bg-[#121212] rounded-xl border border-gray-800 p-6 shadow-xl overflow-x-auto">
        <h2 className="text-xl font-bold mb-4">Base de Datos de Usuarios</h2>
        
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
                  <td className="p-3 text-xs text-gray-300">{user.user_id}</td>
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

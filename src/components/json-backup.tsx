// src/components/json-backup.tsx
// Componente para Exportar e Importar Copias de Seguridad en JSON
"use client";
import React, { useState, useRef } from "react";

export default function JsonBackup() {
  const [msg, setMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = () => {
    try {
      const backupData: Record<string, unknown> = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        profiles: {},
        activeProfile: localStorage.getItem("ae_active_profile") || "Principal",
        profileList: JSON.parse(localStorage.getItem("ae_profiles") || "[]"),
      };

      // Recorrer todas las claves de perfiles locales
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("ae_profile_")) {
          try {
            (backupData.profiles as Record<string, unknown>)[key] = JSON.parse(localStorage.getItem(key) || "{}");
          } catch {
            (backupData.profiles as Record<string, unknown>)[key] = localStorage.getItem(key);
          }
        }
      }

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `atlas_earth_pro_backup_${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setMsg("✅ Respaldo descargado correctamente");
      setTimeout(() => setMsg(""), 3500);
    } catch (e: unknown) {
      setMsg(`❌ Error al exportar: ${e instanceof Error ? e.message : String(e)}`);
      setTimeout(() => setMsg(""), 4000);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed.profiles || typeof parsed.profiles !== "object") {
          throw new Error("El archivo no tiene el formato válido de Atlas Earth Pro");
        }

        // Restaurar perfiles
        for (const [key, value] of Object.entries(parsed.profiles)) {
          localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
        }

        if (Array.isArray(parsed.profileList)) {
          localStorage.setItem("ae_profiles", JSON.stringify(parsed.profileList));
        }

        if (parsed.activeProfile) {
          localStorage.setItem("ae_active_profile", String(parsed.activeProfile));
        }

        setMsg("✅ Respaldo restaurado con éxito. Recargando...");
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err: unknown) {
        setMsg(`❌ Archivo inválido: ${err instanceof Error ? err.message : String(err)}`);
        setTimeout(() => setMsg(""), 4500);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="pt-2 border-t border-white/5 space-y-1.5">
      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex items-center justify-between">
        <span>💾 Respaldo Offline (JSON)</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={handleExport}
          className="text-[10px] font-semibold py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors flex items-center justify-center gap-1"
        >
          <span>📥</span> Exportar JSON
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-[10px] font-semibold py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors flex items-center justify-center gap-1"
        >
          <span>📤</span> Importar JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </div>
      {msg && (
        <div className={`text-[10px] font-medium ${msg.includes("❌") ? "text-red-400" : "text-emerald-400"}`}>
          {msg}
        </div>
      )}
    </div>
  );
}

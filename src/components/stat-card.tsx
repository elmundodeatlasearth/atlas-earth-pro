// src/components/stat-card.tsx
// Componentes reutilizables de tarjetas de estadísticas

import { fmt } from "@/utils/atlasMath";

export function StatCard({ label, usd, local, moneda }: { label: string; usd: number; local: number; moneda: string }) {
  return (
    <div className="group bg-gradient-to-br from-[#0e0e0e] to-[#121212] rounded-xl p-4 border border-white/5 hover:border-cyan-500/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(0,221,221,0.12)] hover:translate-y-[-2px]">
      <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-black bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">
        ${fmt(usd, usd < 1 ? 6 : 2)} USD
      </div>
      {moneda !== "USD" && (
        <div className="text-sm font-bold text-lime-400/90 mt-0.5">≈ ${fmt(local, 2)} {moneda}</div>
      )}
    </div>
  );
}

export function MetricBox({ label, value, color = "text-white" }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-gradient-to-br from-[#0e0e0e] to-[#141414] rounded-lg p-3 border border-white/5 hover:border-white/10 transition-all duration-300">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}

export function GlowCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-gradient-to-br from-[#111] to-[#0d0d0d] rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all duration-500 ${className}`}>
      {children}
    </div>
  );
}

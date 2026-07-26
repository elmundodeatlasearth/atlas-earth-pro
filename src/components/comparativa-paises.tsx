// src/components/comparativa-paises.tsx
// Tabla comparativa de países vs Estados Unidos — tiers, multiplicadores, renta

"use client";
import { TIERS_COMPLETOS, MAP_MONEDAS, MotorAtlasEarth, fmt } from "@/utils/atlasMath";
import { GlowCard } from "./stat-card";

interface ComparativaPaisesProps {
  motor: MotorAtlasEarth;
  horasSrb: number;
  eficiencia: number;
  horasBoost: number;
}

export default function ComparativaPaises({ motor, horasSrb, eficiencia, horasBoost }: ComparativaPaisesProps) {
  const PAISES = Object.keys(TIERS_COMPLETOS);
  const USA_TIERS = TIERS_COMPLETOS["Estados Unidos"];

  const calcularRentaPais = (pais: string): number => {
    const mult = motor._get_tier_mult(motor.total_parcelas, pais, TIERS_COMPLETOS);
    const total = motor.total_parcelas;
    const rentaBaseSecs = total * motor.renta_promedio_sec;
    const rentaBruta = (motor.renta_base + rentaBaseSecs) * mult * motor.pasaporte_mult;

    const horasMes = 720;
    const horasNormalesMes = horasMes - horasSrb;
    const pctBoost = horasBoost / 24;
    const horasConBoost = horasNormalesMes * pctBoost * (eficiencia / 100);
    const horasSinBoost = horasNormalesMes - horasConBoost;

    const ingSrb = (motor.renta_base + rentaBaseSecs) * 3600 * horasSrb * 50;
    const ingBoost = (motor.renta_base + rentaBaseSecs) * 3600 * horasConBoost * mult;
    const ingSin = (motor.renta_base + rentaBaseSecs) * 3600 * horasSinBoost * 1;
    const rentaDiaria = ((ingSrb + ingBoost + ingSin) * motor.pasaporte_mult) / 30;
    return rentaDiaria;
  };

  const rentaUSA = calcularRentaPais("Estados Unidos");

  return (
    <GlowCard>
      <div className="text-xs text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
        🌍 Comparativa de Países
        <span className="text-[9px] text-gray-600">vs Estados Unidos (referencia)</span>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[640px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-gray-500">
              <th className="py-2 pr-4 font-semibold">País</th>
              <th className="py-2 pr-4 font-semibold">Moneda</th>
              <th className="py-2 pr-4 font-semibold text-right">Mult. Inicial</th>
              <th className="py-2 pr-4 font-semibold text-right">Mult. Máx</th>
              <th className="py-2 pr-4 font-semibold text-right">Renta/Día (USD)</th>
              <th className="py-2 pr-4 font-semibold text-right">vs USA</th>
            </tr>
          </thead>
          <tbody>
            {PAISES.map((pais) => {
              const info = TIERS_COMPLETOS[pais];
              const moneda = MAP_MONEDAS[pais] || "USD";
              const multInicial = info.multiplicadores[0];
              const multMax = info.multiplicadores[info.multiplicadores.length - 1];
              const renta = calcularRentaPais(pais);
              const diff = rentaUSA > 0 ? ((renta - rentaUSA) / rentaUSA) * 100 : 0;
              const isUSA = pais === "Estados Unidos";

              return (
                <tr
                  key={pais}
                  className={`border-b border-white/[2%] transition-colors duration-200
                    ${isUSA ? "bg-cyan-500/5" : "hover:bg-white/[2%]"}
                  `}
                >
                  <td className="py-3 pr-4">
                    <div className={`font-bold text-sm ${isUSA ? "text-cyan-400" : "text-white"}`}>
                      {pais}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs text-gray-400 font-mono">{moneda}</span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className={`font-bold ${multInicial >= 30 ? "text-green-400" : "text-yellow-400"}`}>
                      {multInicial}x
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="font-bold text-gray-300">{multMax}x</span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="font-mono font-bold text-green-400">
                      ${fmt(renta, renta < 0.01 ? 8 : 6)}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    {isUSA ? (
                      <span className="text-xs text-gray-500">—</span>
                    ) : (
                      <span className={`font-bold text-xs ${diff >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {diff >= 0 ? "+" : ""}{diff.toFixed(1)}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-1 lg:grid-cols-3 gap-3 text-[10px] text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500/50" />
          Estados Unidos tiene el mejor multiplicador inicial (30x)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-500/50" />
          Todos los demás países inician en 20x
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500/50" />
          Internacional tiene más tramos pero menor multiplicador
        </div>
      </div>
    </GlowCard>
  );
}

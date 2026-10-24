// src/components/reinvestment-calc.tsx
// Calculadora de Reinversión de Renta (Efecto Bola de Nieve / Interés Compuesto)
"use client";
import React, { useState, useMemo } from "react";
import { GlowCard } from "./stat-card";
import {
  MotorAtlasEarth,
  TIERS_COMPLETOS,
  simularReinversionCompuesta,
  fmt,
} from "@/utils/atlasMath";

interface ReinvestmentCalcProps {
  motor: MotorAtlasEarth;
  pais: string;
  horasSrb: number;
  abPorDia: number;
}

export default function ReinvestmentCalculator({
  motor,
  pais,
  horasSrb,
  abPorDia,
}: ReinvestmentCalcProps) {
  const [meses, setMeses] = useState<number>(6);
  const [tasaConversion, setTasaConversion] = useState<number>(25); // 25 o 33 AB por USD
  const [incluirAhorroDiario, setIncluirAhorroDiario] = useState<boolean>(true);

  const abAhorroMes = incluirAhorroDiario ? Math.round(abPorDia * 30) : 0;

  const proyeccion = useMemo(() => {
    return simularReinversionCompuesta(
      motor,
      pais,
      TIERS_COMPLETOS,
      meses,
      tasaConversion,
      abAhorroMes,
      horasSrb
    );
  }, [motor, pais, meses, tasaConversion, abAhorroMes, horasSrb]);

  const ultimoMes = proyeccion[proyeccion.length - 1];
  const totalParcelasGanadas = ultimoMes ? ultimoMes.totalParcelasFinMes - motor.total_parcelas : 0;
  const rentaInicialDia = motor.calcular_renta_diaria_normal(motor._get_tier_mult(motor.total_parcelas, pais, TIERS_COMPLETOS));
  const rentaFinalDia = ultimoMes ? ultimoMes.rentaDiariaProyectada : rentaInicialDia;
  const gananciaExtraDia = rentaFinalDia - rentaInicialDia;

  return (
    <GlowCard>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="text-xs text-gray-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
          <span>❄️</span> Calculadora de Reinversión (Efecto Bola de Nieve)
        </div>
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
          Interés Compuesto en Atlas Earth
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-4 leading-relaxed">
        Simula qué ocurre si canjeas los dólares generados por Atlas Bucks ($1 USD = {tasaConversion} AB) para comprar más parcelas automáticamente cada mes.
      </p>

      {/* Controles de Configuración */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-black/40 rounded-xl border border-white/5 mb-4">
        {/* Plazo en meses */}
        <div>
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">
            Plazo de Reinversión:
          </label>
          <div className="flex gap-1.5 bg-[#0d1420] p-1 rounded-lg border border-white/5">
            {[3, 6, 12, 24].map((m) => (
              <button
                key={m}
                onClick={() => setMeses(m)}
                className={`flex-1 py-1 text-xs font-semibold rounded transition-all ${
                  meses === m
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>

        {/* Tasa de Conversión */}
        <div>
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">
            Tasa de Canje USD → AB:
          </label>
          <div className="flex gap-1.5 bg-[#0d1420] p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setTasaConversion(25)}
              className={`flex-1 py-1 text-xs font-semibold rounded transition-all ${
                tasaConversion === 25
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              $1 = 25 AB (Estándar)
            </button>
            <button
              onClick={() => setTasaConversion(33)}
              className={`flex-1 py-1 text-xs font-semibold rounded transition-all ${
                tasaConversion === 33
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              $1 = 33 AB (Evento)
            </button>
          </div>
        </div>

        {/* Sumar ahorro habitual */}
        <div>
          <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block mb-1.5">
            Sumar tu Ahorro Diario habitual:
          </label>
          <div className="flex gap-1.5 bg-[#0d1420] p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setIncluirAhorroDiario(true)}
              className={`flex-1 py-1 text-xs font-semibold rounded transition-all ${
                incluirAhorroDiario
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sí (+{abAhorroMes} AB/m)
            </button>
            <button
              onClick={() => setIncluirAhorroDiario(false)}
              className={`flex-1 py-1 text-xs font-semibold rounded transition-all ${
                !incluirAhorroDiario
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Solo Renta
            </button>
          </div>
        </div>
      </div>

      {/* Resumen del Resultado */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-gradient-to-br from-[#0c1a14] to-[#08120e] rounded-xl p-3.5 border border-emerald-900/40">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">
            🏞️ Parcelas al Final ({meses} meses)
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono">
            {ultimoMes?.totalParcelasFinMes.toLocaleString()}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            +{totalParcelasGanadas.toLocaleString()} parcelas nuevas
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0c1a14] to-[#08120e] rounded-xl p-3.5 border border-emerald-900/40">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">
            📈 Renta Diaria Nueva
          </div>
          <div className="text-xl font-bold text-cyan-400 font-mono">
            ${fmt(rentaFinalDia, 4)} USD
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {gananciaExtraDia >= 0 ? "+" : ""}${fmt(gananciaExtraDia, 4)}/d vs inicial
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0c1a14] to-[#08120e] rounded-xl p-3.5 border border-emerald-900/40">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">
            🪙 AB Reinyectados
          </div>
          <div className="text-xl font-bold text-yellow-400 font-mono">
            {proyeccion.reduce((acc, p) => acc + p.abTotalesMes, 0).toLocaleString()} AB
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            Total reinvertido en compras
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0c1a14] to-[#08120e] rounded-xl p-3.5 border border-emerald-900/40">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">
            ⚡ Multiplicador Final
          </div>
          <div className="text-xl font-bold text-purple-400 font-mono">
            {ultimoMes?.multiplicadorFinMes}x
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            Tramo al terminar el plazo
          </div>
        </div>
      </div>

      {/* Tabla Desglose Mes a Mes */}
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-[9px] uppercase tracking-wider text-gray-500 border-b border-white/5 bg-[#0a0a0f]">
              <th className="py-2 px-3 text-left">Mes</th>
              <th className="py-2 px-3 text-right">Renta Generada</th>
              <th className="py-2 px-3 text-right">AB por Renta</th>
              <th className="py-2 px-3 text-right">Parcelas Compradas</th>
              <th className="py-2 px-3 text-right">Total Parcelas</th>
              <th className="py-2 px-3 text-right">Renta Diaria</th>
            </tr>
          </thead>
          <tbody>
            {proyeccion.map((p) => (
              <tr key={p.mes} className="border-b border-white/[2%] hover:bg-white/[1%] font-mono">
                <td className="py-2 px-3 text-left font-bold text-emerald-400">Mes {p.mes}</td>
                <td className="py-2 px-3 text-right text-gray-300">${fmt(p.rentaMesUsd, 2)}</td>
                <td className="py-2 px-3 text-right text-yellow-300">+{p.abGeneradosPorRenta.toLocaleString()} AB</td>
                <td className="py-2 px-3 text-right text-cyan-300 font-bold">+{p.parcelasCompradasMes}</td>
                <td className="py-2 px-3 text-right text-white font-bold">{p.totalParcelasFinMes.toLocaleString()}</td>
                <td className="py-2 px-3 text-right text-emerald-300">${fmt(p.rentaDiariaProyectada, 4)}/d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlowCard>
  );
}

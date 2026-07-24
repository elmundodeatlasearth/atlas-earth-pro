"use client";
import { useState, useEffect } from "react";
import { MotorAtlasEarth, obtenerTasaCambio } from "@/utils/atlasMath";

export default function Home() {
  const [parcelasC, setParcelasC] = useState(150);
  const [parcelasR, setParcelasR] = useState(0);
  const [parcelasE, setParcelasE] = useState(0);
  const [parcelasL, setParcelasL] = useState(0);
  const [pasaporte, setPasaporte] = useState(0);
  const [horasBoost, setHorasBoost] = useState(24);
  const [eficiencia, setEficiencia] = useState(100);
  const [moneda, setMoneda] = useState("USD");
  const [pais, setPais] = useState("Estados Unidos");
  const [meta, setMeta] = useState(1.0);
  const [tasa, setTasa] = useState(1.0);

  const [simExtra, setSimExtra] = useState(0);

  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    setTasa(obtenerTasaCambio(moneda));
  }, [moneda]);

  const motor = new MotorAtlasEarth(parcelasC, parcelasR, parcelasE, parcelasL, pasaporte, horasBoost, eficiencia);
  
  // Dummy tiers for now
  const tiersDict = {
    "Estados Unidos": {
      limites: [150, 220, 290, 365, 435, 545, 625, 730, 875, 1100, 1500, 2250, 3000, 10000],
      multiplicadores: [30, 20, 15, 12, 10, 8, 7, 6, 5, 4, 3, 2, 2, 2]
    }
  };

  const rentaMensualUsd = motor.calcular_renta_generica(motor.total_parcelas, pais, tiersDict, 64); // 64 SRB
  const rentaDiariaUsd = rentaMensualUsd / 30;

  const simTotalParcelas = motor.total_parcelas + simExtra;
  const simRentaMensualUsd = motor.calcular_renta_generica(simTotalParcelas, pais, tiersDict, 64);
  const simRentaDiariaUsd = simRentaMensualUsd / 30;

  // Cálculos para la Auditoría
  const { tramo_actual, siguiente_tramo, faltantes: faltantesTier } = motor.calcular_escalera(pais, tiersDict);
  const { p_test: parcelasMeta } = motor.calcular_meta_automatica(meta, pais, tiersDict, 64);
  const faltantesMeta = parcelasMeta > motor.total_parcelas ? parcelasMeta - motor.total_parcelas : 0;
  
  const abDiarios = ((motor.renta_base * 3600 * 24) * 20).toFixed(1); // aproximación simple F2P
  const diasMetaF2p = (faltantesMeta * 100) / parseFloat(abDiarios);
  const diasMetaEc = diasMetaF2p > 15 ? diasMetaF2p / 2.6 : diasMetaF2p; // rough EC estimate
  const ahorroEc = diasMetaF2p - diasMetaEc;

  const handleGenerateAI = async () => {
    setAiLoading(true);
    setAiError("");
    setAiAdvice("");
    try {
      const response = await fetch("https://yzykfkuoievdwqccyjtc.supabase.co/functions/v1/ai-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "anon", // Para Next.js anon (CRM F2P handle logic pending)
          parcelas: motor.total_parcelas,
          ab_diarios: (motor.renta_base * 3600 * 24) * 20, // Aprox AB
          ab_ahorrados: 0,
          meta_diaria: meta,
          dia_optimo_pase: 90
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error de red");
      setAiAdvice(data.advice || data);
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <aside className="w-80 bg-[#121212] border-r border-gray-800 p-6 flex flex-col gap-6 overflow-y-auto">
        <h2 className="text-xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          Centro de Mando PRO
        </h2>
        
        <div>
          <label className="text-sm text-gray-400 block mb-2">Moneda Local</label>
          <select 
            value={moneda} 
            onChange={e => setMoneda(e.target.value)}
            className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg p-2 focus:border-green-500 focus:outline-none"
          >
            <option value="USD">USD - Dólar</option>
            <option value="MXN">MXN - Peso Mexicano</option>
            <option value="EUR">EUR - Euro</option>
            <option value="CAD">CAD - Dólar Canadiense</option>
          </select>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-300 mt-4 mb-2">Inventario</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-green-400 block">Comunes</label>
              <input type="number" value={parcelasC} onChange={e => setParcelasC(Number(e.target.value))} className="w-full bg-[#1e1e1e] p-2 rounded-lg" />
            </div>
            <div>
              <label className="text-xs text-blue-400 block">Raras</label>
              <input type="number" value={parcelasR} onChange={e => setParcelasR(Number(e.target.value))} className="w-full bg-[#1e1e1e] p-2 rounded-lg" />
            </div>
            <div>
              <label className="text-xs text-purple-400 block">Épicas</label>
              <input type="number" value={parcelasE} onChange={e => setParcelasE(Number(e.target.value))} className="w-full bg-[#1e1e1e] p-2 rounded-lg" />
            </div>
            <div>
              <label className="text-xs text-yellow-400 block">Legendarias</label>
              <input type="number" value={parcelasL} onChange={e => setParcelasL(Number(e.target.value))} className="w-full bg-[#1e1e1e] p-2 rounded-lg" />
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-[#1a1a1a] rounded-lg border border-gray-700">
             <div className="flex justify-between text-sm mb-1">
               <span className="text-gray-400">Total Parcelas:</span>
               <span className="font-bold text-[#00dddd]">{motor.total_parcelas}</span>
             </div>
             <div className="flex justify-between text-sm">
               <span className="text-gray-400">Límite Salto ({siguiente_tramo}):</span>
               <span className="font-bold text-yellow-500">Faltan {faltantesTier}</span>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-8">📊 Tablero de Estrategia PRO</h1>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Dashboard Actual */}
          <div className="bg-[#121212] rounded-xl border border-gray-800 p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              📊 Tu Tablero Actual
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-400">Activos</div>
                <div className="text-3xl font-bold text-[#00dddd]">{motor.total_parcelas} Parcelas</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Meta (${meta.toFixed(2)} USD)</div>
                <div className="text-xl font-bold text-[#00dddd]">Faltan {faltantesMeta} Parcelas</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-400">Ingreso 24 Horas</div>
                <div className="text-2xl font-bold text-green-400">${rentaDiariaUsd.toFixed(4)} USD</div>
                {moneda !== 'USD' && <div className="text-sm text-lime-400 font-bold">≈ ${(rentaDiariaUsd * tasa).toFixed(2)} {moneda}</div>}
              </div>
              <div>
                <div className="text-sm text-gray-400">Mensual Estimado</div>
                <div className="text-2xl font-bold text-green-400">${rentaMensualUsd.toFixed(2)} USD</div>
                {moneda !== 'USD' && <div className="text-sm text-lime-400 font-bold">≈ ${(rentaMensualUsd * tasa).toFixed(2)} {moneda}</div>}
              </div>
            </div>
          </div>

          {/* Simulador */}
          <div className="bg-gradient-to-br from-[#121212] to-[#1a1a2e] rounded-xl border border-blue-900/50 p-6 shadow-xl shadow-blue-900/20">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              🧮 Simulador de Inversión
            </h2>
            <div className="mb-6">
              <label className="text-sm text-gray-400 block mb-2">Parcelas adicionales a comprar:</label>
              <input 
                type="number" 
                value={simExtra} 
                onChange={e => setSimExtra(Number(e.target.value))}
                className="w-full bg-[#1e1e1e] border border-blue-800 rounded-lg p-3 focus:border-blue-500 focus:outline-none" 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-400">Ingreso 24 Horas</div>
                <div className="text-2xl font-bold text-[#00dddd]">${simRentaDiariaUsd.toFixed(4)} USD</div>
                {moneda !== 'USD' && <div className="text-sm text-lime-400 font-bold">≈ ${(simRentaDiariaUsd * tasa).toFixed(2)} {moneda}</div>}
              </div>
              <div>
                <div className="text-sm text-gray-400">Mensual Estimado</div>
                <div className="text-2xl font-bold text-[#00dddd]">${simRentaMensualUsd.toFixed(2)} USD</div>
                {moneda !== 'USD' && <div className="text-sm text-lime-400 font-bold">≈ ${(simRentaMensualUsd * tasa).toFixed(2)} {moneda}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Resumen Ejecutivo (Auditoría a Detalle) */}
        <div className="mt-8 bg-[#111] rounded-xl border border-gray-700 p-6 shadow-2xl">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#00dddd] border-b border-gray-700 pb-2">
            📊 Resumen Ejecutivo (Auditoría a Detalle)
          </h2>
          
          <div className="space-y-4 text-gray-300">
            <p>
              <strong className="text-white">1. Estado Actual:</strong> Actualmente tienes un portafolio de <strong className="text-[#00dddd]">{motor.total_parcelas} parcelas</strong>. Generas un promedio de <strong className="text-green-400">{abDiarios} AB diarios</strong> (jugando gratis).
            </p>
            <p>
              <strong className="text-white">2. Camino hacia tu Meta Financiera:</strong> Para alcanzar tu meta de ganar exactamente <strong className="text-orange-400">${meta.toFixed(2)} USD cada 24 horas</strong>, necesitas poseer un total de <strong className="text-white">{parcelasMeta} parcelas</strong>. Por lo tanto, te faltan exactamente <strong className="text-orange-400">{faltantesMeta} parcelas</strong> para lograr tu objetivo.
            </p>
            <p>
              <strong className="text-white">3. Cuidado con los Límites (Tiers):</strong> Sin embargo, antes de llegar a esa meta, te toparás con un límite del sistema (Tier) en las <strong className="text-pink-400">{siguiente_tramo} parcelas</strong>. Te faltan <strong className="text-white">{faltantesTier} parcelas</strong> para llegar a este muro. Una vez que llegues ahí, <strong className="text-red-400">debes dejar de comprar parcelas individuales</strong> y ahorrar AB hasta poder saltar de golpe al siguiente Tier.
            </p>

            <div className="mt-4 p-4 bg-[#1a1a1a] rounded-lg border border-yellow-600/30">
              <h3 className="text-yellow-500 font-bold mb-2 flex items-center gap-2">⭐ 4. El Acelerador: Explorer Club (Pase de Suscripción)</h3>
              <p className="text-sm leading-relaxed">
                Si mantienes tu ritmo actual jugando 100% gratis, tardarás aprox. <strong className="text-white">{diasMetaF2p.toFixed(1)} días</strong> en llegar a tu meta de ingresos. Pero, si adquieres el Pase <em>Explorer Club</em>, tu generación de AB explotará y reducirás tu tiempo de espera a solo <strong className="text-yellow-400">{diasMetaEc.toFixed(1)} días</strong>, ahorrándote <strong className="text-green-400">{ahorroEc.toFixed(1)} días de farmeo</strong> en el proceso.
              </p>
            </div>
          </div>
        </div>

        {/* AI Assistant */}
        <div className="mt-8 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-xl border border-purple-500/30 p-6">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-purple-400">
            🤖 Tu Asistente de IA (Powered by Morph LLM)
          </h2>
          <p className="text-gray-300 mb-4 text-sm">
            Deja que nuestra Inteligencia Artificial analice tu portafolio de {motor.total_parcelas} parcelas para darte la estrategia óptima garantizada.
          </p>
          
          <button 
            onClick={handleGenerateAI}
            disabled={aiLoading}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-6 rounded-lg w-full transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          >
            {aiLoading ? "Analizando variables matemáticas..." : "✨ Generar Estrategia Optimizada"}
          </button>

          {aiError && (
            <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
              {aiError}
            </div>
          )}

          {aiAdvice && (
            <div className="mt-6 p-6 bg-[#1a1a1a] rounded-lg border border-purple-500/20 text-gray-200 leading-relaxed" dangerouslySetInnerHTML={{__html: aiAdvice}}>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

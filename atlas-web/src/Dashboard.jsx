import React from 'react';

export default function Dashboard(props) {
    return (
        <main className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 relative z-10 w-full min-h-screen">
        <main id="dashboard-view" className="max-w-7xl mx-auto px-4 py-6 space-y-6 relative z-10 block">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="holographic-card p-6 rounded-xl flex flex-col justify-between min-h-[140px]">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">ESTIMADO 30 DÍAS</span>
                    <span className="material-symbols-outlined text-gold">payments</span>
                </div>
                <div className="mt-2">
                    <div className="text-2xl font-bold text-gold">$12.45</div>
                    <div className="text-[10px] text-cyan mt-1 font-bold" id="loc-est-mes" style={{display: none;}}></div>
                    <div className="text-[10px] text-gray-400 mt-1">ACUMULACIÓN ESTIMADA</div>
                </div>
            </div>
            
            <div className="holographic-card p-6 rounded-xl flex flex-col justify-between min-h-[140px]">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">RENTA DIARIA</span>
                    <span className="material-symbols-outlined text-gold">trending_up</span>
                </div>
                <div className="mt-2">
                    <div className="text-2xl font-bold text-gold">$0.415</div>
                    <div className="text-[10px] text-cyan mt-1 font-bold" id="loc-dia" style={{display: none;}}></div>
                    <div className="text-[10px] text-gray-400 mt-1">CÁLCULO POR DÍA</div>
                </div>
            </div>

            <div className="holographic-card p-6 rounded-xl flex flex-col justify-between min-h-[140px]">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 cursor-help" title="El multiplicador actual que obtienes al ver un anuncio (Boost).">MULTIPLICADOR BOOST</span>
                    <span className="material-symbols-outlined text-cyan cursor-help" title="El multiplicador de tus ganancias por ver publicidad">rocket_launch</span>
                </div>
                <div className="mt-2">
                    <div className="text-2xl font-bold text-cyan">150x</div>
                    <div className="text-[10px] text-gray-400 mt-1">SEGÚN TU TIER ACTUAL</div>
                </div>
            </div>

            <div className="holographic-card p-6 rounded-xl flex flex-col justify-between min-h-[140px]">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400 cursor-help" title="El bono permanente a toda tu renta por coleccionar insignias.">BONO PASAPORTE</span>
                    <span className="material-symbols-outlined text-cyan cursor-help" title="Bono base según tu Nivel de Pasaporte">verified</span>
                </div>
                <div className="mt-2">
                    <div className="text-2xl font-bold text-cyan">5%</div>
                    <div className="text-[10px] text-gray-400 mt-1 uppercase">11 BADGES COLLECTED</div>
                </div>
            </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="holographic-card p-6 rounded-xl lg:col-span-1 flex flex-col">
                <h3 className="text-lg font-bold text-cyan mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined">pie_chart</span> Distribución de Tierras
                </h3>
                <div className="flex-grow flex items-center justify-center relative py-4">
                    <svg className="w-40 h-40 transform -rotate-90" viewbox="0 0 36 36">
                        <path className="text-neutral-800/60" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="100, 100" stroke-width="3"></path>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-white">150</span>
                        <span className="text-[10px] text-gray-400">PARCELAS TOTALES</span>
                    </div>
                </div>
                <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan"></span> Común</span>
                        <span className="font-bold text-gray-200">75 (50%)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-white"></span> Rara</span>
                        <span className="font-bold text-gray-200">45 (30%)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gold"></span> Épica</span>
                        <span className="font-bold text-gray-200">22 (15%)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-teal-400"></span> Legendaria</span>
                        <span className="font-bold text-gray-200">8 (5%)</span>
                    </div>
                </div>
            </div>

            <div className="holographic-card p-6 rounded-xl lg:col-span-2 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-cyan flex items-center gap-2">
                        <span className="material-symbols-outlined">show_chart</span> Estimaciones Futuras (USD)
                    </h3>
                    <input type="hidden" id="currencySelector" value="MONEDA_INYECCION_JS"/>
                </div>
                
                <div className="grid grid-cols-3 gap-4 my-auto">
                    <div className="p-4 bg-black/40 rounded-lg border border-white/5">
                        <div className="text-[10px] text-gray-400 mb-1">PROMEDIO SEMANAL</div>
                        <div className="text-xl font-bold text-gold" id="usd-sem">$VAL_SEM_USD</div>
                        <div className="text-xs text-cyan mt-1 font-bold tracking-wide" id="loc-sem" style={{display: none;}}></div>
                    </div>
                    <div className="p-4 bg-black/40 rounded-lg border border-white/5">
                        <div className="text-[10px] text-gray-400 mb-1">PROMEDIO MENSUAL</div>
                        <div className="text-xl font-bold text-gold" id="usd-men">$VAL_MEN_USD</div>
                        <div className="text-xs text-cyan mt-1 font-bold tracking-wide" id="loc-men" style={{display: none;}}></div>
                    </div>
                    <div className="p-4 bg-black/40 rounded-lg border border-white/5">
                        <div className="text-[10px] text-gray-400 mb-1">PROMEDIO ANUAL</div>
                        <div className="text-xl font-bold text-gold" id="usd-anu">$VAL_ANU_USD</div>
                        <div className="text-xs text-cyan mt-1 font-bold tracking-wide" id="loc-anu" style={{display: none;}}></div>
                    </div>
                </div>
                <div className="mt-6 p-4 bg-cyan/5 rounded-lg border border-cyan/20">
                    <p className="text-xs text-gray-300 leading-relaxed">
                        💡 <strong>Nota del Desarrollador:</strong> Los cálculos consideran las tasas de renta oficiales por segundo. Usa el selector superior para ver el cambio inmediato a tu moneda local.
                    </p>
                </div>
            </div>
        </section>
    </main>
        </main>
    );
}

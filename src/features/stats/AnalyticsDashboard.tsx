import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
    calculateProfitWithBoostHours,
    calculateROI,
    formatCurrency,
    getNextMilestone,
    getAdBoostMultiplier,
    calculateTierJumpStrategy
} from '../../utils/calculations';
import ProfitChart from '../../components/charts/ProfitChart';
import ParcelDistributionChart from '../../components/charts/ParcelDistributionChart';
import { AITacticalAdvisor } from '../../components/ui/AITacticalAdvisor';
import { TrendingUp, Award, MapPin, DollarSign, PieChart, Zap, AlertTriangle, Layers, Brain } from 'lucide-react';

const AnalyticsDashboard: React.FC = () => {
    const { userData, boostHours } = useData();

    const totalParcels = userData.common + userData.rare + userData.epic + userData.legendary;
    const dynamicAdBoost = useMemo(() => getAdBoostMultiplier(totalParcels), [totalParcels]);

    // Calculate profits based on context data and real dynamic tier multiplier
    const profit = useMemo(() => {
        return calculateProfitWithBoostHours(userData, userData.badges, dynamicAdBoost, boostHours);
    }, [userData, dynamicAdBoost, boostHours]);

    // Calculate ROI
    const roiData = useMemo(() => {
        return calculateROI(userData, userData.badges, dynamicAdBoost, boostHours);
    }, [userData, dynamicAdBoost, boostHours]);

    const nextMilestone = useMemo(() => {
        return getNextMilestone(totalParcels, userData.badges);
    }, [totalParcels, userData.badges]);

    // Tier Jump Savings Engine calculation
    const tierJumpInfo = useMemo(() => {
        return calculateTierJumpStrategy(userData, userData.badges, boostHours);
    }, [userData, boostHours]);

    return (
        <div className="analytics-dashboard animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        Panel de Control Táctico
                    </h2>
                    <p className="text-xs text-muted">
                        Resumen financiero en tiempo real • Tier Actual: <span className="text-accent font-bold">{dynamicAdBoost}x</span>
                    </p>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Daily Income */}
                <div className="glass-card p-4 border-l-4 border-emerald-500 hover:border-emerald-400 transition-all">
                    <div className="flex items-center gap-3 text-emerald-400 mb-2">
                        <DollarSign size={20} />
                        <span className="font-bold text-sm opacity-90">Ingreso Diario (Real)</span>
                    </div>
                    <div className="text-2xl font-bold text-white tracking-wider font-mono">
                        {formatCurrency(profit.daily, 4)}
                    </div>
                    <div className="text-xs text-muted mt-1 flex justify-between items-center">
                        <span>Boost {boostHours}h ({dynamicAdBoost}x)</span>
                        <span className="text-emerald-400 font-bold">{formatCurrency(profit.daily * 30, 2)}/mes</span>
                    </div>
                </div>

                {/* Monthly Income */}
                <div className="glass-card p-4 border-l-4 border-blue-500 hover:border-blue-400 transition-all">
                    <div className="flex items-center gap-3 text-blue-400 mb-2">
                        <TrendingUp size={20} />
                        <span className="font-bold text-sm opacity-90">Ingreso Mensual (Ponderado)</span>
                    </div>
                    <div className="text-2xl font-bold text-white tracking-wider font-mono">
                        {formatCurrency(profit.monthly, 2)}
                    </div>
                    <div className="text-xs text-muted mt-1">Incluye eventos SRB (Super Boost)</div>
                </div>

                {/* Total Parcels */}
                <div className="glass-card p-4 border-l-4 border-purple-500 hover:border-purple-400 transition-all">
                    <div className="flex items-center gap-3 text-purple-400 mb-2">
                        <MapPin size={20} />
                        <span className="font-bold text-sm opacity-90">Total Parcelas</span>
                    </div>
                    <div className="text-2xl font-bold text-white tracking-wider font-mono">
                        {totalParcels}
                    </div>
                    <div className="text-xs text-muted mt-1">
                        C:{userData.common} R:{userData.rare} E:{userData.epic} <span className="text-amber-400 font-bold">L:{userData.legendary}</span>
                    </div>
                </div>

                {/* Badges */}
                <div className="glass-card p-4 border-l-4 border-amber-500 hover:border-amber-400 transition-all">
                    <div className="flex items-center gap-3 text-amber-400 mb-2">
                        <Award size={20} />
                        <span className="font-bold text-sm opacity-90">Passport Level</span>
                    </div>
                    <div className="text-2xl font-bold text-white tracking-wider font-mono">
                        {userData.badges} Insignias
                    </div>
                    <div className="text-xs text-muted mt-1">
                        Bonus pasivo: <span className="text-amber-300 font-bold">+{Math.round((profit.daily / (calculateProfitWithBoostHours(userData, 0, dynamicAdBoost, boostHours).daily || 1) - 1) * 100)}% permanente</span>
                    </div>
                </div>
            </div>

            {/* Tier Drop Warning & Savings Engine Card */}
            {tierJumpInfo && (
                <div className={`glass-card p-5 border-l-4 ${
                    tierJumpInfo.isAtMaxTier 
                        ? 'border-yellow-500 bg-yellow-950/20' 
                        : 'border-blue-500 bg-slate-900/60'
                }`}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${tierJumpInfo.isAtMaxTier ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                <AlertTriangle size={22} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    Estrategia de Tier Drop ({tierJumpInfo.currentMultiplier}x $\rightarrow$ {tierJumpInfo.nextTierMultiplier}x)
                                </h3>
                                <p className="text-xs text-gray-300 mt-0.5">
                                    Límite actual de Tier: <strong className="text-white">{tierJumpInfo.currentMaxParcels} parcelas</strong>. 
                                    {tierJumpInfo.isAtMaxTier 
                                        ? ' ⚠️ Estás en el tope exacto del Tier. ¡No compres 1 sola parcela sola!' 
                                        : ` Te faltan ${tierJumpInfo.currentMaxParcels - totalParcels} parcelas para el tope del Tier.`}
                                </p>
                            </div>
                        </div>

                        <div className="text-right hidden sm:block">
                            <span className="text-xs text-muted block uppercase">AB Necesarios para Saltar Tier</span>
                            <span className="text-xl font-bold text-emerald-400 font-mono">
                                {tierJumpInfo.abNeededForJump.toLocaleString()} AB
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="bg-slate-800/60 p-2.5 rounded border border-white/5">
                            <span className="text-muted block mb-1">Si compras 1 parcela extra:</span>
                            <span className="text-red-400 font-bold flex items-center gap-1">
                                Caída de ingreso: -{formatCurrency(tierJumpInfo.dropAmountDaily, 3)}/día
                            </span>
                        </div>

                        <div className="bg-slate-800/60 p-2.5 rounded border border-white/5">
                            <span className="text-muted block mb-1">Próximo Salto Recomendado:</span>
                            <span className="text-emerald-400 font-bold">
                                Saltar de {totalParcels} $\rightarrow$ {tierJumpInfo.nextTierMax} Parcelas
                            </span>
                        </div>

                        <div className="bg-slate-800/60 p-2.5 rounded border border-white/5">
                            <span className="text-muted block mb-1">Atlas Bucks (AB) Totales:</span>
                            <span className="text-yellow-400 font-bold">
                                Save {tierJumpInfo.parcelsNeededForJump} parcelas ({tierJumpInfo.abNeededForJump} AB)
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* ROI Indicators */}
            {totalParcels > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-card p-4 border-l-4 border-cyan-500">
                        <div className="flex items-center gap-2 text-cyan-400 mb-2">
                            <Zap size={18} />
                            <span className="font-bold text-sm opacity-90">Break-even (Punto de Retorno)</span>
                        </div>
                        <div className="text-xl font-bold text-white font-mono">
                            {Math.ceil(roiData.daysToBreakEven)} días
                        </div>
                        <div className="text-xs text-muted mt-1">
                            {(roiData.monthsToBreakEven).toFixed(1)} meses estimados
                        </div>
                    </div>

                    <div className="glass-card p-4 border-l-4 border-pink-500">
                        <div className="flex items-center gap-2 text-pink-400 mb-2">
                            <TrendingUp size={18} />
                            <span className="font-bold text-sm opacity-90">ROI 30 días</span>
                        </div>
                        <div className={`text-xl font-bold font-mono ${roiData.roi30Days >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {roiData.roi30Days.toFixed(2)}%
                        </div>
                        <div className="text-xs text-muted mt-1">
                            {formatCurrency(roiData.monthlyIncome, 2)} retenido
                        </div>
                    </div>

                    <div className="glass-card p-4 border-l-4 border-orange-500">
                        <div className="flex items-center gap-2 text-orange-400 mb-2">
                            <TrendingUp size={18} />
                            <span className="font-bold text-sm opacity-90">ROI 1 Año</span>
                        </div>
                        <div className={`text-xl font-bold font-mono ${roiData.roi365Days >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {roiData.roi365Days.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted mt-1">
                            {formatCurrency(roiData.yearlyIncome, 2)} proyectado
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-2 glass-card p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-400" />
                        Proyección de Ganancias Integrada
                    </h3>
                    <ProfitChart dailyProfit={profit.daily} />
                </div>

                {/* Next Milestone Card */}
                <div className="glass-card p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <MapPin size={18} className="text-amber-400" />
                            Siguiente Milestone Táctico
                        </h3>

                        <div className="bg-slate-800/50 rounded-lg p-4 border border-white/5 space-y-3">
                            <p className="text-sm text-gray-200 font-bold">
                                {nextMilestone.description}
                            </p>

                            <ul className="space-y-2 text-xs">
                                <li className="flex justify-between items-center text-gray-400 border-b border-white/5 pb-1">
                                    <span>Meta Parcelas:</span>
                                    <span className="font-bold text-white font-mono">{nextMilestone.targetParcels}</span>
                                </li>
                                <li className="flex justify-between items-center text-gray-400 border-b border-white/5 pb-1">
                                    <span>Meta Insignias:</span>
                                    <span className="font-bold text-amber-400 font-mono">{nextMilestone.targetBadges}</span>
                                </li>
                                <li className="flex justify-between items-center text-gray-400">
                                    <span>Atlas Bucks (AB) Requeridos:</span>
                                    <span className="font-bold text-emerald-400 font-mono">+{nextMilestone.abNeeded.toLocaleString()} AB</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 text-xs text-center text-muted">
                        Basado en ruta F2P optimizada
                    </div>
                </div>
            </div>

            {/* Parcel Distribution */}
            {totalParcels > 0 && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <PieChart size={18} className="text-purple-400" />
                        Distribución y Desglose de Raridad
                    </h3>
                    <div className="relative">
                        <ParcelDistributionChart parcels={userData} />
                    </div>
                </div>
            )}

            {/* AI Tactical Advisor — always visible */}
            <div className="glass-card p-6 border border-emerald-500/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Brain size={18} className="text-emerald-400" />
                    Asesor Táctico con IA
                </h3>
                <AITacticalAdvisor />
            </div>
        </div>
    );
};

export default AnalyticsDashboard;



import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { calculateProfitWithBoostHours, calculateTimeToGoal, formatCurrency, getAdBoostMultiplier } from '../../utils/calculations';
import { Target, Calendar, TrendingUp, Zap, AlertCircle } from 'lucide-react';
import './TimeToGoal.css';

const TimeToGoal: React.FC = () => {
    const { userData, boostHours } = useData();

    const [currentAmount, setCurrentAmount] = useState<number>(0);
    const [goalAmount, setGoalAmount] = useState<number>(100);

    // Calculate current daily income
    const dailyIncome = useMemo(() => {
        const totalParcels = userData.common + userData.rare + userData.epic + userData.legendary;
        const adBoost = getAdBoostMultiplier(totalParcels);
        const result = calculateProfitWithBoostHours(userData, userData.badges, adBoost, boostHours);
        return result.daily;
    }, [userData, boostHours]);

    // Calculate time to goal
    const timeToGoal = useMemo(() => {
        return calculateTimeToGoal(currentAmount, goalAmount, dailyIncome);
    }, [currentAmount, goalAmount, dailyIncome]);

    // Calculate projected date
    const projectedDate = useMemo(() => {
        if (timeToGoal.days === Infinity) return null;
        const date = new Date();
        date.setDate(date.getDate() + Math.ceil(timeToGoal.days));
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }, [timeToGoal.days]);

    // Calculate progress percentage
    const progressPercentage = useMemo(() => {
        if (goalAmount === 0) return 0;
        return Math.min((currentAmount / goalAmount) * 100, 100);
    }, [currentAmount, goalAmount]);

    // Calculate how much more income needed to reach goal faster
    const incomeNeededForFasterGoal = useMemo(() => {
        const desiredDays = 30; // Target: reach goal in 30 days
        const remaining = Math.max(0, goalAmount - currentAmount);
        const requiredDailyIncome = remaining / desiredDays;
        return Math.max(0, requiredDailyIncome - dailyIncome);
    }, [currentAmount, goalAmount, dailyIncome]);

    return (
        <div className="time-to-goal animate-fade-in">
            <div className="header mb-6">
                <div className="flex items-center gap-3">
                    <Target className="text-accent" size={28} />
                    <h2 className="text-2xl font-bold text-white">Calculadora de Tiempo a Meta</h2>
                </div>
                <p className="text-muted mt-2">Calcula cuánto tiempo te tomará alcanzar tu objetivo financiero</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Input Section */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Configuración</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-muted uppercase block mb-2">
                                    Cantidad Actual (USD)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-mono">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={currentAmount}
                                        onChange={(e) => setCurrentAmount(parseFloat(e.target.value) || 0)}
                                        className="glass-input w-full pl-8 font-mono"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-muted uppercase block mb-2">
                                    Meta (USD)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-mono">$</span>
                                    <input
                                        type="number"
                                        step="1"
                                        value={goalAmount}
                                        onChange={(e) => setGoalAmount(parseFloat(e.target.value) || 0)}
                                        className="glass-input w-full pl-8 font-mono"
                                        placeholder="100.00"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <label className="text-xs text-muted uppercase block mb-2">
                                    Ingreso Diario Actual
                                </label>
                                <div className="glass-input bg-glass-dark text-success font-bold font-mono">
                                    {formatCurrency(dailyIncome)}
                                </div>
                                <p className="text-xs text-muted mt-1">
                                    Con boost {boostHours}h/día
                                </p>
                            </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="mt-6 pt-4 border-t border-white/10">
                            <label className="text-xs text-muted uppercase block mb-2">
                                Metas Rápidas
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {[50, 100, 500, 1000].map(amount => (
                                    <button
                                        key={amount}
                                        onClick={() => setGoalAmount(amount)}
                                        className="px-3 py-2 bg-glass-dark hover:bg-glass-border text-white text-sm rounded transition-colors"
                                    >
                                        ${amount}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Progress Bar */}
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-bold text-white">Progreso Actual</h3>
                            <span className="text-accent font-bold">{progressPercentage.toFixed(1)}%</span>
                        </div>

                        <div className="relative h-8 bg-slate-800/50 rounded-full overflow-hidden border border-white/10">
                            <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500 flex items-center justify-end pr-2"
                                style={{ width: `${progressPercentage}%` }}
                            >
                                {progressPercentage > 10 && (
                                    <span className="text-white text-xs font-bold">
                                        {formatCurrency(currentAmount)}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between mt-2 text-xs text-muted">
                            <span>{formatCurrency(currentAmount)}</span>
                            <span>{formatCurrency(goalAmount)}</span>
                        </div>
                    </div>

                    {/* Time Estimate */}
                    <div className="glass-card p-6 border-l-4 border-emerald-500">
                        <div className="flex items-center gap-3 mb-4">
                            <Calendar className="text-emerald-400" size={24} />
                            <h3 className="text-xl font-bold text-white">Tiempo Estimado</h3>
                        </div>

                        {timeToGoal.days === Infinity ? (
                            <div className="text-center py-8">
                                <AlertCircle className="text-yellow-400 mx-auto mb-3" size={48} />
                                <p className="text-yellow-400 font-bold mb-2">Ingreso Insuficiente</p>
                                <p className="text-muted text-sm">
                                    Tu ingreso diario actual es muy bajo para alcanzar esta meta.
                                    Considera aumentar tus parcelas o badges.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="text-center mb-6">
                                    <div className="text-5xl font-bold text-emerald-400 mb-2">
                                        {timeToGoal.formattedTime}
                                    </div>
                                    {projectedDate && (
                                        <div className="text-muted">
                                            Fecha estimada: <span className="text-white font-medium">{projectedDate}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5 text-center">
                                        <div className="text-2xl font-bold text-white">{Math.ceil(timeToGoal.days)}</div>
                                        <div className="text-xs text-muted uppercase">Días</div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5 text-center">
                                        <div className="text-2xl font-bold text-white">{Math.ceil(timeToGoal.weeks)}</div>
                                        <div className="text-xs text-muted uppercase">Semanas</div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5 text-center">
                                        <div className="text-2xl font-bold text-white">{Math.ceil(timeToGoal.months)}</div>
                                        <div className="text-xs text-muted uppercase">Meses</div>
                                    </div>
                                    <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5 text-center">
                                        <div className="text-2xl font-bold text-white">{timeToGoal.years.toFixed(1)}</div>
                                        <div className="text-xs text-muted uppercase">Años</div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Acceleration Suggestions */}
                    {timeToGoal.days !== Infinity && timeToGoal.days > 30 && (
                        <div className="glass-card p-6 border-l-4 border-blue-500">
                            <div className="flex items-center gap-3 mb-4">
                                <Zap className="text-blue-400" size={24} />
                                <h3 className="text-lg font-bold text-white">Acelera tu Meta</h3>
                            </div>

                            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                                <p className="text-sm text-blue-300 mb-3">
                                    💡 Para alcanzar tu meta en <strong>30 días</strong>, necesitarías:
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted text-sm">Ingreso diario adicional:</span>
                                    <span className="text-blue-400 font-bold font-mono">
                                        +{formatCurrency(incomeNeededForFasterGoal)}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2 text-sm">
                                <p className="text-muted">
                                    <TrendingUp className="inline mr-2" size={14} />
                                    Aumenta tus parcelas o badges para incrementar tu ingreso diario
                                </p>
                                <p className="text-muted">
                                    <Zap className="inline mr-2" size={14} />
                                    Maximiza tus horas de boost diarias
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TimeToGoal;

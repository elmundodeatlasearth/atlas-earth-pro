import React, { useState, useCallback, useMemo } from 'react';
import { calculateRequirementsForTarget, calculateOptimalStrategy, getNextMilestone, formatCurrency } from '../../utils/calculations';
import { validateDailyTarget, LIMITS } from '../../utils/validation';
import { useDebounce } from '../../hooks/useDebounce';
import { Target, TrendingUp, AlertCircle, MapPin, CheckCircle2 } from 'lucide-react';
import './GoalPlanner.css';

interface GoalPlannerProps {
    currentParcels: number;
    currentBadges: number;
    boostHours: number;
}

const GoalPlanner: React.FC<GoalPlannerProps> = React.memo(({ currentParcels, currentBadges, boostHours }) => {
    const [targetDaily, setTargetDaily] = useState<number>(1.00);
    const [showStrategy, setShowStrategy] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const debouncedTarget = useDebounce(targetDaily, 300);

    // Calculate basic requirements
    const result = useMemo(() => {
        if (debouncedTarget <= 0) return null;
        return calculateRequirementsForTarget(debouncedTarget, currentParcels, currentBadges, boostHours);
    }, [debouncedTarget, currentParcels, currentBadges, boostHours]);

    // Calculate optimal F2P strategy
    const strategy = useMemo(() => {
        if (!showStrategy || debouncedTarget <= 0) return null;
        return calculateOptimalStrategy(debouncedTarget, currentParcels, currentBadges);
    }, [debouncedTarget, currentParcels, currentBadges, showStrategy]);

    // Get next milestone recommendation
    const nextMilestone = useMemo(() => {
        return getNextMilestone(currentParcels, currentBadges);
    }, [currentParcels, currentBadges]);

    const handleTargetChange = useCallback((value: string) => {
        const numValue = parseFloat(value) || 0;

        const validation = validateDailyTarget(numValue);
        if (!validation.valid) {
            setErrors(prev => ({ ...prev, target: validation.error || '' }));
        } else {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.target;
                return newErrors;
            });
        }

        setTargetDaily(numValue);
    }, []);

    return (
        <div className="goal-planner glass-card p-lg animate-fade-in h-full">
            <div className="header flex items-center gap-sm mb-lg">
                <Target className="text-accent" size={24} />
                <h2 className="font-xl font-bold text-white">Objetivo: ¿Qué necesito?</h2>
            </div>

            <div className="input-group mb-md relative">
                <label className="text-muted font-xs uppercase">Meta de Dólares (USD) por día</label>
                <div className="relative mt-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-mono text-lg">$</span>
                    <input
                        type="number"
                        step="0.10"
                        value={targetDaily}
                        onChange={(e) => handleTargetChange(e.target.value)}
                        className="glass-input w-full p-sm pl-8 font-mono text-lg"
                        placeholder="1.00"
                        min={LIMITS.DAILY_TARGET.MIN}
                        max={LIMITS.DAILY_TARGET.MAX}
                    />
                </div>
                {errors.target && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.target}
                    </p>
                )}
            </div>

            {/* Next Milestone Recommendation */}
            <div className="mb-lg p-md rounded-md bg-blue-900/20 border border-blue-500/30">
                <div className="flex items-center gap-2 mb-2">
                    <MapPin size={16} className="text-blue-400" />
                    <span className="text-blue-300 font-bold text-sm">Siguiente Milestone F2P</span>
                </div>
                <p className="text-white text-sm mb-2">{nextMilestone.description}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {nextMilestone.parcelsNeeded > 0 && (
                        <div>
                            <span className="text-muted block">Parcelas necesarias:</span>
                            <span className="text-blue-400 font-bold">+{nextMilestone.parcelsNeeded}</span>
                        </div>
                    )}
                    {nextMilestone.badgesNeeded > 0 && (
                        <div>
                            <span className="text-muted block">Insignias necesarias:</span>
                            <span className="text-blue-400 font-bold">+{nextMilestone.badgesNeeded}</span>
                        </div>
                    )}
                </div>
            </div>

            {result && (
                <div className="requirements-card bg-slate-800/80 p-md rounded-md border border-glass-border animate-slide-up">
                    <div className="flex items-center gap-xs text-muted font-sm mb-md pb-xs border-b border-white/10">
                        <TrendingUp size={16} />
                        <span>Para ganar <strong>${targetDaily.toFixed(2)}/día</strong> (con boost <strong>{boostHours}h/día</strong>):</span>
                    </div>

                    <div className="grid grid-cols-3 gap-sm mb-md">
                        <div className="text-left">
                            <span className="text-warning block font-xs uppercase mb-xs">Total Requerido</span>
                            <div className="font-bold text-warning">{result.parcels} Parcelas</div>
                            <div className="font-bold text-warning">{result.badges} Insignias</div>
                        </div>
                        <div className="text-left border-l border-white/10 pl-sm">
                            <span className="text-muted block font-xs uppercase mb-xs">Tienes (Actual)</span>
                            <div className="text-blue-400">{currentParcels} Parcelas</div>
                            <div className="text-blue-400">{currentBadges} Insignias</div>
                        </div>
                        <div className="text-left bg-slate-900/50 p-xs rounded border border-white/5">
                            <span className="text-white block font-xs uppercase mb-xs font-bold">TE FALTAN</span>
                            <div className={`font-bold ${result.shortfallParcels > 0 ? 'text-success' : 'text-muted'}`}>
                                {result.shortfallParcels} Parcelas
                            </div>
                            <div className="font-bold text-muted">0 Insignias</div>
                        </div>
                    </div>

                    {/* Strategy Toggle */}
                    <button
                        onClick={() => setShowStrategy(!showStrategy)}
                        className="w-full text-xs text-accent hover:text-white transition-colors flex items-center justify-center gap-2 py-2 rounded bg-glass-dark hover:bg-glass-border mb-md"
                    >
                        <MapPin size={14} />
                        {showStrategy ? 'Ocultar' : 'Ver'} Estrategia F2P Óptima
                    </button>

                    {/* F2P Strategy Steps */}
                    {showStrategy && strategy && (
                        <div className="mt-md p-md rounded bg-slate-900/50 border border-white/5 animate-slide-up">
                            <div className="flex items-center gap-2 mb-md pb-2 border-b border-white/10">
                                <CheckCircle2 size={16} className="text-success" />
                                <span className="text-white font-bold text-sm">Ruta Óptima F2P</span>
                            </div>
                            <div className="space-y-2">
                                {strategy.steps.map((step, index) => (
                                    <div
                                        key={index}
                                        className={`p-2.5 rounded-lg text-xs transition-all ${
                                            step.isCompleted
                                                ? 'bg-emerald-950/30 border border-emerald-500/30 opacity-70'
                                                : step.isCurrent
                                                ? 'bg-amber-500/20 border border-amber-500/50 shadow-lg shadow-amber-900/20'
                                                : 'bg-slate-800/50 border border-white/5'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-white font-bold flex items-center gap-1.5">
                                                <span>Paso {step.step}:</span>
                                                <span className={step.isCurrent ? 'text-amber-400 font-extrabold' : 'text-gray-200'}>{step.description}</span>
                                                {step.isCompleted && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">COMPLETADO</span>}
                                                {step.isCurrent && <span className="text-[10px] bg-amber-500 text-slate-900 px-1.5 py-0.5 rounded font-bold animate-pulse">EN PROCESO</span>}
                                            </span>
                                            <span className="text-emerald-400 font-mono font-bold">{formatCurrency(step.dailyIncome, 2)}/día</span>
                                        </div>
                                        <div className="flex gap-3 text-xs text-muted mt-1">
                                            <span className="text-blue-300 font-mono">{step.parcels} parcelas</span>
                                            <span className="text-amber-300 font-mono">{step.badges} insignias</span>
                                        </div>
                                    </div>
                                ))}

                            </div>
                            <p className="text-xs text-muted mt-md opacity-70">
                                💡 Sigue estos pasos en orden para maximizar tu eficiencia F2P
                            </p>
                        </div>
                    )}

                    <p className="text-xs text-muted opacity-70 flex gap-xs items-start mt-md">
                        <AlertCircle size={12} className="mt-1 shrink-0" />
                        El cálculo usa tus <strong>{boostHours}h/día</strong> de boost reales y sigue la ruta F2P más óptima: 150 parcelas → 11 insignias → 220 parcelas, etc.
                    </p>
                </div>
            )}
        </div>
    );
});

GoalPlanner.displayName = 'GoalPlanner';

export default GoalPlanner;

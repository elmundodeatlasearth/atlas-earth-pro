import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { analyzeUserProfile, answerTacticalQuery } from '../../services/aiAdvisor';
import type { AIRecommendation } from '../../services/aiAdvisor';
import { Bot, Sparkles, ShieldCheck, Zap, HelpCircle, ArrowRight, AlertTriangle, Award, CheckCircle2, TrendingUp } from 'lucide-react';
import './AITacticalAdvisor.css';

export const AITacticalAdvisor: React.FC = () => {
    const { userData, boostHours, dailyTarget } = useData();
    const [selectedQuery, setSelectedQuery] = useState<string | null>(null);

    // Run AI Diagnosis Engine on 100% of profile data
    const diagnosis = useMemo(() => {
        return analyzeUserProfile(userData, boostHours, dailyTarget);
    }, [userData, boostHours, dailyTarget]);

    // Active Query Answer
    const activeQueryAnswer = useMemo(() => {
        if (!selectedQuery) return null;
        return answerTacticalQuery(selectedQuery, userData, boostHours, dailyTarget);
    }, [selectedQuery, userData, boostHours, dailyTarget]);

    const luckBadgeColor = 
        diagnosis.luckAnalysis.status === 'extraordinary' ? 'text-amber-400 bg-amber-500/20 border-amber-500/40' :
        diagnosis.luckAnalysis.status === 'above_average' ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40' :
        diagnosis.luckAnalysis.status === 'unlucky' ? 'text-red-400 bg-red-500/20 border-red-500/40' :
        'text-blue-400 bg-blue-500/20 border-blue-500/40';

    return (
        <div className="ai-tactical-advisor glass-card p-6 border-l-4 border-accent relative overflow-hidden animate-fade-in mb-6">
            
            {/* Background Tactical Ambient Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-emerald-400 to-amber-400 opacity-75 animate-pulse"></div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-accent/20 text-accent rounded-xl border border-accent/40 shadow-lg shadow-accent/20">
                        <Bot size={26} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-white tracking-wide">Asesor Táctico de IA</h3>
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                                <Sparkles size={10} /> 100% ONLINE
                            </span>
                        </div>
                        <p className="text-xs text-muted">Diagnóstico en tiempo real del perfil y optimización de metas</p>
                    </div>
                </div>

                {/* Account Health & Luck Badges */}
                <div className="flex items-center gap-3">
                    <div className="bg-slate-900/60 px-3 py-1.5 rounded-lg border border-white/10 text-right">
                        <span className="text-[10px] text-muted block uppercase">Salud del Perfil</span>
                        <span className="text-sm font-bold text-emerald-400 font-mono">{diagnosis.healthScore}/100</span>
                    </div>

                    <div className={`px-3 py-1.5 rounded-lg border text-right ${luckBadgeColor}`}>
                        <span className="text-[10px] opacity-80 block uppercase">Suerte de Renta</span>
                        <span className="text-sm font-bold font-mono">
                            {diagnosis.luckAnalysis.luckPercentage >= 0 ? '+' : ''}{diagnosis.luckAnalysis.luckPercentage}%
                        </span>
                    </div>
                </div>
            </div>

            {/* AI Diagnosis Banner */}
            <div className="bg-slate-900/70 p-4 rounded-xl border border-white/10 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="text-xs text-accent font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <ShieldCheck size={14} /> Clasificación: <span className="text-white">{diagnosis.profileRating}</span>
                    </div>
                    <p className="text-sm text-gray-200">
                        {diagnosis.luckAnalysis.message}
                    </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                    <span className="text-xs text-muted block uppercase">Siguiente Movimiento IA</span>
                    <span className="text-xs font-bold text-amber-300 max-w-xs block">
                        {diagnosis.nextOptimalMove}
                    </span>
                </div>
            </div>

            {/* AI Actionable Recommendations */}
            <div className="mb-6">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Zap size={16} className="text-amber-400" />
                    Recomendaciones Tácticas Personalizadas ({diagnosis.recommendations.length})
                </h4>

                {diagnosis.recommendations.length === 0 ? (
                    <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
                        <CheckCircle2 size={20} />
                        <span>¡Tu cuenta está completamente optimizada! Sigue acumulando Atlas Bucks para mantener el ritmo perfecto.</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {diagnosis.recommendations.map(rec => (
                            <div 
                                key={rec.id}
                                className={`p-4 rounded-xl border transition-all ${
                                    rec.priority === 'HIGH' 
                                        ? 'bg-amber-950/20 border-amber-500/40' 
                                        : 'bg-slate-800/50 border-white/10'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                                        rec.priority === 'HIGH' ? 'bg-amber-500 text-slate-900' : 'bg-blue-500/20 text-blue-300'
                                    }`}>
                                        {rec.priority === 'HIGH' ? 'PRIORIDAD ALTA' : 'RECOMENDADO'}
                                    </span>
                                    {rec.abRequired && (
                                        <span className="text-xs text-emerald-400 font-mono font-bold">
                                            {rec.abRequired.toLocaleString()} AB
                                        </span>
                                    )}
                                </div>
                                <h5 className="text-sm font-bold text-white mb-1">{rec.title}</h5>
                                <p className="text-xs text-gray-300 mb-3">{rec.description}</p>
                                
                                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                                    <span className="text-accent font-medium flex items-center gap-1">
                                        <ArrowRight size={12} /> {rec.impact}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Interactive AI Query Assistant */}
            <div className="pt-4 border-t border-white/10">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <HelpCircle size={16} className="text-blue-400" />
                    Consultar a la IA sobre mi Cuenta
                </h4>

                <div className="flex flex-wrap gap-2 mb-4">
                    <button
                        onClick={() => setSelectedQuery('should_buy_badges')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selectedQuery === 'should_buy_badges' 
                                ? 'bg-accent text-slate-900 font-bold' 
                                : 'bg-slate-800 hover:bg-slate-700 text-gray-300 border border-white/10'
                        }`}
                    >
                        🎖️ ¿Comprar insignias ahora?
                    </button>

                    <button
                        onClick={() => setSelectedQuery('tier_jump_timing')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selectedQuery === 'tier_jump_timing' 
                                ? 'bg-accent text-slate-900 font-bold' 
                                : 'bg-slate-800 hover:bg-slate-700 text-gray-300 border border-white/10'
                        }`}
                    >
                        📈 ¿Cuándo saltar de Tier?
                    </button>

                    <button
                        onClick={() => setSelectedQuery('luck_score_eval')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selectedQuery === 'luck_score_eval' 
                                ? 'bg-accent text-slate-900 font-bold' 
                                : 'bg-slate-800 hover:bg-slate-700 text-gray-300 border border-white/10'
                        }`}
                    >
                        🍀 Evaluar Suerte de Cuenta
                    </button>

                    <button
                        onClick={() => setSelectedQuery('reach_goal_fastest')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selectedQuery === 'reach_goal_fastest' 
                                ? 'bg-accent text-slate-900 font-bold' 
                                : 'bg-slate-800 hover:bg-slate-700 text-gray-300 border border-white/10'
                        }`}
                    >
                        🚀 Acelerar Meta Diaria
                    </button>
                </div>

                {/* AI Query Answer Result */}
                {activeQueryAnswer && (
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-accent/40 animate-slide-up space-y-2">
                        <div className="flex items-center gap-2 text-accent font-bold text-sm">
                            <Sparkles size={16} />
                            <span>{activeQueryAnswer.title}</span>
                        </div>
                        <p className="text-sm font-bold text-white">{activeQueryAnswer.answer}</p>
                        <p className="text-xs text-gray-300 leading-relaxed bg-slate-800/60 p-3 rounded-lg border border-white/5">
                            💡 <strong>Análisis IA:</strong> {activeQueryAnswer.tacticalAdvice}
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
};

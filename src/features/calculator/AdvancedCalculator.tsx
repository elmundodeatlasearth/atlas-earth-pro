import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
    calculateDetailedScenario,
    formatCurrency,
    formatCurrencyHighPrecision,
    getAdBoostMultiplier,
    BOOST_TIERS,
    calculateParcelEfficiency
} from '../../utils/calculations';
import { Zap, Activity, Edit3, TrendingUp, Info } from 'lucide-react';
import { QuickParcelModal } from '../../components/ui/QuickParcelModal';
import './AdvancedCalculator.css';

const AdvancedCalculator: React.FC = () => {
    const { userData, boostHours, setBoostHours } = useData();
    const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);

    // SRB Settings
    const [srbMultiplier, setSrbMultiplier] = useState(50);
    const [srbHours, setSrbHours] = useState(64);
    const [forceSrbAccMode, setForceSrbAccMode] = useState(false);

    // Ad Boost Override
    const [overrideBoost, setOverrideBoost] = useState(false);
    const [customBoostMultiplier, setCustomBoostMultiplier] = useState(30);

    const totalParcels = userData.common + userData.rare + userData.epic + userData.legendary;
    const autoBoostMultiplier = getAdBoostMultiplier(totalParcels);
    const activeBoostMultiplier = overrideBoost ? customBoostMultiplier : autoBoostMultiplier;

    const currentTier = BOOST_TIERS.find(t => totalParcels <= t.max);
    const nextTier = BOOST_TIERS.find(t => t.max > (currentTier?.max || 0));

    const efficiency = useMemo(
        () => calculateParcelEfficiency(userData.badges, boostHours),
        [userData.badges, boostHours]
    );

    const result = useMemo(() => {
        return calculateDetailedScenario(
            { common: userData.common, rare: userData.rare, epic: userData.epic, legendary: userData.legendary },
            userData.badges,
            boostHours,
            forceSrbAccMode,
            srbHours,
            srbMultiplier,
            activeBoostMultiplier
        );
    }, [userData, boostHours, forceSrbAccMode, srbHours, srbMultiplier, activeBoostMultiplier]);

    const daysInMonth = 365 / 12;
    const srbDays = srbHours / 24;
    const normalDays = daysInMonth - srbDays;

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Activity className="text-accent" size={26} />
                        Calculadora Avanzada &amp; Eficiencia
                    </h2>
                    <p className="text-xs text-muted mt-1">
                        Inventario:{' '}
                        <strong className="text-white">{totalParcels} Parcelas</strong>{' '}
                        ({userData.common}C, {userData.rare}R, {userData.epic}E, {userData.legendary}L) •{' '}
                        <strong className="text-amber-400">{userData.badges} Insignias</strong>
                    </p>
                </div>
                <button
                    onClick={() => setIsQuickEditOpen(true)}
                    className="px-3 py-1.5 bg-accent/20 text-accent hover:bg-accent hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-accent/30"
                >
                    <Edit3 size={14} />
                    Editar Parcelas
                </button>
            </div>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Boost Settings */}
                <div className="glass-card p-5">
                    <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <Zap className="text-yellow-400" size={18} />
                        Configuración de Boost
                    </h3>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm text-muted">Horas de Boost al día:</label>
                            <input
                                type="number"
                                value={boostHours}
                                onChange={(e) => setBoostHours(Number(e.target.value))}
                                className="glass-input w-20 text-right font-mono"
                                min="0" max="24"
                            />
                        </div>

                        <div className="flex justify-between items-center">
                            <label className="text-sm text-muted">
                                Multiplicador actual:{' '}
                                <span className="text-accent font-bold">{activeBoostMultiplier}x</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="overrideBoostCheck"
                                    checked={overrideBoost}
                                    onChange={(e) => setOverrideBoost(e.target.checked)}
                                    className="w-4 h-4 accent-accent"
                                />
                                <label htmlFor="overrideBoostCheck" className="text-xs text-muted">Forzar</label>
                                {overrideBoost && (
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={customBoostMultiplier}
                                        onChange={(e) => setCustomBoostMultiplier(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
                                        className="glass-input w-16 text-right font-mono text-xs"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <label className="text-sm font-bold text-purple-400">Super Rent Boost (SRB)</label>
                                    <span className="text-xs text-muted block">Default 50x / 64h mes</span>
                                </div>
                                <div className="space-y-2 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <span className="text-xs text-muted">Mult:</span>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={srbMultiplier}
                                            onChange={(e) => setSrbMultiplier(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
                                            className="glass-input w-16 text-right font-mono text-xs"
                                        />
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        <span className="text-xs text-muted">Horas/mes:</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="744"
                                            value={srbHours}
                                            onChange={(e) => setSrbHours(Math.min(744, Math.max(0, Number(e.target.value) || 0)))}
                                            className="glass-input w-16 text-right font-mono text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SRB Mode Control */}
                <div className="glass-card p-5 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-300 font-medium">Modo SRB Activo (50x 24/7):</span>
                        <input
                            type="checkbox"
                            checked={forceSrbAccMode}
                            onChange={(e) => setForceSrbAccMode(e.target.checked)}
                            className="w-5 h-5 accent-accent"
                        />
                    </div>
                    <p className="text-xs text-muted">
                        Activa solo para ver cuánto ganarías si todo el tiempo fuera SRB (potencial máximo).
                    </p>
                    {currentTier && (
                        <div className="mt-4 pt-4 border-t border-white/10 space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted">Tier actual:</span>
                                <span className="text-accent font-bold">{autoBoostMultiplier}x (≤{currentTier.max} parcelas)</span>
                            </div>
                            {nextTier && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted">Próximo tier:</span>
                                    <span className="text-amber-400 font-bold">{nextTier.multiplier}x (≤{nextTier.max} parcelas)</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Earnings Table */}
            <div className="glass-card p-5">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="text-emerald-400" size={18} />
                    Earnings (incluye badge boost):
                </h3>
                <div className="overflow-x-auto rounded-lg">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-emerald-900/40 text-white">
                                <th className="p-2.5 border border-emerald-700/30 text-left rounded-tl-lg">Período</th>
                                <th className="p-2.5 border border-emerald-700/30 text-right">Base</th>
                                <th className="p-2.5 border border-emerald-700/30 text-right rounded-tr-lg">
                                    Con Ad Boost{' '}
                                    <span className="text-xs font-normal opacity-75">({boostHours}h/día)</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { label: 'Por Segundo', base: result.perSecond.base, boosted: result.perSecond.boosted },
                                { label: 'Por Hora', base: result.perHour.base, boosted: result.perHour.boosted },
                                { label: 'Por Día', base: result.perDay.base, boosted: result.perDay.boosted },
                                { label: 'Por Semana', base: result.perWeek.base, boosted: result.perWeek.boosted },
                            ].map((row, i) => (
                                <tr key={row.label} className={i % 2 === 0 ? 'bg-emerald-900/10' : ''}>
                                    <td className="p-2.5 border border-white/5 font-semibold text-emerald-200">{row.label}</td>
                                    <td className="p-2.5 border border-white/5 text-right font-mono text-white">
                                        {formatCurrencyHighPrecision(row.base)}
                                    </td>
                                    <td className="p-2.5 border border-white/5 text-right font-mono text-yellow-400 font-bold">
                                        {formatCurrencyHighPrecision(row.boosted)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-emerald-900/30 border-t-2 border-emerald-600/50">
                                <td className="p-2.5 border border-white/5 font-bold text-white">
                                    Por Mes{' '}
                                    <span className="text-xs font-normal opacity-70">({normalDays.toFixed(2)}d + {srbDays.toFixed(2)} SRBd)</span>
                                </td>
                                <td className="p-2.5 border border-white/5 text-right font-mono text-white">
                                    {formatCurrencyHighPrecision(result.perMonth.base)}
                                </td>
                                <td className="p-2.5 border border-white/5 text-right font-mono text-yellow-300 font-bold">
                                    {formatCurrencyHighPrecision(result.perMonth.avg)}
                                </td>
                            </tr>
                            <tr className="bg-emerald-900/30">
                                <td className="p-2.5 border border-white/5 font-bold text-white">
                                    Por Año{' '}
                                    <span className="text-xs font-normal opacity-70">({(normalDays * 12).toFixed(1)}d + {(srbDays * 12).toFixed(1)} SRBd)</span>
                                </td>
                                <td className="p-2.5 border border-white/5 text-right font-mono text-white">
                                    {formatCurrencyHighPrecision(result.perYear.base)}
                                </td>
                                <td className="p-2.5 border border-white/5 text-right font-mono text-yellow-300 font-bold">
                                    {formatCurrencyHighPrecision(result.perYear.avg)}
                                </td>
                            </tr>
                            <tr className="bg-yellow-900/30 border-t-2 border-yellow-600/50">
                                <td className="p-2.5 border border-white/5 font-bold text-yellow-100">Promedio por Día</td>
                                <td className="p-2.5 border border-white/5 text-right font-mono text-yellow-100">
                                    {formatCurrency(result.perSecond.base * 86400, 3)}
                                </td>
                                <td className="p-2.5 border border-white/5 text-right font-mono text-white font-extrabold text-lg">
                                    {formatCurrency(result.perDay.avg, 3)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Additional Info & SRB Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Additional Info */}
                <div className="glass-card p-5">
                    <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <Info size={18} className="text-yellow-400" />
                        Información Adicional
                    </h3>
                    <div className="space-y-2">
                        <InfoRow label={`Pay Per Current Boost (${activeBoostMultiplier}x)`} value={result.perHour.boosted} color="green" />
                        <InfoRow label="Pay Per 6hrs Current Boost" value={result.perHour.boosted * 6} color="yellow" />
                        <InfoRow label="Pay Per Super Boost (1h)" value={result.srb.hourly} color="yellow" isSrb />
                        <InfoRow label="Pay Per 6hrs Super Boost" value={result.srb.hourly * 6} color="green" isSrb />
                    </div>
                </div>

                {/* SRB Events */}
                <div className="glass-card p-5">
                    <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <Zap size={18} className="text-orange-400" />
                        SRB (Super Rent Boost) Events
                    </h3>
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr>
                                <th className="bg-glass-dark text-muted p-2 text-left rounded-tl-lg">Tiempo</th>
                                <th className="bg-emerald-900/30 text-white p-2 text-right rounded-tr-lg">SRB Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-2 border-b border-white/5 text-muted">32 Hours Event</td>
                                <td className="p-2 border-b border-white/5 text-right font-bold text-yellow-400 font-mono">
                                    {formatCurrencyHighPrecision(result.srb.payPerEvent32h)}
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 text-muted">64 Hours Event</td>
                                <td className="p-2 text-right font-bold text-yellow-400 font-mono">
                                    {formatCurrencyHighPrecision(result.srb.payPerEvent64h)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Parcel Modal */}
            <QuickParcelModal
                isOpen={isQuickEditOpen}
                onClose={() => setIsQuickEditOpen(false)}
            />
        </div>
    );
};

// Helper component
const InfoRow: React.FC<{ label: string; value: number; color: 'green' | 'yellow'; isSrb?: boolean }> = ({ label, value, color, isSrb }) => (
    <div className={`flex justify-between items-center p-2.5 rounded-lg text-sm ${
        color === 'green' ? 'bg-emerald-900/30' : 'bg-yellow-900/20'
    } ${isSrb ? 'border border-orange-500/20' : ''}`}>
        <span className="text-muted font-medium">{label}</span>
        <span className="font-mono font-bold text-white">{formatCurrencyHighPrecision(value)}</span>
    </div>
);

export default AdvancedCalculator;

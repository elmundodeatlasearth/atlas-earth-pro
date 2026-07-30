import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { calculateProfitWithBoostHours, formatCurrency, compareScenarios, getAdBoostMultiplier } from '../../utils/calculations';
import { GitCompare, TrendingUp, Copy, RotateCcw } from 'lucide-react';
import type { Scenario } from '../../types';
import './ScenarioComparator.css';

const ScenarioComparator: React.FC = () => {
    const { userData, boostHours } = useData();

    // Initialize scenarios with current data
    const [scenario1, setScenario1] = useState<Scenario>({
        id: '1',
        name: 'Escenario Actual',
        parcels: {
            common: userData.common,
            rare: userData.rare,
            epic: userData.epic,
            legendary: userData.legendary
        },
        badges: userData.badges,
        boostHours: boostHours
    });

    const [scenario2, setScenario2] = useState<Scenario>({
        id: '2',
        name: 'Escenario Alternativo',
        parcels: {
            common: userData.common,
            rare: userData.rare,
            epic: userData.epic,
            legendary: userData.legendary
        },
        badges: userData.badges,
        boostHours: boostHours
    });

    // Calculate results for both scenarios
    const result1 = useMemo(() => {
        const total = scenario1.parcels.common + scenario1.parcels.rare + scenario1.parcels.epic + scenario1.parcels.legendary;
        const adBoost = getAdBoostMultiplier(total);
        return calculateProfitWithBoostHours(scenario1.parcels, scenario1.badges, adBoost, scenario1.boostHours);
    }, [scenario1]);

    const result2 = useMemo(() => {
        const total = scenario2.parcels.common + scenario2.parcels.rare + scenario2.parcels.epic + scenario2.parcels.legendary;
        const adBoost = getAdBoostMultiplier(total);
        return calculateProfitWithBoostHours(scenario2.parcels, scenario2.badges, adBoost, scenario2.boostHours);
    }, [scenario2]);

    // Calculate comparison
    const comparison = useMemo(() => {
        const total1 = scenario1.parcels.common + scenario1.parcels.rare + scenario1.parcels.epic + scenario1.parcels.legendary;
        const boost1 = getAdBoostMultiplier(total1);
        const total2 = scenario2.parcels.common + scenario2.parcels.rare + scenario2.parcels.epic + scenario2.parcels.legendary;
        const boost2 = getAdBoostMultiplier(total2);

        return compareScenarios(
            scenario1.parcels, scenario1.badges, boost1, scenario1.boostHours,
            scenario2.parcels, scenario2.badges, boost2, scenario2.boostHours,
            scenario1.name,
            scenario2.name
        );
    }, [scenario1, scenario2]);

    const handleCopyScenario = (from: 'current' | '1' | '2', to: '1' | '2') => {
        const sourceData = from === 'current'
            ? { parcels: userData, badges: userData.badges, boostHours }
            : from === '1' ? scenario1 : scenario2;

        const newScenario: Scenario = {
            id: to,
            name: to === '1' ? 'Escenario 1' : 'Escenario 2',
            parcels: { ...sourceData.parcels },
            badges: sourceData.badges,
            boostHours: sourceData.boostHours
        };

        if (to === '1') setScenario1(newScenario);
        else setScenario2(newScenario);
    };

    const handleResetScenarios = () => {
        handleCopyScenario('current', '1');
        handleCopyScenario('current', '2');
    };

    const updateScenario = (scenarioNum: 1 | 2, field: string, value: number) => {
        const setter = scenarioNum === 1 ? setScenario1 : setScenario2;
        setter(prev => {
            if (field === 'badges' || field === 'boostHours') {
                return { ...prev, [field]: value };
            }
            return {
                ...prev,
                parcels: { ...prev.parcels, [field]: value }
            };
        });
    };

    const totalParcels1 = scenario1.parcels.common + scenario1.parcels.rare + scenario1.parcels.epic + scenario1.parcels.legendary;
    const totalParcels2 = scenario2.parcels.common + scenario2.parcels.rare + scenario2.parcels.epic + scenario2.parcels.legendary;

    return (
        <div className="scenario-comparator animate-fade-in">
            <div className="header mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <GitCompare className="text-accent" size={28} />
                        <h2 className="text-2xl font-bold text-white">Comparador de Escenarios</h2>
                    </div>
                    <button
                        onClick={handleResetScenarios}
                        className="flex items-center gap-2 px-4 py-2 bg-glass-dark hover:bg-glass-border text-white rounded-lg transition-colors"
                    >
                        <RotateCcw size={16} />
                        Resetear
                    </button>
                </div>
                <p className="text-muted mt-2">Compara diferentes estrategias de inversión lado a lado</p>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Scenario 1 */}
                <div className="glass-card p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-4">
                        <input
                            type="text"
                            value={scenario1.name}
                            onChange={(e) => setScenario1(prev => ({ ...prev, name: e.target.value }))}
                            className="glass-input text-lg font-bold bg-transparent border-none text-white"
                        />
                        <button
                            onClick={() => handleCopyScenario('current', '1')}
                            className="text-xs text-accent hover:text-white transition-colors flex items-center gap-1"
                            title="Copiar datos actuales"
                        >
                            <Copy size={14} />
                            Copiar actual
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-muted uppercase">Comunes</label>
                                <input
                                    type="number"
                                    value={scenario1.parcels.common}
                                    onChange={(e) => updateScenario(1, 'common', parseInt(e.target.value) || 0)}
                                    className="glass-input w-full mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted uppercase">Raras</label>
                                <input
                                    type="number"
                                    value={scenario1.parcels.rare}
                                    onChange={(e) => updateScenario(1, 'rare', parseInt(e.target.value) || 0)}
                                    className="glass-input w-full mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted uppercase">Épicas</label>
                                <input
                                    type="number"
                                    value={scenario1.parcels.epic}
                                    onChange={(e) => updateScenario(1, 'epic', parseInt(e.target.value) || 0)}
                                    className="glass-input w-full mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted uppercase">Legendarias</label>
                                <input
                                    type="number"
                                    value={scenario1.parcels.legendary}
                                    onChange={(e) => updateScenario(1, 'legendary', parseInt(e.target.value) || 0)}
                                    className="glass-input w-full mt-1"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-muted uppercase">Total Parcelas</label>
                            <div className="glass-input bg-glass-dark text-accent font-bold mt-1">
                                {totalParcels1}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-muted uppercase">Insignias</label>
                            <input
                                type="number"
                                value={scenario1.badges}
                                onChange={(e) => updateScenario(1, 'badges', parseInt(e.target.value) || 0)}
                                className="glass-input w-full mt-1"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-muted uppercase flex justify-between">
                                <span>Boost Hours</span>
                                <span className="text-accent font-bold">{scenario1.boostHours}h</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="24"
                                value={scenario1.boostHours}
                                onChange={(e) => updateScenario(1, 'boostHours', parseInt(e.target.value))}
                                className="w-full mt-1 accent-accent"
                            />
                        </div>
                    </div>

                    {/* Results */}
                    <div className="mt-6 pt-4 border-t border-white/10">
                        <div className="text-center">
                            <div className="text-success text-2xl font-bold mb-1">
                                {formatCurrency(result1.daily)}
                            </div>
                            <div className="text-xs text-muted">por día</div>
                            <div className="text-sm text-white mt-2">
                                {formatCurrency(result1.monthly)} / mes
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scenario 2 */}
                <div className="glass-card p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between mb-4">
                        <input
                            type="text"
                            value={scenario2.name}
                            onChange={(e) => setScenario2(prev => ({ ...prev, name: e.target.value }))}
                            className="glass-input text-lg font-bold bg-transparent border-none text-white"
                        />
                        <button
                            onClick={() => handleCopyScenario('current', '2')}
                            className="text-xs text-accent hover:text-white transition-colors flex items-center gap-1"
                            title="Copiar datos actuales"
                        >
                            <Copy size={14} />
                            Copiar actual
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-muted uppercase">Comunes</label>
                                <input
                                    type="number"
                                    value={scenario2.parcels.common}
                                    onChange={(e) => updateScenario(2, 'common', parseInt(e.target.value) || 0)}
                                    className="glass-input w-full mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted uppercase">Raras</label>
                                <input
                                    type="number"
                                    value={scenario2.parcels.rare}
                                    onChange={(e) => updateScenario(2, 'rare', parseInt(e.target.value) || 0)}
                                    className="glass-input w-full mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted uppercase">Épicas</label>
                                <input
                                    type="number"
                                    value={scenario2.parcels.epic}
                                    onChange={(e) => updateScenario(2, 'epic', parseInt(e.target.value) || 0)}
                                    className="glass-input w-full mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted uppercase">Legendarias</label>
                                <input
                                    type="number"
                                    value={scenario2.parcels.legendary}
                                    onChange={(e) => updateScenario(2, 'legendary', parseInt(e.target.value) || 0)}
                                    className="glass-input w-full mt-1"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-muted uppercase">Total Parcelas</label>
                            <div className="glass-input bg-glass-dark text-accent font-bold mt-1">
                                {totalParcels2}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-muted uppercase">Insignias</label>
                            <input
                                type="number"
                                value={scenario2.badges}
                                onChange={(e) => updateScenario(2, 'badges', parseInt(e.target.value) || 0)}
                                className="glass-input w-full mt-1"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-muted uppercase flex justify-between">
                                <span>Boost Hours</span>
                                <span className="text-accent font-bold">{scenario2.boostHours}h</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="24"
                                value={scenario2.boostHours}
                                onChange={(e) => updateScenario(2, 'boostHours', parseInt(e.target.value))}
                                className="w-full mt-1 accent-accent"
                            />
                        </div>
                    </div>

                    {/* Results */}
                    <div className="mt-6 pt-4 border-t border-white/10">
                        <div className="text-center">
                            <div className="text-success text-2xl font-bold mb-1">
                                {formatCurrency(result2.daily)}
                            </div>
                            <div className="text-xs text-muted">por día</div>
                            <div className="text-sm text-white mt-2">
                                {formatCurrency(result2.monthly)} / mes
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comparison Results */}
            <div className="glass-card p-6 border-l-4 border-emerald-500">
                <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="text-emerald-400" size={24} />
                    <h3 className="text-xl font-bold text-white">Análisis Comparativo</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-white/5">
                        <div className="text-xs text-muted uppercase mb-2">Diferencia Diaria</div>
                        <div className={`text-2xl font-bold ${comparison.difference.daily >= 0 ? 'text-success' : 'text-red-400'}`}>
                            {comparison.difference.daily >= 0 ? '+' : ''}{formatCurrency(comparison.difference.daily)}
                        </div>
                        <div className="text-xs text-muted mt-1">
                            {comparison.difference.dailyPercentage >= 0 ? '+' : ''}{comparison.difference.dailyPercentage.toFixed(1)}%
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4 border border-white/5">
                        <div className="text-xs text-muted uppercase mb-2">Diferencia Mensual</div>
                        <div className={`text-2xl font-bold ${comparison.difference.monthly >= 0 ? 'text-success' : 'text-red-400'}`}>
                            {comparison.difference.monthly >= 0 ? '+' : ''}{formatCurrency(comparison.difference.monthly)}
                        </div>
                        <div className="text-xs text-muted mt-1">Estimado 30 días</div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4 border border-white/5">
                        <div className="text-xs text-muted uppercase mb-2">Diferencia Anual</div>
                        <div className={`text-2xl font-bold ${comparison.difference.yearly >= 0 ? 'text-success' : 'text-red-400'}`}>
                            {comparison.difference.yearly >= 0 ? '+' : ''}{formatCurrency(comparison.difference.yearly)}
                        </div>
                        <div className="text-xs text-muted mt-1">Estimado 365 días</div>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-300">
                        💡 <strong>{scenario2.name}</strong> genera{' '}
                        <strong className={comparison.difference.daily >= 0 ? 'text-success' : 'text-red-400'}>
                            {Math.abs(comparison.difference.dailyPercentage).toFixed(1)}%{' '}
                            {comparison.difference.daily >= 0 ? 'más' : 'menos'}
                        </strong>{' '}
                        que <strong>{scenario1.name}</strong>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ScenarioComparator;

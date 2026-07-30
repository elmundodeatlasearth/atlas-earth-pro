import React, { useState, useEffect } from 'react';
import { calculateProfitWithBoostHours, formatCurrency, getBadgeBoost } from '../../utils/calculations';
import { calculateParcelDistribution, getDistributionPercentages, estimateParcelCost, BADGE_COST } from '../../utils/distribution';
import type { UserData } from '../../types';

interface SimpleDashboardProps {
    isDark: boolean;
    onDataChange: (data: UserData) => void;
    initialData?: UserData;
    boostHours?: number;
    onBoostHoursChange?: (hours: number) => void;
}

/**
 * Simplified Dashboard Component
 * Shows only 3 main inputs: Total Parcels, Badges, Boost Hours
 * Automatically calculates parcel distribution based on official probabilities
 */
const SimpleDashboard: React.FC<SimpleDashboardProps> = ({
    isDark,
    onDataChange,
    initialData,
    boostHours: boostHoursProp = 24,
    onBoostHoursChange
}) => {
    const [simpleMode, setSimpleMode] = useState(false); // Modo avanzado por defecto
    const [totalParcels, setTotalParcels] = useState(42);
    const [badges, setBadges] = useState(5);
    const [boostHours, setBoostHours] = useState(boostHoursProp);
    const [adBoost] = useState(30); // Fixed at 30x for simplicity

    // Advanced mode individual parcels
    const [common, setCommon] = useState(25);
    const [rare, setRare] = useState(10);
    const [epic, setEpic] = useState(5);
    const [legendary, setLegendary] = useState(2);

    // Initialize from props
    useEffect(() => {
        if (initialData) {
            const total = initialData.common + initialData.rare + initialData.epic + initialData.legendary;
            setTotalParcels(total);
            setBadges(initialData.badges);
            setCommon(initialData.common);
            setRare(initialData.rare);
            setEpic(initialData.epic);
            setLegendary(initialData.legendary);
        }
    }, [initialData]);

    // Sync simple mode: when totalParcels changes, update distribution
    useEffect(() => {
        if (simpleMode) {
            const distribution = calculateParcelDistribution(totalParcels);
            setCommon(distribution.common);
            setRare(distribution.rare);
            setEpic(distribution.epic);
            setLegendary(distribution.legendary);
        }
    }, [totalParcels, simpleMode]);

    // Sync advanced mode: when individual parcels change, update total
    useEffect(() => {
        if (!simpleMode) {
            const total = common + rare + epic + legendary;
            setTotalParcels(total);
        }
    }, [common, rare, epic, legendary, simpleMode]);

    // Notify parent of data changes
    useEffect(() => {
        onDataChange({
            common,
            rare,
            epic,
            legendary,
            badges,
        });
    }, [common, rare, epic, legendary, badges, onDataChange]);

    // Notify parent of boost hours changes
    useEffect(() => {
        if (onBoostHoursChange) {
            onBoostHoursChange(boostHours);
        }
    }, [boostHours, onBoostHoursChange]);

    const badgeInfo = getBadgeBoost(badges);
    const distribution = { common, rare, epic, legendary };
    const percentages = getDistributionPercentages(distribution);

    // Calculate results
    const result = calculateProfitWithBoostHours(distribution, badges, adBoost, boostHours);

    // Calculate investment cost
    const parcelCost = estimateParcelCost(totalParcels);
    const badgeCost = badges * BADGE_COST;
    const totalInvestment = parcelCost + badgeCost;

    return (
        <section className={`rounded-2xl p-6 shadow-sm border mb-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'
            }`}>
            {/* Header with Mode Toggle */}
            <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    📊 Mis Datos
                </h2>
                <button
                    onClick={() => setSimpleMode(!simpleMode)}
                    className={`text-sm px-4 py-2 rounded-lg transition-all font-medium ${isDark
                        ? 'bg-slate-700 hover:bg-slate-600 text-gray-200 border border-slate-600'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                        }`}
                >
                    {simpleMode ? '⚙️ Modo Avanzado' : '✨ Modo Simple'}
                </button>
            </div>

            {simpleMode ? (
                // ========== SIMPLE MODE ==========
                <div className="space-y-5">
                    {/* Total Parcels */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            📦 Total de Parcelas
                        </label>
                        <input
                            type="number"
                            value={totalParcels}
                            onChange={(e) => setTotalParcels(parseInt(e.target.value) || 0)}
                            className={`w-full px-4 py-3 rounded-lg border text-lg font-semibold transition-colors ${isDark
                                ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                            placeholder="218"
                            min="0"
                        />
                        <div className={`mt-2 text-xs flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                            {percentages.common}% Common
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 ml-2"></span>
                            {percentages.rare}% Rare
                            <span className="inline-block w-2 h-2 rounded-full bg-purple-500 ml-2"></span>
                            {percentages.epic}% Epic
                            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 ml-2"></span>
                            {percentages.legendary}% Legendary
                        </div>
                    </div>

                    {/* Total Badges */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            🎖️ Insignias Totales
                        </label>
                        <input
                            type="number"
                            value={badges}
                            onChange={(e) => setBadges(parseInt(e.target.value) || 0)}
                            className={`w-full px-4 py-3 rounded-lg border text-lg font-semibold transition-colors ${isDark
                                ? 'bg-slate-700 border-slate-600 text-white focus:border-blue-500'
                                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                            placeholder="101"
                            min="0"
                        />
                        <div className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Nivel {badgeInfo.level} • Boost: <span className="text-green-500 font-semibold">+{(badgeInfo.boost * 100).toFixed(0)}%</span>
                        </div>
                    </div>

                    {/* Boost Hours Slider */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            ⏱️ Horas de Boost por Día: <span className="font-bold text-blue-500">{boostHours}h</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="24"
                            value={boostHours}
                            onChange={(e) => setBoostHours(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-500"
                        />
                        <div className={`flex justify-between text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span>0h</span>
                            <span>12h</span>
                            <span>24h</span>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className={`mt-6 p-4 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Ganancia Diaria
                                </div>
                                <div className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                    {formatCurrency(result.daily)}
                                </div>
                            </div>
                            <div>
                                <div className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Ganancia Mensual
                                </div>
                                <div className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                    {formatCurrency(result.monthly)}
                                </div>
                            </div>
                            <div>
                                <div className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Inversión Total
                                </div>
                                <div className={`text-lg font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                    {formatCurrency(totalInvestment)}
                                </div>
                            </div>
                            <div>
                                <div className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    ROI Anual
                                </div>
                                <div className={`text-lg font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                                    {((result.yearly / totalInvestment) * 100).toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // ========== ADVANCED MODE ==========
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                <span className="text-green-500">●</span>
                                Parcelas Comunes
                            </label>
                            <input
                                type="number"
                                value={common}
                                onChange={(e) => setCommon(parseInt(e.target.value) || 0)}
                                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                min="0"
                            />
                        </div>
                        <div>
                            <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                <span className="text-blue-500">●</span>
                                Parcelas Raras
                            </label>
                            <input
                                type="number"
                                value={rare}
                                onChange={(e) => setRare(parseInt(e.target.value) || 0)}
                                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                <span className="text-purple-500">●</span>
                                Parcelas Épicas
                            </label>
                            <input
                                type="number"
                                value={epic}
                                onChange={(e) => setEpic(parseInt(e.target.value) || 0)}
                                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                min="0"
                            />
                        </div>
                        <div>
                            <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                <span className="text-amber-500">●</span>
                                Parcelas Legendarias
                            </label>
                            <input
                                type="number"
                                value={legendary}
                                onChange={(e) => setLegendary(parseInt(e.target.value) || 0)}
                                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                🎖️ Insignias Totales
                            </label>
                            <input
                                type="number"
                                value={badges}
                                onChange={(e) => setBadges(parseInt(e.target.value) || 0)}
                                className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                                min="0"
                            />
                        </div>
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                📦 Total
                            </label>
                            <div className={`w-full px-3 py-2 rounded-lg border font-semibold ${isDark ? 'bg-slate-700/50 border-slate-600 text-gray-300' : 'bg-gray-50 border-gray-300 text-gray-700'
                                }`}>
                                {totalParcels} parcelas
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            ⏱️ Horas de Boost por Día: <span className="font-bold text-blue-500">{boostHours}h</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="24"
                            value={boostHours}
                            onChange={(e) => setBoostHours(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-500"
                        />
                        <div className={`flex justify-between text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <span>0h</span>
                            <span>12h</span>
                            <span>24h</span>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default SimpleDashboard;

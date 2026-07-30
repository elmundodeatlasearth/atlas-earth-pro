import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { calculateProfitWithBoostHours, formatCurrency, getAdBoostMultiplier } from '../../utils/calculations';
import { logAuditEvent } from '../../lib/security/audit';
import { useSecurity } from '../../context/SecurityContext';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts';
import { TrendingUp, Plus, Trash2, Calendar, BarChart3, Activity } from 'lucide-react';
import type { ProgressSnapshot } from '../../types';
import './ProgressTracker.css';

const ProgressTracker: React.FC = () => {
    const { userData, boostHours } = useData();
    const { session } = useSecurity();
    const [snapshots, setSnapshots] = useState<ProgressSnapshot[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [notes, setNotes] = useState('');
    const [chartMetric, setChartMetric] = useState<'dailyIncome' | 'parcels'>('dailyIncome');

    // Load snapshots from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('atlas_progress_snapshots');
        if (saved) {
            try {
                setSnapshots(JSON.parse(saved));
            } catch (error) {
                console.error('Error loading snapshots:', error);
            }
        }
    }, []);

    // Save snapshots to localStorage
    useEffect(() => {
        localStorage.setItem('atlas_progress_snapshots', JSON.stringify(snapshots));
    }, [snapshots]);

    const handleAddSnapshot = () => {
        const totalP = userData.common + userData.rare + userData.epic + userData.legendary;
        const adBoost = getAdBoostMultiplier(totalP);
        const result = calculateProfitWithBoostHours(userData, userData.badges, adBoost, boostHours);

        const newSnapshot: ProgressSnapshot = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            date: new Date().toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
            parcels: {
                common: userData.common,
                rare: userData.rare,
                epic: userData.epic,
                legendary: userData.legendary,
            },
            badges: userData.badges,
            dailyIncome: result.daily,
            monthlyIncome: result.monthly,
            notes: notes.trim() || undefined,
        };

        setSnapshots(prev => [newSnapshot, ...prev]);
        setNotes('');
        setShowAddModal(false);
        logAuditEvent({ action: 'SNAPSHOT_CREATED', userId: session?.user?.id });
    };

    const handleDeleteSnapshot = (id: string) => {
        if (confirm('¿Estás seguro de eliminar este snapshot?')) {
            setSnapshots(prev => prev.filter(s => s.id !== id));
            logAuditEvent({ action: 'SNAPSHOT_DELETED', userId: session?.user?.id });
        }
    };

    // Growth statistics between oldest and newest
    const growthStats = useMemo(() => {
        if (snapshots.length < 2) return null;
        const latest = snapshots[0];
        const oldest = snapshots[snapshots.length - 1];
        const totalParcelsGrowth =
            (latest.parcels.common + latest.parcels.rare + latest.parcels.epic + latest.parcels.legendary) -
            (oldest.parcels.common + oldest.parcels.rare + oldest.parcels.epic + oldest.parcels.legendary);
        const badgesGrowth = latest.badges - oldest.badges;
        const incomeGrowth = latest.dailyIncome - oldest.dailyIncome;
        const incomeGrowthPercentage = oldest.dailyIncome > 0
            ? ((incomeGrowth / oldest.dailyIncome) * 100)
            : 0;
        const daysBetween = Math.ceil((latest.timestamp - oldest.timestamp) / (1000 * 60 * 60 * 24));
        return { totalParcelsGrowth, badgesGrowth, incomeGrowth, incomeGrowthPercentage, daysBetween };
    }, [snapshots]);

    // Chart data — chronological order (oldest first)
    const chartData = useMemo(() => {
        return [...snapshots]
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(snap => {
                const totalSnap = snap.parcels.common + snap.parcels.rare + snap.parcels.epic + snap.parcels.legendary;
                return {
                    date: new Date(snap.timestamp).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
                    fullDate: snap.date,
                    dailyIncome: parseFloat(snap.dailyIncome.toFixed(6)),
                    parcels: totalSnap,
                    badges: snap.badges,
                };
            });
    }, [snapshots]);

    const totalParcels = userData.common + userData.rare + userData.epic + userData.legendary;

    return (
        <div className="progress-tracker animate-fade-in">
            <div className="header mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="text-accent" size={28} />
                        <h2 className="text-2xl font-bold text-white">Seguimiento de Progreso</h2>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg transition-colors font-medium"
                    >
                        <Plus size={18} />
                        Guardar Snapshot
                    </button>
                </div>
                <p className="text-muted mt-2">Registra y visualiza tu evolución a lo largo del tiempo</p>
            </div>

            {/* Growth Statistics */}
            {growthStats && (
                <div className="glass-card p-6 mb-6 border-l-4 border-emerald-500">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="text-emerald-400" size={20} />
                        Estadísticas de Crecimiento ({growthStats.daysBetween} días)
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-800/50 rounded-lg p-4 border border-white/5">
                            <div className="text-xs text-muted uppercase mb-1">Período</div>
                            <div className="text-xl font-bold text-white">{growthStats.daysBetween} días</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-4 border border-white/5">
                            <div className="text-xs text-muted uppercase mb-1">Parcelas</div>
                            <div className={`text-xl font-bold ${growthStats.totalParcelsGrowth >= 0 ? 'text-success' : 'text-red-400'}`}>
                                {growthStats.totalParcelsGrowth >= 0 ? '+' : ''}{growthStats.totalParcelsGrowth}
                            </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-4 border border-white/5">
                            <div className="text-xs text-muted uppercase mb-1">Badges</div>
                            <div className={`text-xl font-bold ${growthStats.badgesGrowth >= 0 ? 'text-success' : 'text-red-400'}`}>
                                {growthStats.badgesGrowth >= 0 ? '+' : ''}{growthStats.badgesGrowth}
                            </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-4 border border-white/5">
                            <div className="text-xs text-muted uppercase mb-1">Ingreso Diario</div>
                            <div className={`text-xl font-bold ${growthStats.incomeGrowth >= 0 ? 'text-success' : 'text-red-400'}`}>
                                {growthStats.incomeGrowthPercentage >= 0 ? '+' : ''}{growthStats.incomeGrowthPercentage.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Evolution Chart */}
            {chartData.length >= 2 && (
                <div className="glass-card p-6 mb-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Activity className="text-blue-400" size={20} />
                            Evolución Histórica
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setChartMetric('dailyIncome')}
                                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${chartMetric === 'dailyIncome' ? 'bg-emerald-500 text-white' : 'bg-glass-dark text-muted hover:text-white'}`}
                            >
                                Ingreso
                            </button>
                            <button
                                onClick={() => setChartMetric('parcels')}
                                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${chartMetric === 'parcels' ? 'bg-purple-500 text-white' : 'bg-glass-dark text-muted hover:text-white'}`}
                            >
                                Parcelas
                            </button>
                        </div>
                    </div>

                    <div style={{ width: '100%', height: '240px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorEvolution" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={chartMetric === 'dailyIncome' ? '#10b981' : '#a855f7'} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={chartMetric === 'dailyIncome' ? '#10b981' : '#a855f7'} stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis
                                    stroke="#64748b"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    width={65}
                                    tickFormatter={(v) => chartMetric === 'dailyIncome' ? `$${v.toFixed(4)}` : `${v}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                                    formatter={(value: number) => [
                                        chartMetric === 'dailyIncome' ? `$${value.toFixed(6)}` : `${value} parcelas`,
                                        chartMetric === 'dailyIncome' ? 'Ingreso Diario' : 'Total Parcelas',
                                    ]}
                                    labelFormatter={(_l, payload) => payload?.[0]?.payload?.fullDate ?? ''}
                                />
                                <Area
                                    type="monotone"
                                    dataKey={chartMetric}
                                    stroke={chartMetric === 'dailyIncome' ? '#10b981' : '#a855f7'}
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#colorEvolution)"
                                    dot={{ fill: chartMetric === 'dailyIncome' ? '#34d399' : '#c084fc', strokeWidth: 0, r: 4 }}
                                    activeDot={{ r: 6 }}
                                    animationDuration={600}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Snapshots List */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-4">Historial de Snapshots</h3>

                {snapshots.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="text-muted mx-auto mb-3" size={48} />
                        <p className="text-muted mb-2">No hay snapshots guardados</p>
                        <p className="text-sm text-muted">
                            Guarda tu progreso actual para comenzar a rastrear tu evolución
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {snapshots.map((snapshot, index) => {
                            const totalSnapshotParcels =
                                snapshot.parcels.common +
                                snapshot.parcels.rare +
                                snapshot.parcels.epic +
                                snapshot.parcels.legendary;

                            return (
                                <div
                                    key={snapshot.id}
                                    className="bg-slate-800/50 rounded-lg p-4 border border-white/5 hover:border-white/10 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Calendar className="text-accent" size={16} />
                                                <span className="text-white font-medium">{snapshot.date}</span>
                                                {index === 0 && (
                                                    <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full">
                                                        Más reciente
                                                    </span>
                                                )}
                                            </div>
                                            {snapshot.notes && (
                                                <p className="text-sm text-muted italic">{snapshot.notes}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteSnapshot(snapshot.id)}
                                            className="text-red-400 hover:text-red-300 transition-colors p-1"
                                            title="Eliminar snapshot"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div>
                                            <div className="text-xs text-muted uppercase">Total Parcelas</div>
                                            <div className="text-white font-bold">{totalSnapshotParcels}</div>
                                            <div className="text-xs text-muted mt-0.5">
                                                C:{snapshot.parcels.common} R:{snapshot.parcels.rare} E:{snapshot.parcels.epic} L:{snapshot.parcels.legendary}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted uppercase">Badges</div>
                                            <div className="text-white font-bold">{snapshot.badges}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted uppercase">Ingreso Diario</div>
                                            <div className="text-success font-bold font-mono text-sm">
                                                {formatCurrency(snapshot.dailyIncome)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted uppercase">Ingreso Mensual</div>
                                            <div className="text-blue-400 font-bold font-mono text-sm">
                                                {formatCurrency(snapshot.monthlyIncome)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add Snapshot Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 max-w-md w-full animate-slide-up">
                        <h3 className="text-xl font-bold text-white mb-4">Guardar Snapshot Actual</h3>

                        <div className="space-y-4 mb-6">
                            <div className="bg-slate-800/50 rounded-lg p-4 border border-white/5">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-muted">Total Parcelas:</span>
                                        <span className="text-white font-bold ml-2">{totalParcels}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted">Badges:</span>
                                        <span className="text-white font-bold ml-2">{userData.badges}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-muted uppercase block mb-2">
                                    Notas (opcional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="glass-input w-full h-20 resize-none"
                                    placeholder="Ej: Compré 50 parcelas nuevas"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2 bg-glass-dark hover:bg-glass-border text-white rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddSnapshot}
                                className="flex-1 px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg transition-colors font-medium"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgressTracker;

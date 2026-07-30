import React, { useState, useMemo } from 'react';
import {
    AreaChart,
    Area,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    Legend,
} from 'recharts';
import type { ProgressSnapshot } from '../../types';

interface ProfitChartProps {
    dailyProfit: number;
    startDate?: string;
    startAmount?: number;
    snapshots?: ProgressSnapshot[];
}

type TimePeriod = '7days' | '30days' | '1year';

const ProfitChart: React.FC<ProfitChartProps> = ({
    dailyProfit,
    startDate = new Date().toISOString().split('T')[0],
    startAmount = 0,
    snapshots = [],
}) => {
    const [period, setPeriod] = useState<TimePeriod>('30days');
    const [showAccumulated, setShowAccumulated] = useState(true);

    // Load saved snapshots from localStorage if no snapshots prop provided
    const realSnapshots = useMemo<ProgressSnapshot[]>(() => {
        if (snapshots.length > 0) return snapshots;
        try {
            const saved = localStorage.getItem('atlas_progress_snapshots');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    }, [snapshots]);

    // Build chart data — uses real snapshots where available, fills rest with projections
    const data = useMemo(() => {
        const days = period === '7days' ? 7 : period === '30days' ? 30 : 365;
        const result = [];
        const start = new Date(startDate);
        const now = new Date();

        // Build a lookup of real snapshot data by date (YYYY-MM-DD)
        const snapshotByDate: Record<string, number> = {};
        realSnapshots.forEach((snap) => {
            const d = new Date(snap.timestamp).toISOString().split('T')[0];
            snapshotByDate[d] = snap.dailyIncome;
        });

        let accumulated = startAmount;

        for (let i = 0; i < days; i++) {
            const currentDate = new Date(start);
            currentDate.setDate(start.getDate() + i);
            const dateKey = currentDate.toISOString().split('T')[0];
            const isPast = currentDate <= now;

            // Use real snapshot income if available, otherwise use current dailyProfit
            const realIncome = snapshotByDate[dateKey];
            const dailyValue = realIncome ?? dailyProfit;
            accumulated += dailyValue;

            let dateLabel = '';
            if (period === '7days') {
                dateLabel = currentDate.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
            } else if (period === '30days') {
                dateLabel = i % 5 === 0
                    ? currentDate.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
                    : '';
            } else {
                dateLabel = i % 30 === 0
                    ? currentDate.toLocaleDateString('es-MX', { month: 'short' })
                    : '';
            }

            result.push({
                date: dateLabel,
                fullDate: currentDate.toLocaleDateString('es-MX', {
                    weekday: period === '7days' ? 'short' : undefined,
                    month: 'short',
                    day: 'numeric',
                    year: period === '1year' ? 'numeric' : undefined,
                }),
                daily: parseFloat(dailyValue.toFixed(6)),
                accumulated: parseFloat(accumulated.toFixed(4)),
                projected: parseFloat((startAmount + dailyProfit * (i + 1)).toFixed(4)),
                isReal: isPast && !!realIncome,
            });
        }

        return result;
    }, [period, dailyProfit, startDate, startAmount, realSnapshots]);

    const hasRealData = realSnapshots.length > 0;

    const formatYAxis = (value: number) => {
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
        if (value >= 1) return `$${value.toFixed(2)}`;
        return `$${value.toFixed(4)}`;
    };

    const periodButtons: { value: TimePeriod; label: string }[] = [
        { value: '7days', label: '7 Días' },
        { value: '30days', label: '30 Días' },
        { value: '1year', label: '1 Año' },
    ];

    const tooltipStyle = {
        backgroundColor: '#1e293b',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '12px',
    };

    return (
        <div className="profit-chart-container">
            {/* Controls */}
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                <div className="flex gap-2">
                    {periodButtons.map(btn => (
                        <button
                            key={btn.value}
                            onClick={() => setPeriod(btn.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${period === btn.value
                                ? 'bg-accent text-white'
                                : 'bg-glass-dark text-muted hover:bg-glass-border hover:text-white'
                                }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    {hasRealData && (
                        <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                            ✓ {realSnapshots.length} snapshots reales
                        </span>
                    )}
                    <button
                        onClick={() => setShowAccumulated(!showAccumulated)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-glass-dark text-muted hover:bg-glass-border hover:text-white transition-all"
                    >
                        {showAccumulated ? '📊 Acumulado' : '📈 Diario'}
                    </button>
                </div>
            </div>

            {/* Chart */}
            <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    {showAccumulated ? (
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorAccumulated" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                                </linearGradient>
                                <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatYAxis} width={60} />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                formatter={(value: number, name?: string) => {
                                    const label = name === 'accumulated' ? 'Acumulado Real' : 'Proyección Lineal';
                                    return [`$${value.toFixed(4)}`, label];
                                }}
                                labelFormatter={(_label, payload) => payload?.[0]?.payload?.fullDate ?? ''}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                                formatter={(value) => value === 'accumulated' ? 'Acumulado Real' : 'Proyección Lineal'}
                            />
                            <Area
                                type="monotone"
                                dataKey="accumulated"
                                stroke="#10b981"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorAccumulated)"
                                animationDuration={800}
                                dot={false}
                                activeDot={{ r: 5, fill: '#34d399' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="projected"
                                stroke="#3b82f6"
                                strokeWidth={1.5}
                                strokeDasharray="5 5"
                                fillOpacity={1}
                                fill="url(#colorProjected)"
                                animationDuration={800}
                                dot={false}
                            />
                        </AreaChart>
                    ) : (
                        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatYAxis} width={60} />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                formatter={(value: number) => [`$${value.toFixed(6)}`, 'Ganancia Diaria']}
                                labelFormatter={(_label, payload) => payload?.[0]?.payload?.fullDate ?? ''}
                            />
                            {hasRealData && (
                                <ReferenceLine y={dailyProfit} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Actual', fill: '#f59e0b', fontSize: 10 }} />
                            )}
                            <Line
                                type="monotone"
                                dataKey="daily"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                animationDuration={800}
                                dot={(props: any) => props.payload?.isReal
                                    ? <circle key={props.key} cx={props.cx} cy={props.cy} r={3} fill="#10b981" stroke="none" />
                                    : <></>
                                }
                                activeDot={{ r: 5, fill: '#60a5fa' }}
                            />
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>

            {!hasRealData && (
                <p className="text-xs text-muted text-center mt-2 opacity-60">
                    💡 Guarda snapshots en "Seguimiento de Progreso" para ver datos históricos reales
                </p>
            )}
        </div>
    );
};

export default ProfitChart;

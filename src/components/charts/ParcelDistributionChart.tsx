import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ParcelDistributionChartProps {
    parcels: {
        common: number;
        rare: number;
        epic: number;
        legendary: number;
    };
}

const COLORS = {
    common: '#64748b',      // Gray
    rare: '#3b82f6',        // Blue
    epic: '#a855f7',        // Purple
    legendary: '#f59e0b'    // Amber/Gold
};

const RARITY_LABELS = {
    common: 'Comunes',
    rare: 'Raras',
    epic: 'Épicas',
    legendary: 'Legendarias'
};

const ParcelDistributionChart: React.FC<ParcelDistributionChartProps> = ({ parcels }) => {
    const data = useMemo(() => {
        const total = parcels.common + parcels.rare + parcels.epic + parcels.legendary;

        if (total === 0) {
            return [{ name: 'Sin parcelas', value: 1, color: '#334155' }];
        }

        return [
            {
                name: RARITY_LABELS.common,
                value: parcels.common,
                color: COLORS.common,
                percentage: ((parcels.common / total) * 100).toFixed(1)
            },
            {
                name: RARITY_LABELS.rare,
                value: parcels.rare,
                color: COLORS.rare,
                percentage: ((parcels.rare / total) * 100).toFixed(1)
            },
            {
                name: RARITY_LABELS.epic,
                value: parcels.epic,
                color: COLORS.epic,
                percentage: ((parcels.epic / total) * 100).toFixed(1)
            },
            {
                name: RARITY_LABELS.legendary,
                value: parcels.legendary,
                color: COLORS.legendary,
                percentage: ((parcels.legendary / total) * 100).toFixed(1)
            }
        ].filter(item => item.value > 0);
    }, [parcels]);

    const totalParcels = parcels.common + parcels.rare + parcels.epic + parcels.legendary;

    const renderCustomLabel = (entry: any) => {
        if (entry.value === 0) return '';
        return `${entry.percentage}%`;
    };

    return (
        <div className="parcel-distribution-chart">
            <div style={{ width: '100%', height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomLabel}
                            outerRadius={90}
                            innerRadius={50}
                            fill="#8884d8"
                            dataKey="value"
                            animationDuration={800}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '12px'
                            }}
                            formatter={(value: any, name?: string, props?: any) => {
                                return [
                                    `${value} parcelas (${props?.payload?.percentage}%)`,
                                    name || ''
                                ];
                            }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                            formatter={(value, entry: any) => {
                                return `${value}: ${entry.payload.value}`;
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Center Label */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="text-3xl font-bold text-white">{totalParcels}</div>
                <div className="text-xs text-muted uppercase">Total</div>
            </div>
        </div>
    );
};

export default ParcelDistributionChart;

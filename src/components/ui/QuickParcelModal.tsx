import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { MapPin, Award, Zap, X, Plus, Minus, Check } from 'lucide-react';

interface QuickParcelModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const QuickParcelModal: React.FC<QuickParcelModalProps> = ({ isOpen, onClose }) => {
    const { userData, updateParcels, updateBadges, boostHours, setBoostHours } = useData();

    const [localParcels, setLocalParcels] = useState({
        common: userData.common,
        rare: userData.rare,
        epic: userData.epic,
        legendary: userData.legendary
    });
    const [localBadges, setLocalBadges] = useState(userData.badges);
    const [localBoostHours, setLocalBoostHours] = useState(boostHours);

    // Synchronize local state with global context on modal open
    React.useEffect(() => {
        if (isOpen) {
            setLocalParcels({
                common: userData.common,
                rare: userData.rare,
                epic: userData.epic,
                legendary: userData.legendary
            });
            setLocalBadges(userData.badges);
            setLocalBoostHours(boostHours);
        }
    }, [isOpen, userData, boostHours]);

    if (!isOpen) return null;

    const handleIncrement = (type: 'common' | 'rare' | 'epic' | 'legendary' | 'badges', amount: number) => {
        if (type === 'badges') {
            setLocalBadges(prev => Math.max(0, prev + amount));
        } else {
            setLocalParcels(prev => ({
                ...prev,
                [type]: Math.max(0, prev[type] + amount)
            }));
        }
    };

    const handleSave = () => {
        updateParcels(localParcels);
        updateBadges(localBadges);
        setBoostHours(localBoostHours);
        onClose();
    };

    const totalParcels = localParcels.common + localParcels.rare + localParcels.epic + localParcels.legendary;

    return (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="glass-card max-w-lg w-full p-6 border border-emerald-500/30 relative overflow-hidden shadow-2xl animate-slide-up">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 border border-emerald-500/30">
                            <MapPin size={22} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Editar Inventario de Parcelas</h3>
                            <p className="text-xs text-muted">Ajuste rápido de parcelas, insignias y horas de boost</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Total Summary Header */}
                <div className="grid grid-cols-3 gap-3 mb-6 bg-slate-900/60 p-3 rounded-lg border border-white/5 text-center">
                    <div>
                        <span className="text-xs text-muted block uppercase">Total Parcelas</span>
                        <span className="text-xl font-bold text-emerald-400">{totalParcels}</span>
                    </div>
                    <div>
                        <span className="text-xs text-muted block uppercase">Insignias</span>
                        <span className="text-xl font-bold text-amber-400">{localBadges}</span>
                    </div>
                    <div>
                        <span className="text-xs text-muted block uppercase">Boost Diario</span>
                        <span className="text-xl font-bold text-blue-400">{localBoostHours}h</span>
                    </div>
                </div>

                {/* Parcel Grid */}
                <div className="space-y-4 mb-6">
                    {/* Common */}
                    <ParcelCounterRow
                        title="Comunes (50%)"
                        color="text-gray-300"
                        borderColor="border-gray-500"
                        value={localParcels.common}
                        onChange={(val) => setLocalParcels(p => ({ ...p, common: val }))}
                        onIncrement={(amt) => handleIncrement('common', amt)}
                    />

                    {/* Rare */}
                    <ParcelCounterRow
                        title="Raras (30%)"
                        color="text-blue-400"
                        borderColor="border-blue-500"
                        value={localParcels.rare}
                        onChange={(val) => setLocalParcels(p => ({ ...p, rare: val }))}
                        onIncrement={(amt) => handleIncrement('rare', amt)}
                    />

                    {/* Epic */}
                    <ParcelCounterRow
                        title="Épicas (15%)"
                        color="text-purple-400"
                        borderColor="border-purple-500"
                        value={localParcels.epic}
                        onChange={(val) => setLocalParcels(p => ({ ...p, epic: val }))}
                        onIncrement={(amt) => handleIncrement('epic', amt)}
                    />

                    {/* Legendary */}
                    <ParcelCounterRow
                        title="Legendarias (5%)"
                        color="text-amber-400"
                        borderColor="border-amber-500"
                        value={localParcels.legendary}
                        onChange={(val) => setLocalParcels(p => ({ ...p, legendary: val }))}
                        onIncrement={(amt) => handleIncrement('legendary', amt)}
                    />

                    {/* Badges & Boost */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                        <div>
                            <label className="text-xs text-muted uppercase flex items-center gap-1.5 mb-2">
                                <Award size={14} className="text-amber-400" /> Insignias (Passport)
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleIncrement('badges', -1)}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-white border border-white/10"
                                >
                                    <Minus size={14} />
                                </button>
                                <input
                                    type="number"
                                    min="0"
                                    value={localBadges}
                                    onChange={(e) => setLocalBadges(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="glass-input w-full text-center font-mono font-bold text-amber-400"
                                />
                                <button
                                    onClick={() => handleIncrement('badges', 1)}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-white border border-white/10"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-muted uppercase flex items-center gap-1.5 mb-2">
                                <Zap size={14} className="text-blue-400" /> Boost Diario (Horas)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="24"
                                value={localBoostHours}
                                onChange={(e) => setLocalBoostHours(Math.min(24, Math.max(0, parseInt(e.target.value) || 0)))}
                                className="glass-input w-full text-center font-mono font-bold text-blue-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg font-medium transition-colors border border-white/5"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                    >
                        <Check size={18} />
                        Guardar Cambios
                    </button>
                </div>

            </div>
        </div>
    );
};

interface ParcelCounterRowProps {
    title: string;
    color: string;
    borderColor: string;
    value: number;
    onChange: (val: number) => void;
    onIncrement: (amt: number) => void;
}

const ParcelCounterRow: React.FC<ParcelCounterRowProps> = ({
    title,
    color,
    borderColor,
    value,
    onChange,
    onIncrement
}) => {
    return (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/40 p-2.5 rounded-lg border-l-4 ${borderColor} border-t border-r border-b border-white/5 gap-2`}>
            <span className={`text-sm font-bold ${color}`}>{title}</span>
            
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
                    className="glass-input w-20 text-right font-mono font-bold py-1 px-2 text-sm"
                />

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onIncrement(-1)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded border border-white/10"
                        title="Restar 1"
                    >
                        -1
                    </button>
                    <button
                        onClick={() => onIncrement(1)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded border border-white/10"
                        title="Sumar 1"
                    >
                        +1
                    </button>
                    <button
                        onClick={() => onIncrement(5)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-emerald-400 rounded border border-white/10"
                        title="Sumar 5"
                    >
                        +5
                    </button>
                    <button
                        onClick={() => onIncrement(10)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-blue-400 rounded border border-white/10"
                        title="Sumar 10"
                    >
                        +10
                    </button>
                </div>
            </div>
        </div>
    );
};

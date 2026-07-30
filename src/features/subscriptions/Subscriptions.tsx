import React, { useState } from 'react';
import { Shield, Zap, Check, Star } from 'lucide-react';
import PaymentModal from './PaymentModal'; // Assuming PaymentModal is in a separate file
import './Subscriptions.css';

interface Plan {
    id: string;
    name: string;
    price: number;
    period: string;
    features: string[];
    isPopular?: boolean;
}

const Subscriptions: React.FC = () => {
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const plans: Plan[] = [
        {
            id: 'free',
            name: 'Agente',
            price: 0,
            period: 'Siempre',
            features: [
                'Calculadora Estándar',
                'Rastreo de Parcelas Básico',
                'Seguridad Estándar'
            ]
        },
        {
            id: 'pro',
            name: 'Operador',
            price: 9.99,
            period: '/ mes',
            features: [
                'Calculadora Avanzada + IA',
                'Planificador de Metas Táctico',
                'Soporte Prioritario 24/7',
                'Sin Anuncios Externos',
                'Sincronización en la Nube'
            ],
            isPopular: true
        }
    ];

    const handleSelectPlan = (plan: Plan) => {
        if (plan.price === 0) return; // Free plan logic if any
        setSelectedPlan(plan);
        setIsModalOpen(true);
    };

    return (
        <>
            <div className="subscriptions glass-card p-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-xs opacity-50">
                    <Star size={16} className="text-accent" />
                </div>

                <div className="flex items-center gap-sm mb-md">
                    <Shield size={24} className="text-accent" />
                    <h2 className="font-lg font-bold text-gradient">Niveles de Operación</h2>
                </div>

                <div className="grid gap-md">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`plan-card glass-card p-md transition-all hover:border-accent group ${plan.isPopular ? 'border-accent bg-accent-transparent-low' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-sm">
                                <div>
                                    <h3 className="font-bold text-white group-hover:text-accent transition-colors flex items-center gap-xs">
                                        {plan.name}
                                        {plan.isPopular && <span className="text-xs bg-accent text-slate-900 px-1 rounded font-bold">RECOMENDADO</span>}
                                    </h3>
                                    <div className="text-muted font-xs mt-xs">
                                        <span className="font-xl font-bold text-white">${plan.price}</span> {plan.period}
                                    </div>
                                </div>
                                <div className={`p-xs rounded-full ${plan.isPopular ? 'bg-accent text-slate-900' : 'bg-slate-800 text-muted'}`}>
                                    {plan.isPopular ? <Zap size={18} fill="currentColor" /> : <Shield size={18} />}
                                </div>
                            </div>

                            <ul className="mb-md space-y-xs">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-xs font-xs text-muted">
                                        <Check size={12} className="text-success" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleSelectPlan(plan)}
                                className={`w-full p-sm font-bold rounded-sm uppercase tracking-wider text-xs transition-colors ${plan.isPopular
                                        ? 'btn-primary'
                                        : 'border border-glass-border text-muted hover:text-white hover:border-white'
                                    }`}>
                                {plan.price === 0 ? 'Plan Actual' : 'Mejorar Autorización'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {selectedPlan && (
                <PaymentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    planName={selectedPlan.name}
                    amount={selectedPlan.price}
                />
            )}
        </>
    );
};

export default Subscriptions;

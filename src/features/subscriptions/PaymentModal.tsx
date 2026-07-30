import React, { useState } from 'react';
import { CreditCard, Lock, ShieldCheck, X, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';
import './PaymentModal.css';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    planName: string;
    amount: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, planName, amount }) => {
    const [step, setStep] = useState<'SELECT' | 'PROCESSING' | 'SUCCESS'>('SELECT');
    const [method, setMethod] = useState<'CARD' | 'PAYPAL' | 'CRYPTO'>('CARD');

    if (!isOpen) return null;

    const handleProcessPayment = () => {
        setStep('PROCESSING');
        // Simulate secure transaction delay
        setTimeout(() => {
            setStep('SUCCESS');
        }, 2500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black bg-opacity-80 backdrop-blur-sm">
            <div className="payment-modal glass-card p-0 w-full max-w-lg relative overflow-hidden flex flex-column">

                {/* Header */}
                <div className="p-md border-b border-glass-border flex justify-between items-center bg-accent-transparent-low">
                    <div className="flex items-center gap-sm">
                        <Lock size={18} className="text-accent" />
                        <h3 className="font-bold text-white uppercase tracking-wider">Checkout Seguro</h3>
                    </div>
                    <button onClick={onClose} className="text-muted hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-lg flex-1">
                    {step === 'SELECT' && (
                        <div className="animate-fade-in">
                            <div className="mb-lg">
                                <span className="text-muted font-sm font-bold uppercase block mb-xs">Resumen de Orden</span>
                                <div className="flex justify-between items-center p-sm bg-slate-800 rounded-sm border border-glass-border">
                                    <span className="font-bold text-white">{planName} (Suscripción Anual)</span>
                                    <span className="font-mono font-bold text-accent">{formatCurrency(amount)}</span>
                                </div>
                            </div>

                            <div className="mb-xl">
                                <span className="text-muted font-sm font-bold uppercase block mb-md">Método de Pago</span>
                                <div className="grid gap-sm">
                                    {[
                                        { id: 'CARD', label: 'Tarjeta Crédito/Débito', icon: <CreditCard size={18} /> },
                                        { id: 'PAYPAL', label: 'PayPal', icon: <span className="font-bold text-xs">PAY</span> },
                                        { id: 'CRYPTO', label: 'Criptomoneda (USDT)', icon: <ShieldCheck size={18} /> },
                                    ].map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setMethod(m.id as any)}
                                            className={`p-md rounded-sm border flex items-center gap-md transition-all ${method === m.id
                                                ? 'border-accent bg-accent-transparent text-white'
                                                : 'border-glass-border text-muted hover:border-white hover:text-white'
                                                }`}
                                        >
                                            {m.icon}
                                            <span className="font-sm font-bold">{m.label}</span>
                                            {method === m.id && <CheckCircle size={16} className="ml-auto text-accent" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleProcessPayment}
                                className="btn-primary w-full p-md font-bold uppercase tracking-widest flex items-center justify-center gap-sm"
                            >
                                <Lock size={16} />
                                Pagar {formatCurrency(amount)}
                            </button>
                            <div className="mt-sm text-center">
                                <span className="text-muted font-xs flex items-center justify-center gap-xs">
                                    <ShieldCheck size={12} /> Transacción encriptada AES-256
                                </span>
                            </div>
                        </div>
                    )}

                    {step === 'PROCESSING' && (
                        <div className="flex flex-column items-center justify-center py-xl animate-fade-in">
                            <div className="relative w-16 h-16 mb-lg">
                                <div className="absolute inset-0 border-4 border-accent rounded-full opacity-20"></div>
                                <div className="absolute inset-0 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <h4 className="font-bold text-white mb-xs animate-pulse">PROCESANDO PAGO SEGURO...</h4>
                            <p className="text-muted font-sm font-mono text-center max-w-xs">
                                Verificando credenciales con la pasarela de pagos. Por favor espere.
                            </p>
                        </div>
                    )}

                    {step === 'SUCCESS' && (
                        <div className="flex flex-column items-center justify-center py-lg animate-fade-in">
                            <div className="w-16 h-16 rounded-full bg-success-transparent flex items-center justify-center mb-md border border-success animate-bounce-small">
                                <CheckCircle size={32} className="text-success" />
                            </div>
                            <h4 className="font-xl font-bold text-white mb-sm">¡Transacción Exitosa!</h4>
                            <p className="text-muted font-sm text-center mb-lg">
                                Su suscripción <span className="text-accent">{planName}</span> ha sido activada correctamente.
                            </p>
                            <div className="p-md bg-slate-800 rounded-sm border border-glass-border w-full mb-lg">
                                <div className="flex justify-between mb-xs">
                                    <span className="text-muted font-xs uppercase">ID Transacción</span>
                                    <span className="text-white font-mono font-xs">TX-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted font-xs uppercase">Fecha</span>
                                    <span className="text-white font-mono font-xs">{new Date().toLocaleDateString()}</span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="btn-primary w-full p-md font-bold uppercase tracking-widest"
                            >
                                Volver al Dashboard
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Decor */}
                <div className="tactical-scanner-line bottom-0"></div>
            </div>
        </div>
    );
};

export default PaymentModal;

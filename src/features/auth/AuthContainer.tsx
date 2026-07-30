import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useSecurity } from '../../context/SecurityContext';
import { ShieldCheck, Lock, UserPlus, LogIn, AlertTriangle, Key } from 'lucide-react';
import './Auth.css';

type AuthMode = 'LOGIN' | 'REGISTER';

export const AuthContainer: React.FC = () => {
    const { enableDemoMode } = useSecurity();
    const [mode, setMode] = useState<AuthMode>('LOGIN');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Auto-recognize owner for UX convenience (Note: Password still required for security)
    React.useEffect(() => {
        const isOwner = window.location.search.includes('owner=true');
        if (isOwner) {
            setEmail('wildwolvescdmx@gmail.com');
            setMessage('Bienvenido, Arquitecto Sánchez. Sistema listo.');
        }
    }, []);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (mode === 'REGISTER') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage('¡Registro exitoso! Por favor verifica tu correo para activar la cuenta.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                // User is automatically handled by the auth listener in App or Context
            }
        } catch (err: any) {
            console.error('[AUTH ERROR]', err);
            setError(err.message || 'Error de autenticación. Verifica tus credenciales.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper flex items-center justify-center min-h-screen p-md">
            <div className="auth-card glass-card p-xl w-full max-w-md relative overflow-hidden">

                {/* Tactical Header */}
                <div className="tactical-scanner-line"></div>
                <div className="flex flex-column items-center mb-lg">
                    <div className="p-md rounded-full bg-accent-transparent mb-md border border-glass-border animate-pulse-slow">
                        {mode === 'LOGIN' ? <Lock size={32} className="text-accent" /> : <ShieldCheck size={32} className="text-accent" />}
                    </div>
                    <h2 className="font-xl font-bold text-gradient uppercase tracking-widest text-center">
                        {mode === 'LOGIN' ? 'ATLAS ACTUAL' : 'RECLUTAMIENTO'}
                    </h2>
                    <p className="text-muted font-sm mt-xs text-center">
                        {mode === 'LOGIN' ? 'Autenticación de Nivel Superior Requerida' : 'Inicie protocolo de registro'}
                    </p>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="status-message error flex items-center gap-sm p-sm mb-md rounded-sm border border-error bg-error-transparent">
                        <AlertTriangle size={18} className="text-error" />
                        <span className="text-error font-sm">{error}</span>
                    </div>
                )}
                {message && (
                    <div className="status-message success flex items-center gap-sm p-sm mb-md rounded-sm border border-success bg-success-transparent">
                        <ShieldCheck size={18} className="text-success" />
                        <span className="text-success font-sm">{message}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleAuth} className="flex flex-column gap-md">
                    <div className="form-group">
                        <label className="text-muted font-xs uppercase tracking-wider mb-xs block">
                            Credencial de Correo
                        </label>
                        <div className="input-with-icon relative">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="glass-input p-sm w-full font-mono pl-xl"
                                placeholder="agente@atlas.earth"
                            />
                            <div className="absolute left-3 top-3 text-muted opacity-50">
                                📧
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="text-muted font-xs uppercase tracking-wider mb-xs block">
                            Código de Acceso
                        </label>
                        <div className="input-with-icon relative">
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="glass-input p-sm w-full font-mono pl-xl"
                                placeholder="••••••••"
                                minLength={6}
                            />
                            <div className="absolute left-3 top-3 text-muted opacity-50">
                                🔑
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`btn-primary p-md font-bold mt-sm flex items-center justify-center gap-sm uppercase tracking-widest relative overflow-hidden ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (
                            <span className="animate-pulse">Procesando...</span>
                        ) : (
                            <>
                                {mode === 'LOGIN' ? <LogIn size={18} /> : <UserPlus size={18} />}
                                {mode === 'LOGIN' ? 'Autorizar Acceso' : 'Confirmar Registro'}
                            </>
                        )}
                        <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity"></div>
                    </button>
                </form>

                {/* Toggle Mode */}
                <div className="mt-lg text-center border-t border-glass-border pt-md">
                    <p className="text-muted font-sm mb-xs">
                        {mode === 'LOGIN' ? '¿Sin credenciales de acceso?' : '¿Ya tienes autorización?'}
                    </p>
                    <button
                        onClick={() => {
                            setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
                            setError(null);
                            setMessage(null);
                        }}
                        className="text-accent font-bold hover:text-white transition-colors uppercase font-xs tracking-wider"
                    >
                        {mode === 'LOGIN' ? 'Solicitar Acceso (Registrarse)' : 'Acceder al Sistema'}
                    </button>

                    <button
                        onClick={enableDemoMode}
                        className="w-full mt-4 p-2 border border-yellow-500/30 bg-yellow-900/10 text-yellow-400 rounded hover:bg-yellow-900/30 transition-all text-xs font-mono uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        <Key size={14} />
                        Acceso de Emergencia (Demo)
                    </button>
                </div>

                <div className="mt-lg text-center opacity-30">
                    <span className="font-xs font-mono text-muted">ARCHITECT: RICARDO SÁNCHEZ</span>
                </div>

                {/* Tactical Corners */}
                <div className="corner-bracket top-left"></div>
                <div className="corner-bracket top-right"></div>
                <div className="corner-bracket bottom-left"></div>
                <div className="corner-bracket bottom-right"></div>
            </div>
        </div>
    );
};

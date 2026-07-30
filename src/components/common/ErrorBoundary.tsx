import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-slate-950 p-md">
                    <div className="glass-card p-xl max-w-md w-full text-center relative overflow-hidden border-error">
                        <div className="tactical-scanner-line bg-error"></div>

                        <div className="flex justify-center mb-md">
                            <div className="p-md rounded-full bg-error-transparent animate-pulse">
                                <AlertTriangle size={48} className="text-error" />
                            </div>
                        </div>

                        <h2 className="font-xl font-bold text-white mb-sm tracking-widest uppercase">
                            Fallo Crítico del Sistema
                        </h2>
                        <p className="text-muted font-sm mb-lg">
                            Se ha detectado una anomalía en el núcleo de la aplicación.
                            Protocolos de seguridad activados.
                        </p>

                        <div className="bg-slate-900 p-sm rounded-sm mb-lg text-left overflow-auto max-h-32 border border-glass-border">
                            <code className="text-error font-mono text-xs">
                                {this.state.error?.message || 'Error desconocido'}
                            </code>
                        </div>

                        <button
                            onClick={this.handleRetry}
                            className="btn-primary w-full p-md font-bold flex items-center justify-center gap-sm uppercase tracking-wider"
                        >
                            <RefreshCw size={18} />
                            Reiniciar Sistema
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', backgroundColor: '#1a1a1a', color: '#ff5555', height: '100vh', fontFamily: 'monospace' }}>
                    <h1>⚠️ Algo salió mal (Application Crash)</h1>
                    <p>Por favor envía una captura de esta pantalla al soporte.</p>
                    <hr style={{ borderColor: '#333' }} />
                    <h3 style={{ color: '#fff' }}>Error:</h3>
                    <pre style={{ backgroundColor: '#000', padding: '10px', overflow: 'auto' }}>
                        {this.state.error?.toString()}
                    </pre>
                    <h3 style={{ color: '#fff' }}>Stack Trace:</h3>
                    <pre style={{ backgroundColor: '#000', padding: '10px', overflow: 'auto', fontSize: '12px' }}>
                        {this.state.errorInfo?.componentStack}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '20px', padding: '10px 20px', background: '#333', color: '#fff', border: 'none', cursor: 'pointer' }}
                    >
                        Recargar Página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

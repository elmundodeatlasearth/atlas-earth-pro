import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Download, Upload, Database, CheckCircle, AlertCircle, FileJson } from 'lucide-react';
import type { ExportData, ProgressSnapshot } from '../../types';
import { logAuditEvent } from '../../lib/security/audit';
import { useSecurity } from '../../context/SecurityContext';
import './DataManager.css';

const APP_VERSION = '1.0.0';

const DataManager: React.FC = () => {
    const { userData, boostHours, dailyTarget, setUserData, setBoostHours, setDailyTarget } = useData();
    const { session } = useSecurity();
    const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [importMessage, setImportMessage] = useState('');

    const handleExport = () => {
        // Get progress snapshots from localStorage
        const snapshotsJson = localStorage.getItem('atlas_progress_snapshots');
        let progressHistory: ProgressSnapshot[] = [];

        if (snapshotsJson) {
            try {
                progressHistory = JSON.parse(snapshotsJson);
            } catch (error) {
                console.error('Error parsing snapshots:', error);
            }
        }

        const exportData: ExportData = {
            version: APP_VERSION,
            exportDate: new Date().toISOString(),
            userData,
            boostHours,
            dailyTarget,
            progressHistory: progressHistory.length > 0 ? progressHistory : undefined
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `atlas-earth-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setImportStatus('success');
        setImportMessage('Datos exportados exitosamente');
        setTimeout(() => setImportStatus('idle'), 3000);
        logAuditEvent({ action: 'DATA_EXPORT', userId: session?.user?.id });
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const importedData: ExportData = JSON.parse(content);

                // Validate data structure
                if (!importedData.version || !importedData.userData) {
                    throw new Error('Formato de archivo inválido');
                }

                // Validate userData structure
                if (
                    typeof importedData.userData.common !== 'number' ||
                    typeof importedData.userData.rare !== 'number' ||
                    typeof importedData.userData.epic !== 'number' ||
                    typeof importedData.userData.legendary !== 'number' ||
                    typeof importedData.userData.badges !== 'number'
                ) {
                    throw new Error('Datos de usuario inválidos');
                }

                // Import user data
                setUserData(importedData.userData);

                if (typeof importedData.boostHours === 'number') {
                    setBoostHours(importedData.boostHours);
                }

                if (typeof importedData.dailyTarget === 'number') {
                    setDailyTarget(importedData.dailyTarget);
                }

                // Import progress history if available
                if (importedData.progressHistory && Array.isArray(importedData.progressHistory)) {
                    localStorage.setItem('atlas_progress_snapshots', JSON.stringify(importedData.progressHistory));
                }

                setImportStatus('success');
                setImportMessage(`Datos importados exitosamente (v${importedData.version})`);
                setTimeout(() => setImportStatus('idle'), 5000);
                logAuditEvent({ action: 'DATA_IMPORT', userId: session?.user?.id, metadata: { version: importedData.version } });

            } catch (error) {
                console.error('Import error:', error);
                setImportStatus('error');
                setImportMessage(error instanceof Error ? error.message : 'Error al importar datos');
                setTimeout(() => setImportStatus('idle'), 5000);
            }
        };

        reader.onerror = () => {
            setImportStatus('error');
            setImportMessage('Error al leer el archivo');
            setTimeout(() => setImportStatus('idle'), 3000);
        };

        reader.readAsText(file);

        // Reset input
        event.target.value = '';
    };

    const handleClearAllData = () => {
        if (!confirm('⚠️ ADVERTENCIA: Esto eliminará TODOS tus datos incluyendo snapshots de progreso. ¿Estás seguro?')) {
            return;
        }

        if (!confirm('Esta acción NO se puede deshacer. ¿Realmente deseas continuar?')) {
            return;
        }

        // Clear all data
        setUserData({
            common: 0,
            rare: 0,
            epic: 0,
            legendary: 0,
            badges: 0
        });
        setBoostHours(24);
        setDailyTarget(1.0);

        // Clear localStorage
        localStorage.removeItem('atlas_progress_snapshots');
        localStorage.removeItem('atlas_userdata');
        localStorage.removeItem('atlas_boosthours');
        localStorage.removeItem('atlas_dailytarget');

        setImportStatus('success');
        setImportMessage('Todos los datos han sido eliminados');
        setTimeout(() => setImportStatus('idle'), 3000);
        logAuditEvent({ action: 'DATA_CLEAR', userId: session?.user?.id });
    };

    const totalParcels = userData.common + userData.rare + userData.epic + userData.legendary;

    return (
        <div className="data-manager animate-fade-in">
            <div className="header mb-6">
                <div className="flex items-center gap-3">
                    <Database className="text-accent" size={28} />
                    <h2 className="text-2xl font-bold text-white">Gestión de Datos</h2>
                </div>
                <p className="text-muted mt-2">Exporta, importa y gestiona tus datos de Atlas Earth</p>
            </div>

            {/* Status Message */}
            {importStatus !== 'idle' && (
                <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 animate-slide-up ${importStatus === 'success'
                        ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-900/20 border-red-500/30 text-red-300'
                    }`}>
                    {importStatus === 'success' ? (
                        <CheckCircle size={20} />
                    ) : (
                        <AlertCircle size={20} />
                    )}
                    <span>{importMessage}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Data Overview */}
                <div className="glass-card p-6 border-l-4 border-blue-500">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <FileJson className="text-blue-400" size={20} />
                        Datos Actuales
                    </h3>

                    <div className="space-y-3">
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5">
                            <div className="text-xs text-muted uppercase mb-2">Parcelas</div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted">Comunes:</span>
                                    <span className="text-white font-bold">{userData.common}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Raras:</span>
                                    <span className="text-white font-bold">{userData.rare}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Épicas:</span>
                                    <span className="text-white font-bold">{userData.epic}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Legendarias:</span>
                                    <span className="text-white font-bold">{userData.legendary}</span>
                                </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-white/10 flex justify-between">
                                <span className="text-muted font-medium">Total:</span>
                                <span className="text-accent font-bold">{totalParcels}</span>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5">
                            <div className="flex justify-between items-center">
                                <span className="text-muted">Badges:</span>
                                <span className="text-white font-bold">{userData.badges}</span>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5">
                            <div className="flex justify-between items-center">
                                <span className="text-muted">Boost Hours:</span>
                                <span className="text-white font-bold">{boostHours}h/día</span>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5">
                            <div className="flex justify-between items-center">
                                <span className="text-muted">Meta Diaria:</span>
                                <span className="text-white font-bold">${dailyTarget.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                    {/* Export */}
                    <div className="glass-card p-6 border-l-4 border-emerald-500">
                        <div className="flex items-center gap-3 mb-3">
                            <Download className="text-emerald-400" size={24} />
                            <h3 className="text-lg font-bold text-white">Exportar Datos</h3>
                        </div>
                        <p className="text-sm text-muted mb-4">
                            Descarga un respaldo completo de tus datos incluyendo configuración,
                            parcelas, badges e historial de progreso.
                        </p>
                        <button
                            onClick={handleExport}
                            className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                        >
                            <Download size={18} />
                            Descargar Respaldo (JSON)
                        </button>
                    </div>

                    {/* Import */}
                    <div className="glass-card p-6 border-l-4 border-purple-500">
                        <div className="flex items-center gap-3 mb-3">
                            <Upload className="text-purple-400" size={24} />
                            <h3 className="text-lg font-bold text-white">Importar Datos</h3>
                        </div>
                        <p className="text-sm text-muted mb-4">
                            Restaura tus datos desde un archivo de respaldo previamente exportado.
                            Esto sobrescribirá tus datos actuales.
                        </p>
                        <label className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 cursor-pointer">
                            <Upload size={18} />
                            Seleccionar Archivo
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {/* Clear Data */}
                    <div className="glass-card p-6 border-l-4 border-red-500">
                        <div className="flex items-center gap-3 mb-3">
                            <AlertCircle className="text-red-400" size={24} />
                            <h3 className="text-lg font-bold text-white">Zona de Peligro</h3>
                        </div>
                        <p className="text-sm text-muted mb-4">
                            Elimina permanentemente todos tus datos. Esta acción NO se puede deshacer.
                        </p>
                        <button
                            onClick={handleClearAllData}
                            className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                        >
                            Eliminar Todos los Datos
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="mt-6 glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-3">ℹ️ Información</h3>
                <div className="space-y-2 text-sm text-muted">
                    <p>
                        • Los datos se guardan automáticamente en tu navegador (localStorage)
                    </p>
                    <p>
                        • Si tienes una cuenta, tus datos también se sincronizan en la nube de forma segura
                    </p>
                    <p>
                        • Exporta regularmente tus datos como respaldo de seguridad
                    </p>
                    <p>
                        • Los archivos exportados están en formato JSON y son compatibles con futuras versiones
                    </p>
                    <p className="text-accent font-medium">
                        • Versión actual de la aplicación: {APP_VERSION}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DataManager;

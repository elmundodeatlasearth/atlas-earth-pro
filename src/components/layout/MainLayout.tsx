import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Calculator, Target, LogOut, Menu, X, Shield, GitCompare, Clock, TrendingUp, Database, Edit3 } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { useData } from '../../context/DataContext';
import { QuickParcelModal } from '../ui/QuickParcelModal';
import './MainLayout.css';

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
    const { logout } = useSecurity();
    const { userData } = useData();

    const totalParcels = userData.common + userData.rare + userData.epic + userData.legendary;

    const navItems = [
        { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/calculator', icon: <Calculator size={20} />, label: 'Calculadora' },
        { path: '/goals', icon: <Target size={20} />, label: 'Metas' },
        { path: '/comparison', icon: <GitCompare size={20} />, label: 'Comparador' },
        { path: '/time-to-goal', icon: <Clock size={20} />, label: 'Tiempo a Meta' },
        { path: '/progress', icon: <TrendingUp size={20} />, label: 'Progreso' },
        { path: '/data', icon: <Database size={20} />, label: 'Datos' },
        { path: '/subscriptions', icon: <Shield size={20} />, label: 'Suscripciones' },
    ];

    return (
        <div className="layout-container">
            {/* Mobile Header */}
            <header className="mobile-header">
                <Link to="/" className="logo">
                    <span className="accent-text">ATLAS</span> TRACKER
                </Link>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsQuickEditOpen(true)}
                        className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5"
                    >
                        <Edit3 size={14} />
                        <span>{totalParcels} P</span>
                    </button>
                    <button className="menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </header>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`sidebar glass-card ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/" className="logo desktop-only">
                        <span className="accent-text">ATLAS</span> TRACKER
                    </Link>

                    {/* Quick Inventory Summary Box */}
                    <div className="mt-3 p-2.5 bg-slate-900/60 rounded-lg border border-white/5 flex items-center justify-between">
                        <div className="text-left">
                            <div className="text-[10px] text-muted uppercase font-bold tracking-wider">Mi Inventario</div>
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                                <span className="text-emerald-400">{totalParcels} Parcelas</span>
                                <span className="text-amber-400 text-xs">({userData.badges} B)</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsQuickEditOpen(true)}
                            className="p-1.5 bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600 hover:text-white rounded transition-colors"
                            title="Editar Inventario Rápido"
                        >
                            <Edit3 size={16} />
                        </button>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={(props: any) => `nav-item ${props.isActive ? 'active' : ''}`}
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn mb-md" onClick={logout}>
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                    <div className="text-muted font-xs text-center opacity-50">
                        System Architect: <br />
                        <span className="text-accent font-bold">Ricardo Sánchez</span>
                    </div>
                </div>
            </aside>

            <main className="content">
                <div className="container">
                    {children}
                </div>
            </main>

            {/* Quick Parcel Modal */}
            <QuickParcelModal
                isOpen={isQuickEditOpen}
                onClose={() => setIsQuickEditOpen(false)}
            />
        </div>
    );
};

export default MainLayout;


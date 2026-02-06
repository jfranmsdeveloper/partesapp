import { useState, useMemo } from 'react';
import { useUserStore } from '../../hooks/useUserStore';
import { KPICard } from '../../components/dashboard/KPICard';
import { StatusDistributionChart } from '../../components/dashboard/StatusDistributionChart';

import { FileText, Clock, CheckCircle, Activity, FileDown, Calendar, Users, TrendingUp, ArrowRight } from 'lucide-react';
import { ACTUACION_CONFIG } from '../../utils/actuacionConfig';
import { Button } from '../../components/ui/Button';
import { ReportModal } from '../../components/reports/ReportModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '../../components/ui/Card';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { partes, users } = useUserStore();
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<string>('all');

    // Current Date
    const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

    // Filtered Partes based on selection
    const filteredPartes = useMemo(() => {
        if (selectedUser === 'all') return partes;
        return partes.filter(p => p.userId === selectedUser);
    }, [partes, selectedUser]);

    // --- Complex Metrics Calculation (using filteredPartes) ---
    const metrics = useMemo(() => {
        const currentPartes = filteredPartes; // Use the filtered list

        const totalPartes = currentPartes.length;
        const totalTime = currentPartes.reduce((acc, p) => acc + p.totalTime, 0);
        const closedPartes = currentPartes.filter(p => p.status === 'CERRADO').length;

        // Active Users (Unique count based on createdBy or userId if available)
        const activeUsersCount = new Set(currentPartes.map(p => p.createdBy)).size;

        // Status Distribution
        const statusData = [
            { name: 'ABIERTO', value: currentPartes.filter(p => p.status === 'ABIERTO').length, color: '#f59e0b' },
            { name: 'EN TRÁMITE', value: currentPartes.filter(p => p.status === 'EN TRÁMITE').length, color: '#3b82f6' },
            { name: 'CERRADO', value: currentPartes.filter(p => p.status === 'CERRADO').length, color: '#10b981' },

        ].filter(d => d.value > 0);

        // Activity Types
        const activityCounts: Record<string, number> = {};
        currentPartes.forEach(p => {
            p.actuaciones.forEach(a => {
                activityCounts[a.type] = (activityCounts[a.type] || 0) + 1;
            });
        });

        const activityData = Object.keys(ACTUACION_CONFIG)
            .map(type => ({
                name: type,
                count: activityCounts[type] || 0
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Top 5 activities

        // Recent Activity (Partes updated recently)
        const recentPartes = [...currentPartes]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);

        return {
            totalPartes,
            totalTime,
            closedPartes,
            avgTime: totalPartes > 0 ? Math.round(totalTime / totalPartes) : 0,
            activeUsersCount,
            statusData,
            activityData,
            recentPartes
        };
    }, [filteredPartes]);

    return (
        <div className="min-h-screen bg-[#f2f4f8] dark:bg-[#0c0c0e] pb-24 font-sans selection:bg-indigo-500/30">
            {/* Animated Mesh Gradient Background - Subtle & Premium */}
            <div className="fixed inset-0 pointer-events-none opacity-60 dark:opacity-30">
                <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] bg-rose-200/40 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-normal animate-blob" />
                <div className="absolute top-[-10%] right-[-10%] w-[70vw] h-[70vw] bg-indigo-200/40 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-normal animate-blob animation-delay-2000" />
                <div className="absolute bottom-[-20%] left-[20%] w-[70vw] h-[70vw] bg-blue-200/40 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-normal animate-blob animation-delay-4000" />
            </div>

            <div className="relative z-10 max-w-[1920px] mx-auto p-6 md:p-12 space-y-12">

                {/* iOS Header - Clean & Big */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pl-2">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/5 backdrop-blur-md shadow-sm">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-300" />
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{today}</span>
                        </div>
                        <h1 className="text-6xl md:text-7xl font-display font-medium text-slate-900 dark:text-white tracking-[-0.03em] drop-shadow-sm">
                            Dashboard
                        </h1>
                        <p className="text-xl md:text-2xl font-light text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                            Resumen ejecutivo de tu actividad en <span className="font-semibold text-slate-800 dark:text-slate-200">AppGest</span>
                        </p>
                    </div>

                    <Button
                        onClick={() => setIsReportModalOpen(true)}
                        className="group relative overflow-hidden bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-[24px] px-8 py-6 shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                        <div className="relative flex items-center gap-3 font-semibold text-lg">
                            <FileDown className="w-5 h-5" />
                            <span>Exportar Informe</span>
                        </div>
                    </Button>
                </div>

                {/* User Filters - Centered & Premium Pills */}
                <div className="flex justify-center w-full">
                    <div className="flex items-center gap-3 overflow-x-auto py-2 px-4 max-w-full scrollbar-hide no-scrollbar mask-grad-x">
                        <button
                            onClick={() => setSelectedUser('all')}
                            className={clsx(
                                "flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 shadow-sm whitespace-nowrap",
                                selectedUser === 'all'
                                    ? "bg-brand-gradient text-white scale-105 shadow-lg shadow-orange-500/20"
                                    : "bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:scale-105"
                            )}
                        >
                            <Users className="w-4 h-4" />
                            Global
                        </button>

                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" />

                        {users.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => setSelectedUser(user.id || '')}
                                className={clsx(
                                    "flex items-center gap-3 pl-2 pr-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 shadow-sm whitespace-nowrap border border-transparent",
                                    selectedUser === user.id
                                        ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50 scale-105 shadow-xl shadow-indigo-500/10"
                                        : "bg-white/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-700 hover:scale-105"
                                )}
                            >
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-800" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-slate-800">
                                        {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <span>{user.user_metadata?.full_name?.split(' ')[0] || user.email.split('@')[0]}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPI Grid - Pastel & Glass */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard
                        title="Total Partes"
                        value={metrics.totalPartes}
                        icon={FileText}
                        color="indigo"
                        trend={{ value: 12, isPositive: true }}
                    />
                    <KPICard
                        title="Tiempo Total"
                        value={`${metrics.totalTime}m`}
                        icon={Clock}
                        color="orange"
                    />
                    <KPICard
                        title="Eficiencia"
                        value={`${metrics.totalPartes > 0 ? Math.round((metrics.closedPartes / metrics.totalPartes) * 100) : 0}%`}
                        icon={TrendingUp}
                        color="green"
                    />
                    <KPICard
                        title="Usuarios Activos"
                        value={metrics.activeUsersCount}
                        icon={Users}
                        color="rose"
                    />
                </div>

                {/* Hero Section: Full Width Glass Graph */}
                <section className="relative rounded-[3rem] bg-white/40 dark:bg-slate-800/40 backdrop-blur-3xl border border-white/60 dark:border-white/5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] p-12 overflow-hidden hover:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.1)] transition-shadow duration-500">
                    <div className="flex flex-col lg:flex-row gap-16 items-center">
                        <div className="lg:w-1/3 space-y-8 relative z-10">
                            <div className="space-y-4">
                                <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Distribución Global</h2>
                                <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                                    Vista panorámica del estado de los partes. La mayoría de los casos se encuentran actualmente en gestión activa.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {metrics.statusData.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between p-5 rounded-[20px] bg-white/60 dark:bg-slate-700/30 border border-white/50 dark:border-white/5 hover:bg-white/80 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
                                            <span className="font-semibold text-slate-600 dark:text-slate-300 tracking-wide">{item.name}</span>
                                        </div>
                                        <span className="text-xl font-bold text-slate-800 dark:text-white">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lg:w-2/3 w-full h-[500px] relative">
                            {/* Ultra-soft glow behind chart */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-100/50 dark:bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none" />
                            <StatusDistributionChart data={metrics.statusData} />
                        </div>
                    </div>
                </section>

                {/* Bottom Grid: 2 Columns */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                    {/* Activity Feed - Clean & Modern */}
                    <Card className="rounded-[2.5rem] bg-white/50 dark:bg-slate-800/50 backdrop-blur-3xl border-white/60 dark:border-white/5 p-10 shadow-lg">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                            <div>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Actividad Reciente</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">Últimos movimientos en la plataforma</p>
                            </div>
                            <Button variant="ghost" className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full px-6">
                                Ver historial completo
                            </Button>
                        </div>

                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-8 top-4 bottom-4 w-px bg-slate-200 dark:bg-slate-700/50" />

                            <div className="space-y-8">
                                {metrics.recentPartes.map((parte) => (
                                    <Link key={parte.id} to={`/parte/${parte.id}`} className="group relative flex items-start pl-4 hover:translate-x-2 transition-transform duration-300">
                                        <div className="absolute left-0 top-0 bottom-0 w-full rounded-2xl bg-white/0 group-hover:bg-white/40 dark:group-hover:bg-white/5 transition-colors -z-10 -ml-2 -my-2" />

                                        <div className={clsx(
                                            "relative z-10 w-16 h-16 rounded-[1.2rem] flex-shrink-0 flex items-center justify-center text-lg font-bold shadow-sm ring-4 ring-white dark:ring-slate-800 transition-all group-hover:scale-110",
                                            parte.status === 'CERRADO' ? 'bg-emerald-100 text-emerald-600' :
                                                parte.status === 'EN TRÁMITE' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
                                        )}>
                                            {parte.status === 'CERRADO' ? <CheckCircle className="w-8 h-8" /> :
                                                parte.status === 'EN TRÁMITE' ? <Activity className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
                                        </div>

                                        <div className="ml-6 pt-1 flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h4 className="text-lg font-bold text-slate-900 dark:text-white truncate pr-4 group-hover:text-indigo-600 transition-colors">{parte.title}</h4>
                                                <span className="text-xs font-semibold text-slate-400 whitespace-nowrap bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                                                    {format(new Date(parte.createdAt), 'HH:mm', { locale: es })}
                                                </span>
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm truncate">
                                                Registrado por <span className="font-medium text-slate-700 dark:text-slate-300">Usuario #{parte.createdBy}</span>
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Right Column Stack */}
                    <div className="space-y-8">
                        {/* Activities Grid - Colorful Squircles */}
                        <div className="grid grid-cols-2 gap-6">
                            {metrics.activityData.slice(0, 4).map((act, idx) => {
                                const colors = [
                                    'from-blue-200 to-indigo-200 text-indigo-700',
                                    'from-rose-200 to-orange-200 text-orange-700',
                                    'from-emerald-200 to-teal-200 text-teal-700',
                                    'from-violet-200 to-fuchsia-200 text-fuchsia-700'
                                ];
                                const colorClass = colors[idx % colors.length];

                                return (
                                    <div key={act.name} className={`relative p-8 rounded-[2.5rem] bg-gradient-to-br ${colorClass} bg-opacity-30 border border-white/40 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[240px]`}>
                                        <div className="bg-white/60 backdrop-blur-md w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                                            <span className="font-bold text-lg">{idx + 1}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold opacity-70 uppercase tracking-widest mb-2">Tipo</p>
                                            <h4 className="text-2xl font-black mb-1 truncate leading-tight" title={act.name}>{act.name}</h4>
                                            <p className="text-4xl font-light opacity-90">{act.count}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Efficiency Card */}
                        <div className="rounded-[2.5rem] bg-slate-900 text-white p-10 relative overflow-hidden shadow-2xl">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-emerald-500/30 via-transparent to-transparent blur-3xl" />

                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold mb-2">Rendimiento</h3>
                                    <p className="text-slate-400">Tasa de resolución semanal</p>
                                </div>

                                <div className="mt-8 flex items-end gap-4">
                                    <span className="text-7xl font-sans font-thin tracking-tighter">
                                        {metrics.totalPartes > 0 ? Math.round((metrics.closedPartes / metrics.totalPartes) * 100) : 0}%
                                    </span>
                                    <div className="mb-4 flex flex-col items-start">
                                        <span className="text-emerald-400 font-bold flex items-center text-sm bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                            <ArrowRight className="w-4 h-4 mr-1" />
                                            Óptimo
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
            />
        </div>
    );
}

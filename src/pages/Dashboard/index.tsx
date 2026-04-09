import { useState, useMemo } from 'react';
import { useUserStore } from '../../hooks/useUserStore';
import { KPICard } from '../../components/dashboard/KPICard';
import { StatusDistributionChart } from '../../components/dashboard/StatusDistributionChart';

import { FileText, Clock, CheckCircle, Activity, FileDown, Calendar, Users, TrendingUp, ArrowRight, FileUp, Files, Loader2 } from 'lucide-react';
import { ACTUACION_CONFIG } from '../../utils/actuacionConfig';
import { Button } from '../../components/ui/Button';
import { ReportModal } from '../../components/reports/ReportModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '../../components/ui/Card';
import clsx from 'clsx';
import { Link, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { parsePartePDF } from '../../utils/pdfParser';

export default function Dashboard() {
    const navigate = useNavigate();
    const { partes, currentUser, addParte, upsertClientFromPDF } = useUserStore();
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // Bulk Upload State
    const [isBulkUploading, setIsBulkUploading] = useState(false);
    const bulkInputRef = useRef<HTMLInputElement>(null);
    
    // Strictly filter to current user only as requested
    const selectedUserId = currentUser?.id || currentUser?.email;

    // Current Date
    const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

    // Filtered Partes based on active session
    const filteredPartes = useMemo(() => {
        if (!selectedUserId) return [];
        return partes.filter(p => p.userId === selectedUserId || p.createdBy === (currentUser?.user_metadata?.full_name || currentUser?.name));
    }, [partes, selectedUserId, currentUser]);

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

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setIsBulkUploading(true);
        let successCount = 0;
        let errorCount = 0;

        for (const file of files) {
            try {
                const data = await parsePartePDF(file);
                
                let clientId = undefined;
                if (data.createdBy) {
                    clientId = await upsertClientFromPDF(data.createdBy, data.createdByCode) || undefined;
                }

                let createdAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
                if (data.date) {
                    const [d, m, y] = data.date.split(/[-/]/);
                    const dateStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                    let timeStr = data.time || '09:00';
                    createdAt = `${dateStr} ${timeStr}:00`;
                }

                await addParte({
                    title: data.title || `Parte importado - ${file.name}`,
                    status: 'ABIERTO',
                    createdBy: data.createdBy || 'Sistema',
                    id: data.id || undefined,
                    createdAt: createdAt,
                    pdfFile: data.pdfFile,
                    clientId: clientId
                });

                successCount++;
            } catch (err) {
                console.error(`Error importing ${file.name}:`, err);
                errorCount++;
            }
        }

        setIsBulkUploading(false);
        if (e.target) e.target.value = '';

        if (errorCount === 0) {
            alert(`✅ ¡Éxito! Se han importado ${successCount} partes correctamente.`);
            navigate('/management');
        } else {
            alert(`⚠️ Se importaron ${successCount} partes, pero hubo errores en ${errorCount} archivos.`);
            navigate('/management');
        }
    };

    return (
        <div className="w-full font-sans selection:bg-orange-500/30">
            <div className="relative z-10 w-full mx-auto space-y-8">

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

                    <div className="flex flex-wrap gap-4">
                        <Button
                            onClick={() => navigate('/new')}
                            variant="primary"
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-[20px] px-6 py-4 shadow-xl border-0"
                        >
                            <FileUp className="w-5 h-5 mr-2" />
                            Importar PDF Individual
                        </Button>

                        <Button
                            onClick={() => bulkInputRef.current?.click()}
                            variant="primary"
                            disabled={isBulkUploading}
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-[20px] px-6 py-4 shadow-xl border-0"
                        >
                            {isBulkUploading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Files className="w-5 h-5 mr-2" />}
                            Carga Masiva PDF
                        </Button>
                        <input
                            type="file"
                            multiple
                            accept=".pdf"
                            ref={bulkInputRef}
                            className="hidden"
                            onChange={handleBulkUpload}
                        />

                        <Button
                            onClick={() => setIsReportModalOpen(true)}
                            variant="outline"
                            className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-[20px] px-6 py-4 shadow-md hover:bg-slate-50 border-slate-200 dark:border-slate-700"
                        >
                            <FileDown className="w-5 h-5 mr-2" />
                            Exportar Informe
                        </Button>
                    </div>
                </div>

                {/* User Filters - Removed as per request (Only show own data) */}

                {/* KPI Grid - Pastel & Glass */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard
                        title="Total Partes"
                        value={metrics.totalPartes}
                        icon={FileText}
                        color="orange"
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

                {/* Hero Section: Bento Solid Graph */}
                <section className="relative rounded-[2rem] bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border p-8 md:p-12 shadow-sm transition-shadow duration-300 hover:shadow-md">
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
                                    <div key={item.name} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-dark-border hover:bg-slate-100 dark:hover:border-slate-600 transition-colors duration-200">
                                        <div className="flex items-center gap-4">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="font-semibold text-slate-700 dark:text-slate-300 tracking-wide">{item.name}</span>
                                        </div>
                                        <span className="text-xl font-bold text-slate-800 dark:text-white">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lg:w-2/3 w-full h-[500px] relative">
                            <StatusDistributionChart data={metrics.statusData} />
                        </div>
                    </div>
                </section>

                {/* Bottom Grid: 2 Columns */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                    {/* Activity Feed - Clean & Modern */}
                    <Card className="p-8 md:p-10">
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
                                    'text-indigo-600 dark:text-indigo-400',
                                    'text-orange-600 dark:text-orange-400',
                                    'text-emerald-600 dark:text-emerald-400',
                                    'text-rose-600 dark:text-rose-400'
                                ];
                                const colorClass = colors[idx % colors.length];

                                return (
                                    <div key={act.name} className={`relative p-8 rounded-[2rem] bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-dark-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[240px]`}>
                                        <div className="bg-white dark:bg-dark-card w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm mb-4 border border-slate-100 dark:border-dark-border">
                                            <span className={`font-bold text-lg ${colorClass}`}>{idx + 1}</span>
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
                        <div className="rounded-[2rem] bg-orange-500 text-white p-10 relative overflow-hidden shadow-sm">
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

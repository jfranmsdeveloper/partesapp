import { useState, useMemo } from 'react';
import { useUserStore } from '../../hooks/useUserStore';
import { TimePerClientChart } from '../../components/dashboard/TimePerClientChart';
import { ActivityTypeChart } from '../../components/dashboard/ActivityTypeChart';
import { TrendChart } from '../../components/dashboard/TrendChart';
import { StatusDistributionChart } from '../../components/dashboard/StatusDistributionChart';
import { Card } from '../../components/ui/Card';
import { Users, TrendingUp, Clock } from 'lucide-react';
import {
    format,
    subDays,
    startOfDay,
    endOfDay,
    isWithinInterval,
    parseISO
} from 'date-fns';
import clsx from 'clsx';

export default function Analytics() {
    const { partes, users } = useUserStore();
    const [range, setRange] = useState<number>(30); // Default 30 days
    const selectedUser = 'all'; // Keep as constant for now to avoid unused state

    // Filter logic
    const filteredPartes = useMemo(() => {
        const start = startOfDay(subDays(new Date(), range));
        const end = endOfDay(new Date());

        return partes.filter(p => {
            const date = p.createdAt.includes('T') ? parseISO(p.createdAt) : new Date(p.createdAt);
            const isInRange = isWithinInterval(date, { start, end });
            const isSelectedUser = selectedUser === 'all' || p.userId === selectedUser;
            return isInRange && isSelectedUser;
        });
    }, [partes, range, selectedUser]);

    // Data Mapping for Charts
    const analyticsData = useMemo(() => {
        // 1. Time per Client
        const clientMap: Record<string, number> = {};
        filteredPartes.forEach(p => {
            const clientName = p.clientName || 'Sin Cliente';
            clientMap[clientName] = (clientMap[clientName] || 0) + p.totalTime;
        });
        const timePerClient = Object.entries(clientMap).map(([name, duration]) => ({ name, duration }));

        // 2. Trend (Daily Activity)
        const trendMap: Record<string, number> = {};
        // Initialize last X days with 0
        for (let i = range; i >= 0; i--) {
            const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
            trendMap[d] = 0;
        }
        filteredPartes.forEach(p => {
            // Use p.createdAt (which is start_date if available) for the trend
            const date = p.createdAt.includes('T') ? parseISO(p.createdAt) : new Date(p.createdAt);
            const d = format(date, 'yyyy-MM-dd');
            if (trendMap[d] !== undefined) {
                trendMap[d] += 1; // Count the number of partes per day
            }
        });
        const trendData = Object.entries(trendMap).map(([date, count]) => ({ date, count }));

        // 3. Activity Types
        const activityMap: Record<string, number> = {};
        filteredPartes.forEach(p => {
            p.actuaciones.forEach(a => {
                activityMap[a.type] = (activityMap[a.type] || 0) + 1;
            });
        });
        const activityData = Object.entries(activityMap).map(([name, count]) => ({ name, count }));

        // 4. User Distribution (Workload)
        const userWorkMap: Record<string, number> = {};
        filteredPartes.forEach(p => {
            const u = users.find(user => user.id === p.userId);
            const name = u?.user_metadata?.full_name || u?.name || 'Desconocido';
            userWorkMap[name] = (userWorkMap[name] || 0) + p.totalTime;
        });
        const userDistribution = Object.entries(userWorkMap).map(([name, value], idx) => ({
            name,
            value,
            color: [
                '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec42f3', '#06b6d4'
            ][idx % 7]
        }));

        // Summary Metrics
        const totalDuration = filteredPartes.reduce((acc, p) => acc + p.totalTime, 0);
        const totalActions = filteredPartes.reduce((acc, p) => acc + p.actuaciones.length, 0);
        const totalPartes = filteredPartes.length;

        return {
            timePerClient,
            trendData,
            activityData,
            userDistribution,
            metrics: {
                totalDuration,
                totalActions,
                totalPartes,
                avgDuration: totalPartes > 0 ? Math.round(totalDuration / totalPartes) : 0
            }
        };
    }, [filteredPartes, range, users]);

    return (
        <div className="w-full space-y-8 pb-20">
            {/* Header section with Glass design */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 w-fit">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Panel de Analíticas</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">Visual Insights</h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-light max-w-xl">
                        Analiza el rendimiento del equipo y la distribución del tiempo por clientes en los últimos <span className="font-bold text-slate-900 dark:text-white">{range} días</span>.
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white/50 dark:bg-slate-800/50 p-2 rounded-2xl border border-white/20 dark:border-white/10 backdrop-blur-md shadow-sm">
                    {[7, 30, 90].map(d => (
                        <button
                            key={d}
                            onClick={() => setRange(d)}
                            className={clsx(
                                "px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter transition-all duration-300",
                                range === d 
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105" 
                                    : "text-slate-500 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600"
                            )}
                        >
                            {d} Días
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-8 rounded-[2rem] bg-indigo-500 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                        <Clock className="w-16 h-16" />
                    </div>
                    <p className="text-indigo-100 text-xs font-black uppercase tracking-[0.2em] mb-1">Tiempo Total</p>
                    <h3 className="text-4xl font-black tabular-nums">{analyticsData.metrics.totalDuration} <span className="text-lg font-light opacity-80">min</span></h3>
                    <div className="mt-4 w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full" style={{ width: '70%' }} />
                    </div>
                </div>

                <Card className="p-8 flex flex-col justify-between border-slate-100 dark:border-slate-800">
                    <div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-1">Partes Registrados</p>
                        <h3 className="text-4xl font-black tabular-nums text-slate-900 dark:text-white">{analyticsData.metrics.totalPartes}</h3>
                    </div>
                    <div className="flex items-center gap-2 mt-4 text-emerald-500 text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded w-fit">
                        <TrendingUp className="w-3 h-3" />
                        <span>En rango</span>
                    </div>
                </Card>

                <Card className="p-8 flex flex-col justify-between border-slate-100 dark:border-slate-800">
                    <div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-1">Actuaciones</p>
                        <h3 className="text-4xl font-black tabular-nums text-slate-900 dark:text-white">{analyticsData.metrics.totalActions}</h3>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-4">Total de acciones realizadas</p>
                </Card>

                <Card className="p-8 flex flex-col justify-between border-slate-100 dark:border-slate-800">
                    <div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-1">Promedio por Parte</p>
                        <h3 className="text-4xl font-black tabular-nums text-slate-900 dark:text-white">{analyticsData.metrics.avgDuration} <span className="text-lg font-light">m</span></h3>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-4">Duración media por registro</p>
                </Card>
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Time Per Client - Horizontal Bar */}
                <div className="lg:col-span-2">
                    <TimePerClientChart data={analyticsData.timePerClient} />
                </div>

                {/* 2. Trend Area Chart */}
                <div className="lg:col-span-2">
                    <TrendChart data={analyticsData.trendData} />
                </div>

                {/* 3. Workload Distribution */}
                <Card className="p-8 space-y-8 flex flex-col">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Carga por Usuario</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Distribución de horas por integrante</p>
                        </div>
                        <Users className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-h-[400px]">
                        <StatusDistributionChart data={analyticsData.userDistribution} />
                    </div>
                </Card>

                {/* 4. Activity Type Breakdown */}
                <ActivityTypeChart data={analyticsData.activityData} />
            </div>
        </div>
    );
}

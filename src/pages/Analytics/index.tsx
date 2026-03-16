import { useState, useMemo } from 'react';
import { useUserStore } from '../../hooks/useUserStore';
import { TimePerClientChart } from '../../components/dashboard/TimePerClientChart';
import { ActivityTypeChart } from '../../components/dashboard/ActivityTypeChart';
import { TrendChart } from '../../components/dashboard/TrendChart';
import { Card } from '../../components/ui/Card';
import { Clock, Activity, Users, BarChart3, ArrowUpRight, Zap } from 'lucide-react';
import {
    format,
    subDays,
    startOfDay,
    endOfDay,
    isWithinInterval,
    parseISO
} from 'date-fns';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export default function Analytics() {
    const { partes, users, currentUser } = useUserStore();
    const [range, setRange] = useState<number>(30); // Default 30 days
    const selectedUserId = currentUser?.id || currentUser?.email;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring' as const,
                stiffness: 100
            }
        }
    };

    // Filter logic
    const filteredPartes = useMemo(() => {
        const start = startOfDay(subDays(new Date(), range));
        const end = endOfDay(new Date());
        const userRole = currentUser?.role || currentUser?.user_metadata?.role;
        const isAdmin = userRole === 'admin';

        return partes.filter(p => {
            if (!p.createdAt) return false;
            try {
                // Better date parsing handling multiple formats
                let date: Date;
                const raw = p.createdAt;
                if (raw.includes('T')) {
                    date = parseISO(raw);
                } else if (raw.includes('-')) {
                    // YYYY-MM-DD HH:MM:SS
                    date = new Date(raw.replace(' ', 'T'));
                } else {
                    date = new Date(raw);
                }

                if (isNaN(date.getTime())) return false;

                const isInRange = isWithinInterval(date, { start, end });
                
                // If admin, show all. If user, show only theirs.
                if (isAdmin) return isInRange;

                const userMatch = selectedUserId && (
                    String(p.userId) === String(selectedUserId) || 
                    p.createdBy === currentUser?.email ||
                    p.createdBy === (currentUser?.user_metadata?.full_name || currentUser?.name)
                );
                
                return isInRange && userMatch;
            } catch (e) {
                return false;
            }
        });
    }, [partes, range, selectedUserId, currentUser]);

    // Data Mapping for Charts
    const analyticsData = useMemo(() => {
        const userMap: Record<string, number> = {};
        filteredPartes.forEach(p => {
            const userName = p.createdBy || 'Sistema';
            userMap[userName] = (userMap[userName] || 0) + p.totalTime;
        });
        const timePerUser = Object.entries(userMap)
            .map(([name, duration]) => ({ name, duration }))
            .sort((a, b) => b.duration - a.duration);

        const trendMap: Record<string, number> = {};
        for (let i = range; i >= 0; i--) {
            const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
            trendMap[d] = 0;
        }
        filteredPartes.forEach(p => {
            const raw = p.createdAt;
            const date = raw.includes('T') ? parseISO(raw) : new Date(raw.replace(' ', 'T'));
            if (!isNaN(date.getTime())) {
                const d = format(date, 'yyyy-MM-dd');
                if (trendMap[d] !== undefined) trendMap[d] += 1;
            }
        });
        const trendData = Object.entries(trendMap).map(([date, count]) => ({ date, count }));

        const activityMap: Record<string, number> = {};
        filteredPartes.forEach(p => {
            p.actuaciones.forEach(a => {
                activityMap[a.type] = (activityMap[a.type] || 0) + 1;
            });
        });
        const activityData = Object.entries(activityMap).map(([name, count]) => ({ name, count }));

        const totalDuration = filteredPartes.reduce((acc, p) => acc + p.totalTime, 0);
        const totalActions = filteredPartes.reduce((acc, p) => acc + p.actuaciones.length, 0);
        const totalPartes = filteredPartes.length;

        return {
            timePerUser,
            trendData,
            activityData,
            metrics: {
                totalDuration,
                totalActions,
                totalPartes,
                avgDuration: totalPartes > 0 ? Math.round(totalDuration / totalPartes) : 0
            }
        };
    }, [filteredPartes, range]);

    return (
        <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="w-full space-y-8 pb-24"
        >
            {/* Header section with Premium design */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 py-6">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900 dark:bg-slate-800 text-white border border-white/10 shadow-xl">
                        <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Data Engine v2025</span>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                        Intelligence <span className="text-indigo-600 dark:text-indigo-400">Hub</span>
                    </h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
                        Visualización avanzada de métricas y rendimiento para los últimos {range} días.
                    </p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 backdrop-blur-xl">
                    {[7, 30, 90].map(d => (
                        <button
                            key={d}
                            onClick={() => setRange(d)}
                            className={clsx(
                                "px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300",
                                range === d 
                                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg ring-1 ring-slate-200 dark:ring-white/10 scale-105" 
                                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50"
                            )}
                        >
                            {d}D
                        </button>
                    ))}
                </div>
            </div>

            {/* Bento Grid - Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 h-auto md:h-[400px]">
                {/* Main Hero Card */}
                <motion.div 
                    variants={itemVariants}
                    className="md:col-span-2 md:row-span-2 p-10 rounded-[2.5rem] bg-indigo-600 dark:bg-indigo-500 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between group cursor-default"
                >
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-700" />
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl" />
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                           <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30">
                               <Clock className="w-8 h-8 text-white" />
                           </div>
                           <div className="text-right">
                               <div className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Status</div>
                               <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold backdrop-blur-md">LIVE DATA</div>
                           </div>
                        </div>
                        <div className="mt-12">
                            <p className="text-indigo-100 text-xs font-black uppercase tracking-[0.3em] mb-2">Inversión Total Acumulada</p>
                            <h3 className="text-8xl font-black tabular-nums tracking-tighter leading-tight">
                                {analyticsData.metrics.totalDuration}
                                <span className="text-2xl font-light opacity-60 ml-3">min</span>
                            </h3>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-end justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-3">
                                {users.slice(0, 3).map((u, i) => (
                                    <div key={i} className="w-10 h-10 rounded-full bg-indigo-400 border-4 border-indigo-600 flex items-center justify-center font-black text-xs">
                                        {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full rounded-full object-cover" /> : u.name?.charAt(0)}
                                    </div>
                                ))}
                            </div>
                            <span className="text-xs font-bold text-indigo-100">Equipos Activos</span>
                        </div>
                        <ArrowUpRight className="w-10 h-10 text-white/40" />
                    </div>
                </motion.div>

                {/* Second Level Cards */}
                <motion.div 
                    variants={itemVariants}
                    className="md:col-span-1 md:row-span-1 p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl flex flex-col justify-between group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-300"
                >
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl text-indigo-600">
                            <Activity className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">+{range}%</span>
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Partes Registrados</p>
                        <h3 className="text-4xl font-black text-slate-800 dark:text-white tabular-nums tracking-tight">
                            {analyticsData.metrics.totalPartes}
                        </h3>
                    </div>
                </motion.div>

                <motion.div 
                    variants={itemVariants}
                    className="md:col-span-1 md:row-span-1 p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl flex flex-col justify-between hover:scale-[1.02] transition-transform duration-300"
                >
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-500">
                            <Zap className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Actuaciones</p>
                        <h3 className="text-4xl font-black text-slate-800 dark:text-white tabular-nums tracking-tight">
                            {analyticsData.metrics.totalActions}
                        </h3>
                    </div>
                </motion.div>

                {/* Third Level Wide Card */}
                <motion.div 
                    variants={itemVariants}
                    className="md:col-span-2 md:row-span-1 p-8 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl flex items-center justify-between overflow-hidden relative"
                >
                    <div className="absolute right-0 bottom-0 opacity-10">
                        <BarChart3 className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Promedio por Parte</p>
                        <h3 className="text-5xl font-black tabular-nums tracking-tight">
                            {analyticsData.metrics.avgDuration}
                            <span className="text-xl font-light opacity-60 ml-2">min/reg</span>
                        </h3>
                    </div>
                    <div className="relative z-10 h-16 w-32 bg-slate-800 dark:bg-slate-100 rounded-2xl flex items-center justify-center border border-white/10 dark:border-slate-200">
                         <div className="flex gap-1.5 items-end">
                            {[4, 7, 2, 8, 5, 9, 6].map((h, i) => (
                                <div key={i} className="w-2 bg-indigo-500 rounded-full" style={{ height: `${h * 4}px` }} />
                            ))}
                         </div>
                    </div>
                </motion.div>
            </div>

            {/* Detailed Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
                {/* 1. Time Per User - Premium Large Chart */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card className="p-10 rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden relative">
                        <div className="flex justify-between items-center mb-10">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Rendimiento por Técnico</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Inversión de tiempo acumulada por usuario</p>
                            </div>
                            <Users className="w-6 h-6 text-slate-300" />
                        </div>
                        <div className="min-h-[400px]">
                            {analyticsData.timePerUser.length > 0 ? (
                                <TimePerClientChart data={analyticsData.timePerUser} />
                            ) : (
                                <div className="h-[400px] flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 transition-all duration-300">
                                    <Users className="w-16 h-16 mb-4 opacity-10" />
                                    <p className="text-sm font-bold tracking-tight opacity-50">No hay datos de técnicos para este periodo</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </motion.div>

                {/* 2. Side Panel with Trend and Info */}
                <div className="lg:col-span-1 space-y-8">
                    <motion.div variants={itemVariants}>
                        <Card className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-xl border-none h-[400px] flex flex-col relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                             <div className="mb-6 relative z-10">
                                <h3 className="text-xl font-black tracking-tight">Tendencia de Registro</h3>
                                <p className="text-indigo-100/70 text-xs">Actividad diaria últimos {range} días</p>
                            </div>
                            <div className="flex-1 min-h-0 relative z-10">
                                <TrendChart data={analyticsData.trendData} />
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl h-[332px] flex flex-col">
                             <div className="mb-6">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Categorías</h3>
                                <p className="text-slate-500 text-xs">Distribución de tipos de actuación</p>
                            </div>
                            <div className="flex-1 min-h-0">
                                <ActivityTypeChart data={analyticsData.activityData} />
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}

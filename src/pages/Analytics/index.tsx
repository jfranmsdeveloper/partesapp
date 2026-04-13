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

        const totalLlamadas = (activityMap['Llamada Realizada'] || 0) + (activityMap['Llamada Recibida'] || 0);
        const totalCorreos = (activityMap['Correo Enviado'] || 0) + (activityMap['Correo Recibido'] || 0);
        
        const totalTraslados = activityMap['Traslado'] || 0;
        const totalCerrados = filteredPartes.filter(p => p.status === 'CERRADO').length;
        const resolucionDirecta = Math.max(0, totalCerrados - totalTraslados);
        const totalAbiertos = filteredPartes.filter(p => p.status === 'ABIERTO' || p.status === 'EN TRÁMITE').length;

        return {
            timePerUser,
            trendData,
            activityData,
            metrics: {
                totalDuration,
                totalActions,
                totalPartes,
                avgDuration: totalPartes > 0 ? Math.round(totalDuration / totalPartes) : 0,
                totalLlamadas,
                totalCorreos,
                totalCerrados,
                totalAbiertos,
                resolucionDirecta,
                totalTraslados
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
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">PartesApp Engine</span>
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                        Métricas
                    </h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
                        Visualización global de rendimiento de los últimos {range} días.
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
                {/* Main Hero Card (Liquid Glass style) */}
                <motion.div 
                    variants={itemVariants}
                    className="md:col-span-2 md:row-span-2 p-10 rounded-[2.5rem] bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg relative overflow-hidden flex flex-col justify-between group cursor-default"
                >
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-colors duration-700" />
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-amber-400/30 rounded-full blur-2xl" />
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                           <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30 shadow-sm">
                               <Clock className="w-8 h-8 text-white" />
                           </div>
                           <div className="text-right">
                               <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold backdrop-blur-md text-white border border-white/20">LIVE DATA</div>
                           </div>
                        </div>
                        <div className="mt-12">
                            <p className="text-orange-100/90 text-xs font-black uppercase tracking-[0.3em] mb-2">Inversión Total Acumulada</p>
                            <h3 className="text-8xl font-black tabular-nums tracking-tighter leading-tight drop-shadow-sm">
                                {analyticsData.metrics.totalDuration}
                                <span className="text-2xl font-light opacity-80 ml-3">min</span>
                            </h3>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-end justify-between border-t border-white/20 pt-4 mt-8">
                        <div className="flex items-center justify-between w-full">
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-orange-200">Partes</p>
                                <p className="text-2xl font-bold">{analyticsData.metrics.totalPartes}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-orange-200">Actuaciones</p>
                                <p className="text-2xl font-bold">{analyticsData.metrics.totalActions}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-widest text-orange-200 text-right">Promedio</p>
                                <p className="text-2xl font-bold text-right">{analyticsData.metrics.avgDuration} <span className="text-sm">min/r</span></p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Status (Abiertos vs Cerrados) */}
                <motion.div 
                    variants={itemVariants}
                    className="md:col-span-1 md:row-span-1 p-6 rounded-[2rem] glass-card flex flex-col justify-between group"
                >
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded-xl text-green-500">
                            <Activity className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">TASA ÉXITO</span>
                    </div>
                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Cerrados</p>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Abiertos</p>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <h3 className="text-4xl font-black text-slate-800 dark:text-white tabular-nums tracking-tight text-green-500">
                                {analyticsData.metrics.totalCerrados}
                            </h3>
                            <h3 className="text-2xl font-medium text-slate-400 tabular-nums">
                                {analyticsData.metrics.totalAbiertos}
                            </h3>
                        </div>
                    </div>
                </motion.div>

                {/* Resoluciones (Directas vs Traslados) */}
                <motion.div 
                    variants={itemVariants}
                    className="md:col-span-1 md:row-span-1 p-6 rounded-[2rem] glass-card flex flex-col justify-between group"
                >
                    <div className="flex justify-between items-start">
                        <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-xl text-purple-500">
                            <Zap className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">RESOLUCIÓN</span>
                    </div>
                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Directas</p>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Traslados</p>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <h3 className="text-4xl font-black text-slate-800 dark:text-white tabular-nums tracking-tight">
                                {analyticsData.metrics.resolucionDirecta}
                            </h3>
                            <h3 className="text-2xl font-medium text-slate-400 tabular-nums">
                                {analyticsData.metrics.totalTraslados}
                            </h3>
                        </div>
                    </div>
                </motion.div>

                {/* Comunicaciones (Llamadas vs Correos) */}
                <motion.div 
                    variants={itemVariants}
                    className="md:col-span-2 md:row-span-1 p-6 rounded-[2rem] glass-panel flex flex-col justify-between relative overflow-hidden"
                >
                    <div className="absolute right-0 bottom-0 opacity-5">
                        <Users className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Comunicaciones Recibidas y Emitidas</span>
                    </div>
                    <div className="relative z-10 flex justify-around items-end h-full">
                        <div className="text-center">
                            <h3 className="text-5xl font-black tabular-nums tracking-tight text-slate-800 dark:text-white">
                                {analyticsData.metrics.totalLlamadas}
                            </h3>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Llamadas</p>
                        </div>
                        <div className="w-px h-12 bg-slate-200 dark:bg-slate-700"></div>
                        <div className="text-center">
                            <h3 className="text-5xl font-black tabular-nums tracking-tight text-slate-800 dark:text-white">
                                {analyticsData.metrics.totalCorreos}
                            </h3>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Correos</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Detailed Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
                {/* 1. Time Per User - Premium Large Chart */}
                <motion.div variants={itemVariants} className="lg:col-span-2">
                    <Card className="p-10 rounded-[3rem] border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden relative h-[500px] flex flex-col">
                        <div className="flex justify-between items-center mb-10">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Rendimiento por Técnico</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Inversión de tiempo acumulada por usuario</p>
                            </div>
                            <Users className="w-6 h-6 text-slate-300" />
                        </div>
                        <div className="flex-1 min-h-0">
                            {analyticsData.timePerUser.length > 0 ? (
                                <TimePerClientChart data={analyticsData.timePerUser} />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 bg-slate-50/50 dark:bg-slate-800/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 transition-all duration-300">
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
                        <Card className="p-8 rounded-[2.5rem] bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-xl border-none h-[242px] flex flex-col relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-white/20 transition-all duration-700" />
                             <div className="mb-4 relative z-10 flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-black tracking-tight">Tendencia</h3>
                                    <p className="text-orange-100/70 text-xs font-bold uppercase tracking-widest">{range} DÍAS</p>
                                </div>
                                <Activity className="w-5 h-5 text-orange-200/50" />
                            </div>
                            <div className="flex-1 min-h-0 relative z-10">
                                <TrendChart data={analyticsData.trendData} />
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl h-[226px] flex flex-col group">
                             <div className="mb-4 flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Categorías</h3>
                                    <p className="text-slate-500 text-xs">Distribución de tipos</p>
                                </div>
                                <BarChart3 className="w-5 h-5 text-slate-300" />
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

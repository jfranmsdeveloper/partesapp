import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUserStore } from '../../hooks/useUserStore';
import { TimePerClientChart } from '../../components/dashboard/TimePerClientChart';
import { ActivityTypeChart } from '../../components/dashboard/ActivityTypeChart';
import { TrendChart } from '../../components/dashboard/TrendChart';
import { Clock, Activity, BarChart3, ArrowUpRight, ArrowDownRight, Plus, FileText } from 'lucide-react';
import { format, subDays } from 'date-fns';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { ACTUACION_CONFIG } from '../../utils/actuacionConfig';
import type { ActuacionType } from '../../types';
import {
    filterPartesInRange,
    formatMinutesHuman,
    rangeLabel,
    rangeShortLabel,
    actuacionShortLabel,
    comparePeriods,
    formatTrendPeak,
    parseParteDate,
} from './analyticsUtils';

const RANGE_OPTIONS: { days: number; label: string }[] = [
    { days: 7, label: '7 días' },
    { days: 30, label: '30 días' },
    { days: 90, label: '90 días' },
    { days: 0, label: 'Todo' },
];

function StatusBar({ abierto, enTramite, cerrado }: { abierto: number; enTramite: number; cerrado: number }) {
    const total = abierto + enTramite + cerrado;
    if (total === 0) {
        return (
            <p className="text-xs text-slate-500 dark:text-slate-400">Sin partes en este periodo.</p>
        );
    }
    const pct = (n: number) => Math.round((n / total) * 100);
    return (
        <div className="space-y-3">
            <div className="flex h-3 rounded-full overflow-hidden bg-slate-200/80 dark:bg-slate-800/80 ring-1 ring-white/40 dark:ring-white/5">
                {cerrado > 0 && (
                    <div
                        className="bg-emerald-500 transition-all duration-500"
                        style={{ width: `${pct(cerrado)}%` }}
                        title={`Cerrados: ${cerrado}`}
                    />
                )}
                {enTramite > 0 && (
                    <div
                        className="bg-blue-500 transition-all duration-500"
                        style={{ width: `${pct(enTramite)}%` }}
                        title={`En trámite: ${enTramite}`}
                    />
                )}
                {abierto > 0 && (
                    <div
                        className="bg-amber-400 transition-all duration-500"
                        style={{ width: `${pct(abierto)}%` }}
                        title={`Abiertos: ${abierto}`}
                    />
                )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Cerrado {cerrado} ({pct(cerrado)}%)
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> En trámite {enTramite} ({pct(enTramite)}%)
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> Abierto {abierto} ({pct(abierto)}%)
                </span>
            </div>
        </div>
    );
}

export default function Analytics() {
    const { partes, currentUser } = useUserStore();
    const [range, setRange] = useState<number>(30);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 },
        },
    };

    const itemVariants = {
        hidden: { y: 16, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring' as const, stiffness: 120 },
        },
    };

    const filteredPartes = useMemo(
        () => filterPartesInRange(partes, range, currentUser, 0),
        [partes, range, currentUser]
    );

    const previousPartes = useMemo(() => {
        if (range === 0) return [];
        return filterPartesInRange(partes, range, currentUser, range);
    }, [partes, range, currentUser]);

    const analyticsData = useMemo(() => {
        const clientMap: Record<string, number> = {};
        filteredPartes.forEach(p => {
            const clientName = p.clientName || p.clientId || 'Sin cliente asignado';
            clientMap[clientName] = (clientMap[clientName] || 0) + p.totalTime;
        });
        const timePerClient = Object.entries(clientMap)
            .map(([name, duration]) => ({ name, duration }))
            .sort((a, b) => b.duration - a.duration);

        const totalDurationAll = timePerClient.reduce((a, c) => a + c.duration, 0);
        const timePerClientWithShare = timePerClient.map(row => ({
            ...row,
            share: totalDurationAll > 0 ? Math.round((row.duration / totalDurationAll) * 100) : 0,
        }));

        const trendMap: Record<string, number> = {};
        if (range === 0) {
            filteredPartes.forEach(p => {
                const date = parseParteDate(p.createdAt);
                if (date) trendMap[format(date, 'yyyy-MM-dd')] = 0;
            });
        } else {
            for (let i = range; i >= 0; i--) {
                trendMap[format(subDays(new Date(), i), 'yyyy-MM-dd')] = 0;
            }
        }

        filteredPartes.forEach(p => {
            const date = parseParteDate(p.createdAt);
            if (date) {
                const d = format(date, 'yyyy-MM-dd');
                if (trendMap[d] !== undefined) trendMap[d] += 1;
            }
        });

        const trendData = Object.entries(trendMap)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
        const finalTrendData = trendData.length > 90 ? trendData.slice(-90) : trendData;

        const activityMap: Record<string, number> = {};
        const activityMinutes: Record<string, number> = {};
        filteredPartes.forEach(p => {
            p.actuaciones.forEach(a => {
                activityMap[a.type] = (activityMap[a.type] || 0) + 1;
                activityMinutes[a.type] = (activityMinutes[a.type] || 0) + a.duration;
            });
        });
        const activityData = Object.entries(activityMap).map(([name, count]) => ({ name, count }));
        const topActivities = [...activityData]
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const totalDuration = filteredPartes.reduce((acc, p) => acc + p.totalTime, 0);
        const totalActions = filteredPartes.reduce((acc, p) => acc + p.actuaciones.length, 0);
        const totalPartes = filteredPartes.length;

        const totalLlamadas = (activityMap['Llamada Realizada'] || 0) + (activityMap['Llamada Recibida'] || 0);
        const totalCorreos = (activityMap['Correo Enviado'] || 0) + (activityMap['Correo Recibido'] || 0);

        const totalTraslados = activityMap['Traslado'] || 0;
        const totalCerrados = filteredPartes.filter(p => p.status === 'CERRADO').length;
        const cerradosSinTraslado = Math.max(0, totalCerrados - totalTraslados);
        const totalAbiertos = filteredPartes.filter(p => p.status === 'ABIERTO').length;
        const totalEnTramite = filteredPartes.filter(p => p.status === 'EN TRÁMITE').length;

        const prevTotalPartes = previousPartes.length;
        const prevTotalDuration = previousPartes.reduce((acc, p) => acc + p.totalTime, 0);
        const partesComparison = range > 0 ? comparePeriods(totalPartes, prevTotalPartes) : null;
        const timeComparison = range > 0 ? comparePeriods(totalDuration, prevTotalDuration) : null;

        const closedPct = totalPartes > 0 ? Math.round((totalCerrados / totalPartes) * 100) : 0;

        return {
            timePerClient: timePerClientWithShare,
            trendData: finalTrendData,
            activityData,
            topActivities,
            activityMinutes,
            peakLabel: formatTrendPeak(finalTrendData),
            metrics: {
                totalDuration,
                totalActions,
                totalPartes,
                avgDuration: totalPartes > 0 ? Math.round(totalDuration / totalPartes) : 0,
                totalLlamadas,
                totalCorreos,
                totalCerrados,
                totalAbiertos,
                totalEnTramite,
                cerradosSinTraslado,
                totalTraslados,
                closedPct,
            },
            partesComparison,
            timeComparison,
        };
    }, [filteredPartes, previousPartes, range]);

    const summaryLine = useMemo(() => {
        const m = analyticsData.metrics;
        if (m.totalPartes === 0) return null;
        const pendientes = m.totalAbiertos + m.totalEnTramite;
        return `En ${rangeLabel(range)} registraste ${m.totalPartes} partes (${formatMinutesHuman(m.totalDuration)}), ${m.totalCerrados} cerrados${pendientes > 0 ? ` y ${pendientes} aún pendientes` : ''}.`;
    }, [analyticsData.metrics, range]);

    const userScopeNote =
        'Mostramos solo los partes vinculados a tu usuario (creados por ti o asignados a tu cuenta).';

    if (filteredPartes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-8rem)] px-6 text-center">
                <div className="max-w-md rounded-[2rem] bg-white/45 dark:bg-slate-950/35 backdrop-blur-3xl border border-white/35 dark:border-white/10 shadow-xl p-10">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                        <BarChart3 className="w-7 h-7 text-orange-500" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Analíticas</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        No hay partes en {rangeLabel(range)}. Cambia el periodo o crea un parte para ver métricas.
                    </p>
                    <p className="text-[11px] text-slate-400 mb-6">{userScopeNote}</p>
                    <Link
                        to="/new"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold shadow-lg shadow-orange-500/25"
                    >
                        <Plus className="w-4 h-4" />
                        Generar Parte
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="flex flex-col gap-4 pb-8 min-h-[calc(100dvh-6.5rem)]"
        >
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shrink-0">
                <div className="space-y-2 max-w-2xl">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Analíticas
                    </h1>
                    {summaryLine && (
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                            {summaryLine}
                        </p>
                    )}
                    <p className="text-[11px] text-slate-400">{userScopeNote}</p>
                </div>

                <div className="flex bg-white/50 dark:bg-slate-950/30 backdrop-blur-xl p-1 rounded-2xl border border-white/40 dark:border-white/10 shadow-md">
                    {RANGE_OPTIONS.map(({ days, label }) => (
                        <button
                            key={days}
                            type="button"
                            onClick={() => setRange(days)}
                            className={clsx(
                                'px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200',
                                range === days
                                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1 min-h-0 auto-rows-min xl:auto-rows-fr">
                {/* Hero + KPIs */}
                <motion.div
                    variants={itemVariants}
                    className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0"
                >
                    <div className="md:col-span-2 p-6 sm:p-8 rounded-[2rem] bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/15 rounded-full blur-3xl" />
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                            <div>
                                <p className="text-orange-100/90 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                                    Tiempo registrado · {rangeShortLabel(range)}
                                </p>
                                <p className="text-4xl sm:text-5xl font-black tabular-nums tracking-tight">
                                    {formatMinutesHuman(analyticsData.metrics.totalDuration)}
                                </p>
                                <p className="text-orange-100/80 text-sm mt-2 font-medium">
                                    {analyticsData.metrics.totalPartes} partes · {analyticsData.metrics.totalActions} actuaciones
                                </p>
                                {analyticsData.timeComparison && (
                                    <p className="text-xs mt-2 text-white/90 flex items-center gap-1 font-semibold">
                                        {analyticsData.timeComparison.delta >= 0 ? (
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                        ) : (
                                            <ArrowDownRight className="w-3.5 h-3.5" />
                                        )}
                                        {analyticsData.timeComparison.label}
                                    </p>
                                )}
                            </div>
                            <div className="text-right sm:text-left">
                                <p className="text-[10px] uppercase font-black tracking-widest text-orange-200">Media por parte</p>
                                <p className="text-2xl font-bold">{formatMinutesHuman(analyticsData.metrics.avgDuration)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 rounded-[1.75rem] bg-white/45 dark:bg-slate-950/35 backdrop-blur-3xl border border-white/35 dark:border-white/10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] flex flex-col justify-between gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado de tus partes</span>
                            <Activity className="w-4 h-4 text-emerald-500" />
                        </div>
                        <StatusBar
                            abierto={analyticsData.metrics.totalAbiertos}
                            enTramite={analyticsData.metrics.totalEnTramite}
                            cerrado={analyticsData.metrics.totalCerrados}
                        />
                        <p className="text-[11px] text-slate-500">
                            {analyticsData.metrics.closedPct}% de los partes del periodo están cerrados.
                        </p>
                    </div>

                    <div className="p-5 rounded-[1.75rem] bg-white/45 dark:bg-slate-950/35 backdrop-blur-3xl border border-white/35 dark:border-white/10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] flex flex-col justify-between gap-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Partes cerrados sin traslado</span>
                        <div className="flex items-baseline justify-between">
                            <p className="text-3xl font-black text-slate-800 dark:text-white">{analyticsData.metrics.cerradosSinTraslado}</p>
                            <p className="text-sm text-slate-400">Traslados: {analyticsData.metrics.totalTraslados}</p>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                            Partes cerrados en los que no consta una actuación de tipo Traslado (aprox.).
                        </p>
                    </div>

                    <div className="md:col-span-2 p-5 rounded-[1.75rem] bg-white/45 dark:bg-slate-950/35 backdrop-blur-3xl border border-white/35 dark:border-white/10 flex flex-col sm:flex-row justify-around gap-4">
                        <div className="text-center sm:text-left">
                            <p className="text-3xl font-black text-slate-800 dark:text-white">{analyticsData.metrics.totalLlamadas}</p>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Llamadas</p>
                        </div>
                        <div className="hidden sm:block w-px bg-slate-200 dark:bg-white/10" />
                        <div className="text-center sm:text-left">
                            <p className="text-3xl font-black text-slate-800 dark:text-white">{analyticsData.metrics.totalCorreos}</p>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">Correos</p>
                        </div>
                        {analyticsData.partesComparison && (
                            <div className="text-center sm:text-right flex-1">
                                <p className="text-[11px] font-bold text-slate-400 uppercase">Partes vs periodo anterior</p>
                                <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mt-1">
                                    {analyticsData.partesComparison.label}
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Tendencia */}
                <motion.div
                    variants={itemVariants}
                    className="xl:col-span-4 min-h-[14rem] xl:min-h-0 flex flex-col rounded-[2rem] bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg overflow-hidden p-5 sm:p-6"
                >
                    <div className="flex justify-between items-start mb-2 shrink-0">
                        <div>
                            <h3 className="text-lg font-black tracking-tight">Partes por día</h3>
                            <p className="text-orange-100/80 text-[10px] font-bold uppercase tracking-widest">{rangeShortLabel(range)}</p>
                        </div>
                        <FileText className="w-5 h-5 text-orange-200/60" />
                    </div>
                    <div className="flex-1 min-h-[8rem] w-full">
                        <TrendChart data={analyticsData.trendData} valueLabel="partes" />
                    </div>
                    {analyticsData.peakLabel && (
                        <p className="text-[11px] text-orange-100/90 mt-2 font-medium shrink-0">{analyticsData.peakLabel}</p>
                    )}
                </motion.div>

                {/* Clientes */}
                <motion.div variants={itemVariants} className="xl:col-span-7 min-h-[22rem] flex flex-col rounded-[2rem] bg-white/45 dark:bg-slate-950/35 backdrop-blur-3xl border border-white/35 dark:border-white/10 p-5 sm:p-6 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)]">
                    <div className="mb-4 shrink-0">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Tiempo por cliente</h3>
                        <p className="text-xs text-slate-500">Top clientes por minutos registrados en el periodo</p>
                    </div>
                    <div className="flex-1 min-h-[16rem]">
                        <TimePerClientChart
                            data={analyticsData.timePerClient}
                            formatValue={(m) => formatMinutesHuman(m)}
                        />
                    </div>
                </motion.div>

                {/* Actividades */}
                <motion.div variants={itemVariants} className="xl:col-span-5 flex flex-col gap-4 min-h-0">
                    <div className="flex-1 min-h-[12rem] rounded-[2rem] bg-white/45 dark:bg-slate-950/35 backdrop-blur-3xl border border-white/35 dark:border-white/10 p-5 sm:p-6 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] flex flex-col">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">Tipos de actuación</h3>
                        <p className="text-xs text-slate-500 mb-3">Las más frecuentes en el periodo</p>
                        <div className="flex-1 min-h-[10rem]">
                            <ActivityTypeChart
                                data={analyticsData.activityData}
                                formatCategoryLabel={actuacionShortLabel}
                            />
                        </div>
                    </div>

                    {analyticsData.topActivities.length > 0 && (
                        <div className="rounded-[1.75rem] bg-white/40 dark:bg-slate-950/30 backdrop-blur-xl border border-white/30 dark:border-white/10 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Resumen rápido</p>
                            <div className="flex flex-wrap gap-2">
                                {analyticsData.topActivities.map(row => {
                                    const cfg = ACTUACION_CONFIG[row.name as ActuacionType];
                                    const Icon = cfg?.icon;
                                    const mins = analyticsData.activityMinutes[row.name] || 0;
                                    return (
                                        <div
                                            key={row.name}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50/80 dark:bg-orange-500/10 border border-orange-100/60 dark:border-orange-500/20 text-[11px] font-bold text-slate-700 dark:text-slate-200"
                                            title={row.name}
                                        >
                                            {Icon && <Icon className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                                            <span>{actuacionShortLabel(row.name)}</span>
                                            <span className="text-slate-400 font-semibold">{row.count}×</span>
                                            {mins > 0 && (
                                                <span className="text-orange-600 dark:text-orange-400">{formatMinutesHuman(mins)}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
}

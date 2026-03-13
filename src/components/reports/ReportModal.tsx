import { useState, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { generateWordReport } from '../../utils/wordGenerator';
import { StatusDistributionChart } from '../dashboard/StatusDistributionChart';
import { ActivityTypeChart } from '../dashboard/ActivityTypeChart';
import { TrendChart } from '../dashboard/TrendChart';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Download, Loader2, FileText as WordIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, startOfYear, endOfYear, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Custom Web Component wrapper for Calendar
// @ts-nocheck
import 'cally';
import { CalendarWithSelectors } from '../ui/CalendarWithSelectors';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ReportModal = ({ isOpen, onClose }: ReportModalProps) => {
    const { partes, currentUser, users } = useAppStore();
    const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [isGenerating, setIsGenerating] = useState(false);

    // Bolsa de Horas State
    const [bolsaNominas, setBolsaNominas] = useState('');
    const [bolsaCovid, setBolsaCovid] = useState('');

    // Admin Scope State
    // @ts-ignore
    const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'admin@admin.com'; // Fallback for testing
    const [reportScope, setReportScope] = useState<'me' | 'all'>('me');

    const chartsRef = useRef<HTMLDivElement>(null);

    // Filter logic for preview & Report
    // First, filter by Scope
    const scopePartes = reportScope === 'all'
        ? partes
        : partes.filter(p => p.userId === currentUser?.id || p.userId === currentUser?.email);

    // Then by Date
    const filteredPartes = scopePartes.filter(p => {
        const pDate = new Date(p.createdAt);
        // Correctly include the entire day for start and end
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return isWithinInterval(pDate, { start, end });
    });

    // 🔍 DEBUG LOGS - Temporal para diagnóstico
    console.log('=== DEBUG INFORME ===');
    console.log('📅 Rango de fechas:', { startDate, endDate });
    console.log('👤 Alcance:', reportScope);
    console.log('👤 Usuario actual:', currentUser?.email || currentUser?.id);
    console.log('📊 Total partes en store:', partes.length);
    console.log('🔍 Partes después de filtro scope:', scopePartes.length);
    console.log('📆 Partes después de filtro fecha:', filteredPartes.length);

    // Mostrar partes excluidos por fecha
    const excludedByDate = scopePartes.filter(p => {
        const pDate = new Date(p.createdAt);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return !isWithinInterval(pDate, { start, end });
    });

    if (excludedByDate.length > 0) {
        console.log('⚠️ Partes excluidos por fecha:', excludedByDate.length);
        console.table(excludedByDate.map(p => ({
            id: p.id,
            fecha: p.createdAt,
            estado: p.status,
            cliente: p.clientName || '(sin cliente)'
        })));
    }

    console.log('📈 Distribución de estados:', {
        abiertos: filteredPartes.filter(p => p.status === 'ABIERTO').length,
        enTramite: filteredPartes.filter(p => p.status === 'EN TRÁMITE').length,
        cerrados: filteredPartes.filter(p => p.status === 'CERRADO').length
    });

    const partesConCliente = filteredPartes.filter(p => p.clientId).length;
    const partesSinCliente = filteredPartes.filter(p => !p.clientId).length;

    console.log('👥 Total usuarios atendidos (con repeticiones):', partesConCliente);
    console.log('📋 Partes con clientId:', partesConCliente);
    console.log('📋 Partes sin clientId:', partesSinCliente);

    // Mostrar partes sin cliente
    if (partesSinCliente > 0) {
        const sinCliente = filteredPartes.filter(p => !p.clientId);
        console.log('⚠️ Partes SIN CLIENTE asignado:');
        console.table(sinCliente.map(p => ({
            id: p.id,
            titulo: p.title,
            estado: p.status,
            fecha: p.createdAt
        })));
    }

    const metrics = {
        totalPartes: filteredPartes.length,
        totalTime: filteredPartes.reduce((acc, p) => acc + p.totalTime, 0),
        closedPartes: filteredPartes.filter(p => p.status === 'CERRADO').length,
        avgTime: filteredPartes.length > 0 ? Math.round(filteredPartes.reduce((acc, p) => acc + p.totalTime, 0) / filteredPartes.length) : 0
    };

    // Chart Data Preparation (Based on filtered data) - PREVIEW ONLY
    const statusData = [
        { name: 'ABIERTO', value: filteredPartes.filter(p => p.status === 'ABIERTO').length, color: '#f59e0b' },
        { name: 'EN TRÁMITE', value: filteredPartes.filter(p => p.status === 'EN TRÁMITE').length, color: '#3b82f6' },
        { name: 'CERRADO', value: filteredPartes.filter(p => p.status === 'CERRADO').length, color: '#10b981' },
    ];

    // Quick Activity Data
    const activityCounts: Record<string, number> = {};
    const actsByDate: Record<string, number> = {};

    filteredPartes.forEach(p => {
        p.actuaciones.forEach(a => {
            activityCounts[a.type] = (activityCounts[a.type] || 0) + 1;
            const dateKey = a.timestamp.split('T')[0];
            actsByDate[dateKey] = (actsByDate[dateKey] || 0) + 1;
        });
    });

    const activityData = Object.entries(activityCounts).map(([name, count]) => ({ name, count }));

    // Trend Data (Sort by date)
    const trendData = Object.entries(actsByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            // Visualize loader
            await new Promise(resolve => setTimeout(resolve, 500));

            // Prepare Data
            const reportData = {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                partes: filteredPartes,
                users: users || [],
                bolsaHoras: {
                    nominas: bolsaNominas,
                    covid: bolsaCovid
                }
            };

            // Generate
            await generateWordReport(reportData);

            onClose();
        } catch (error) {
            console.error('Generación fallida:', error);
            alert(`Error al generar el informe: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Fluent Card: Acrylic Material + Elevation */}
            <div className="w-[90%] max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 bg-[#f3f3f3]/90 dark:bg-[#202020]/90 backdrop-blur-2xl border border-white/50 dark:border-black/50 ring-1 ring-black/5">

                {/* Header - Minimal & Clean */}
                <div className="flex justify-between items-center px-8 py-5 border-b border-neutral-200/60 dark:border-neutral-700/60 bg-white/50 dark:bg-black/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-600 rounded-md text-white shadow-sm">
                            <Download className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mt-[-2px]">Generar Informe</h2>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Exportar datos a formato Word (.docx)</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors text-neutral-500 dark:text-neutral-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8">

                    {/* Date Selection Section - FLUENT STYLE */}
                    <div className="space-y-6">

                        {/* Admin Scope Selector - InfoBar Style */}
                        {isAdmin && (
                            <div className="bg-orange-50 dark:bg-orange-900/20 px-4 py-3 rounded-md border-l-4 border-orange-600 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 uppercase tracking-wide text-[11px]">Alcance</span>
                                        <div className="flex gap-6">
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <div className={`w-4 h-4 rounded-full border border-neutral-400 flex items-center justify-center bg-white ${reportScope === 'me' ? 'border-orange-600' : ''}`}>
                                                    {reportScope === 'me' && <div className="w-2.5 h-2.5 rounded-full bg-orange-600" />}
                                                </div>
                                                <input type="radio" name="scope" checked={reportScope === 'me'} onChange={() => setReportScope('me')} className="hidden" />
                                                <span className={`text-sm ${reportScope === 'me' ? 'text-neutral-900 font-medium' : 'text-neutral-600'} transition-colors`}>Solo Mis Partes</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <div className={`w-4 h-4 rounded-full border border-neutral-400 flex items-center justify-center bg-white ${reportScope === 'all' ? 'border-orange-600' : ''}`}>
                                                    {reportScope === 'all' && <div className="w-2.5 h-2.5 rounded-full bg-orange-600" />}
                                                </div>
                                                <input type="radio" name="scope" checked={reportScope === 'all'} onChange={() => setReportScope('all')} className="hidden" />
                                                <span className={`text-sm ${reportScope === 'all' ? 'text-neutral-900 font-medium' : 'text-neutral-600'} transition-colors`}>Global (Todos)</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Bolsa de Horas Inputs (Only for Admin & Global) */}
                                {reportScope === 'all' && (
                                    <div className="pt-2 border-t border-orange-200 dark:border-orange-800/30">
                                        <h4 className="text-xs font-semibold text-orange-800 dark:text-orange-200 uppercase tracking-wide mb-3">
                                            Bolsa de Horas (Opcional - Matriz Global)
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-neutral-500 mb-1">Actualización Nóminas</label>
                                                <Input
                                                    value={bolsaNominas}
                                                    onChange={(e) => setBolsaNominas(e.target.value)}
                                                    placeholder="Ej: 10 hrs"
                                                    className="bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-neutral-500 mb-1">COVID</label>
                                                <Input
                                                    value={bolsaCovid}
                                                    onChange={(e) => setBolsaCovid(e.target.value)}
                                                    placeholder="Ej: 5 hrs"
                                                    className="bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-neutral-200 dark:border-neutral-700 pb-2">
                            <div>
                                <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                                    Periodo del Informe
                                </h3>
                                <p className="text-sm text-neutral-500 mt-1">
                                    {format(new Date(startDate), "d 'de' MMMM, yyyy", { locale: es })} — {format(new Date(endDate), "d 'de' MMMM, yyyy", { locale: es })}
                                </p>
                            </div>

                            {/* Quick Presets - Segmented/Command Bar Style */}
                            <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                                {[
                                    { label: "Este Mes", action: () => { setStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd')); setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd')); } },
                                    { label: "Mes Pasado", action: () => { const last = subMonths(new Date(), 1); setStartDate(format(startOfMonth(last), 'yyyy-MM-dd')); setEndDate(format(endOfMonth(last), 'yyyy-MM-dd')); } },
                                    { label: "Últimos 30", action: () => { setStartDate(format(subDays(new Date(), 30), 'yyyy-MM-dd')); setEndDate(format(new Date(), 'yyyy-MM-dd')); } },
                                    { label: "Este Año", action: () => { setStartDate(format(startOfYear(new Date()), 'yyyy-MM-dd')); setEndDate(format(endOfYear(new Date()), 'yyyy-MM-dd')); } }
                                ].map((btn, idx) => (
                                    <button
                                        key={idx}
                                        onClick={btn.action}
                                        className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 hover:shadow-sm transition-all focus:bg-white focus:text-orange-600"
                                    >
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Calendar Card - High Elevation, White Surface */}
                        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
                            <div className="flex flex-col md:flex-row gap-10 justify-center items-start">
                                {/* Start Date */}
                                <div className="flex-1 w-full max-w-sm mx-auto">
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4 border-b border-neutral-100 pb-2">Fecha Inicio</label>
                                    {/* @ts-ignore */}
                                    <CalendarWithSelectors
                                        value={startDate}
                                        onChange={(date) => {
                                            setStartDate(date);
                                            if (new Date(date) > new Date(endDate)) setEndDate(date);
                                        }}
                                        max={endDate}
                                        className="w-full"
                                    />
                                </div>

                                {/* Divider */}
                                <div className="hidden md:flex h-[300px] w-[1px] bg-neutral-100 dark:bg-neutral-700 my-auto" />

                                {/* End Date */}
                                <div className="flex-1 w-full max-w-sm mx-auto">
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4 border-b border-neutral-100 pb-2">Fecha Fin</label>
                                    {/* @ts-ignore */}
                                    <CalendarWithSelectors
                                        value={endDate}
                                        onChange={(date) => {
                                            if (new Date(date) < new Date(startDate)) setStartDate(date);
                                            setEndDate(date);
                                        }}
                                        min={startDate}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6 text-neutral-800 dark:text-white border-l-4 border-orange-600 pl-3">
                            Vista Previa de Datos
                        </h3>
                        <div
                            ref={chartsRef}
                            className="space-y-6"
                        >
                            {/* Row 1: Status & Activity */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div id="chart-status" className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    <StatusDistributionChart data={statusData} />
                                </div>
                                <div id="chart-activity" className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    <ActivityTypeChart data={activityData} />
                                </div>
                            </div>

                            {/* Row 2: Trend (New) */}
                            <div id="chart-trend" className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <TrendChart data={trendData} />
                            </div>
                        </div>
                    </div>

                    {/* Quick Metrics Preview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricPreview label="Partes" value={metrics.totalPartes} />
                        <MetricPreview label="Minutos" value={metrics.totalTime} />
                        <MetricPreview label="Promedio" value={metrics.avgTime} />
                        <MetricPreview label="Cerrados" value={metrics.closedPartes} />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-white/40 dark:bg-slate-900/40 flex justify-end gap-3 sticky bottom-0 backdrop-blur-md">
                    <Button variant="outline" onClick={onClose} disabled={isGenerating} className="border-slate-200 dark:border-slate-700 dark:text-slate-300">
                        Cancelar
                    </Button>

                    <div className="flex gap-2">
                        <Button
                            onClick={() => handleGenerate()}
                            disabled={isGenerating}
                            className="min-w-[150px] bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg shadow-blue-500/20"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <WordIcon className="w-4 h-4 mr-2" />}
                            Descargar Word (.docx)
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricPreview = ({ label, value }: { label: string, value: number }) => (
    <div className="bg-orange-50/50 dark:bg-orange-900/10 p-4 rounded-xl text-center border border-orange-100 dark:border-orange-800">
        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{value}</p>
    </div>
);

import { useState, useMemo } from 'react';
import { useUserStore } from '../../hooks/useUserStore';
import { KPICard } from '../../components/dashboard/KPICard';
import { StatusDistributionChart } from '../../components/dashboard/StatusDistributionChart';
import { ActivityTypeChart } from '../../components/dashboard/ActivityTypeChart';
import { FileText, Clock, CheckCircle, Activity, FileDown } from 'lucide-react';
import { ACTUACION_CONFIG } from '../../utils/actuacionConfig';
import { Button } from '../../components/ui/Button';
import { ReportModal } from '../../components/reports/ReportModal';

export default function Dashboard() {
    const { partes } = useUserStore();
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // Calculations
    const metrics = useMemo(() => {
        const totalPartes = partes.length;
        const totalTime = partes.reduce((acc, p) => acc + p.totalTime, 0);
        const closedPartes = partes.filter(p => p.status === 'CERRADO').length;

        // Status Distribution
        const statusData = [
            { name: 'ABIERTO', value: partes.filter(p => p.status === 'ABIERTO').length, color: '#f59e0b' }, // Amber
            { name: 'EN TRÁMITE', value: partes.filter(p => p.status === 'EN TRÁMITE').length, color: '#3b82f6' }, // Blue
            { name: 'CERRADO', value: partes.filter(p => p.status === 'CERRADO').length, color: '#ef4444' }, // Red
        ];

        // Activity Types
        const activityCounts: Record<string, number> = {};
        partes.forEach(p => {
            p.actuaciones.forEach(a => {
                activityCounts[a.type] = (activityCounts[a.type] || 0) + 1;
            });
        });

        const activityData = Object.keys(ACTUACION_CONFIG).map(type => ({
            name: type,
            count: activityCounts[type] || 0
        }));

        return {
            totalPartes,
            totalTime,
            closedPartes,
            avgTime: totalPartes > 0 ? Math.round(totalTime / totalPartes) : 0,
            statusData,
            activityData
        };
    }, [partes]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-display font-bold text-slate-800">APPGEST</h1>
                    <p className="text-slate-500">Resumen general de actividad y rendimiento</p>
                </div>
                <Button
                    onClick={() => setIsReportModalOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 border-0"
                >
                    <FileDown className="w-4 h-4" />
                    Generar Informe
                </Button>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Partes"
                    value={metrics.totalPartes}
                    icon={FileText}
                    color="orange"
                    trend={{ value: 12, isPositive: true }}
                />
                <KPICard
                    title="Tiempo Total (min)"
                    value={metrics.totalTime}
                    icon={Clock}
                    color="purple"
                />
                <KPICard
                    title="Partes Cerrados"
                    value={metrics.closedPartes}
                    icon={CheckCircle}
                    color="green"
                />
                <KPICard
                    title="Tiempo Promedio"
                    value={`${metrics.avgTime} min`}
                    icon={Activity}
                    color="blue"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StatusDistributionChart data={metrics.statusData} />
                <ActivityTypeChart data={metrics.activityData} />
            </div>

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
            />
        </div>
    );
}

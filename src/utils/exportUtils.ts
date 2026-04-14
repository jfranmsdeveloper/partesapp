import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface IndicadoresMetrics {
    totalPartes: number;
    totalTime: number;
    closedPartes: number;
    avgTime: number;
    statusData: { name: string; value: number }[];
    activityData: { name: string; count: number }[];
}

export const generateIndicadoresPDF = (metrics: IndicadoresMetrics) => {
    const doc = new jsPDF();
    const today = format(new Date(), "d 'de' MMMM, yyyy", { locale: es });

    // Header
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246); // Blue
    doc.text('Reporte de Indicadores', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${today}`, 14, 28);

    // Line separator
    doc.setDrawColor(200);
    doc.line(14, 32, 196, 32);

    // KPIs Section
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Resumen General', 14, 42);

    const kpiData = [
        ['Total Partes', metrics.totalPartes.toString()],
        ['Tiempo Total (min)', metrics.totalTime.toString()],
        ['Partes Cerrados', metrics.closedPartes.toString()],
        ['Tiempo Promedio', `${metrics.avgTime} min`],
    ];

    autoTable(doc, {
        startY: 48,
        head: [['Indicador', 'Valor']],
        body: kpiData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 12 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 80 },
        },
        margin: { left: 14, right: 100 } // Keep it narrow
    });

    // Status Distribution
    let finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Distribución por Estado', 14, finalY);

    const statusRows = metrics.statusData.map(d => [d.name, d.value.toString()]);

    autoTable(doc, {
        startY: finalY + 6,
        head: [['Estado', 'Cantidad']],
        body: statusRows,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }, // Emerald
    });

    // Activity Types
    finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Actividades Recientes', 14, finalY);

    // Sort by count
    const sortedActivities = [...metrics.activityData].sort((a, b) => b.count - a.count);
    const activityRows = sortedActivities.map(d => [d.name, d.count.toString()]);

    autoTable(doc, {
        startY: finalY + 6,
        head: [['Tipo de Actuación', 'Frecuencia']],
        body: activityRows,
        theme: 'striped',
        headStyles: { fillColor: [245, 158, 11] }, // Amber
    });

    doc.save('reporte_indicadores.pdf');
};

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type Parte, type ActuacionType, type User } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logoUrl from '../assets/logo.png';

interface ReportData {
    startDate: Date;
    endDate: Date;
    partes: Parte[];
    users: User[];
    bolsaHoras?: {
        nominas?: string;
        covid?: string;
    };
}

const COLORS = {
    headerOrange: [252, 213, 180] as [number, number, number], // #FCD5B4
    textBlack: [0, 0, 0] as [number, number, number],
    borderGray: [100, 100, 100] as [number, number, number],
};

const formatLabel = (type: ActuacionType) => {
    if (type === 'Incidencias') return 'Incidencia';
    if (type === 'Informe Corporativo') return 'Informes';
    if (type === 'Modificaciones') return 'Modificación';
    if (type === 'Cargas/Proceso') return 'Cargas / Proceso';
    return type;
};

const MAIN_INDICATORS = [
    { label: "Número total de elementos identificados para asistencia (USUARIOS).", key: 'users' },
    { label: "Número total de avisos recibidos (ABIERTOS)", key: 'abiertos' },
    { label: "Número total de Incidencias atendidas (CERRADOS)", key: 'cerrados' },
    { label: "- Incidencias resueltas directamente sin traslado a otros niveles", key: 'resueltas_directas' },
    { label: "- Número total de traslados de incidencias realizadas", key: 'act_traslados' },
    { label: "- Número total de llamadas recibidas", key: 'act_llamada_recibida' },
    { label: "- Número total de llamadas realizadas", key: 'act_llamada_realizada' },
    { label: "- Número total de correos recibidos", key: 'act_correo_recibido' },
    { label: "- Número total de correos remitidos", key: 'act_correo_enviado' },
];

const OTHER_INDICATORS: ActuacionType[] = [
    'Actualización', 'Cargas/Proceso', 'Desplazamiento', 'Formación', 'Incidencias',
    'Informe Corporativo', 'Investigación', 'Modificaciones', 'Otros', 'Tratamiento de Fichero',
];

const MATRIX_ROWS: ActuacionType[] = [
    'Actualización', 'Cargas/Proceso', 'Correo Enviado', 'Correo Recibido', 'Desplazamiento',
    'Formación', 'Incidencias', 'Informe Corporativo', 'Investigación', 'Llamada Realizada',
    'Llamada Recibida', 'Modificaciones', 'Otros', 'Traslado', 'Tratamiento de Fichero'
];

export const generatePdfReport = async (data: ReportData) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;

    // --- HELPER: LOGO & HEADER ---
    const addPageHeader = (title: string, subtitle?: string) => {
        try {
            const imgProps = doc.getImageProperties(logoUrl);
            const ratio = imgProps.width / imgProps.height;
            const h = 12;
            const w = h * ratio;
            doc.addImage(logoUrl, 'PNG', 14, 10, w, h);
        } catch (e) { /* ignore */ }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text("INDICADORES APLICACIONES", pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(14);
        const periodStr = format(data.startDate, 'MMMM yyyy', { locale: es }).toUpperCase();
        doc.text(periodStr, pageWidth / 2, 28, { align: 'center' });

        if (subtitle) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(subtitle, pageWidth - 14, 15, { align: 'right' });
        }
    };

    // --- HELPER: CALCULATE METRICS ---
    const calculateMetrics = (partes: Parte[]) => {
        const acts = partes.flatMap(p => p.actuaciones);
        const countType = (t: ActuacionType) => acts.filter(a => a.type === t).length;

        const trasladosCount = countType('Traslado');
        const cerrados = partes.filter(p => p.status === 'CERRADO').length;
        const resueltasDirectas = Math.max(0, cerrados - trasladosCount);

        const uniqueClients = new Set(partes.map(p => p.clientId).filter(Boolean)).size;
        const finalUsers = uniqueClients > 0 ? uniqueClients : partes.length;

        return {
            users: finalUsers,
            abiertos: partes.filter(p => p.status === 'ABIERTO').length,
            cerrados: cerrados,
            resueltas_directas: resueltasDirectas,
            act_traslados: trasladosCount,
            act_llamada_recibida: countType('Llamada Recibida'),
            act_llamada_realizada: countType('Llamada Realizada'),
            act_correo_recibido: countType('Correo Recibido'),
            act_correo_enviado: countType('Correo Enviado'),
            ...Object.fromEntries(OTHER_INDICATORS.map(t => [t, countType(t)]))
        };
    };

    // --- 1. ADMIN MATRIX PAGE ---
    const partesByUser: Record<string, Parte[]> = {};
    data.partes.forEach(p => {
        const uid = p.userId || "unknown";
        if (!partesByUser[uid]) partesByUser[uid] = [];
        partesByUser[uid].push(p);
    });
    const userIds = Object.keys(partesByUser);

    // Matrix Page Logic
    if (userIds.length > 0) {
        addPageHeader("", "Resumen Global");

        const userCols = userIds.map(uid => {
            const u = data.users.find(usr => usr.id === uid);
            let name = u?.user_metadata?.full_name || u?.name || u?.email || "Desc.";
            const parts = name.split(' ');
            if (parts.length > 1) name = `${parts[0]} ${parts[1]}`;
            return { name, uid };
        });

        const headRow = ["Indicadores Por Técnico", ...userCols.map(u => u.name)];

        const bodyRows = MATRIX_ROWS.map(type => {
            const row = [formatLabel(type)];
            userCols.forEach(u => {
                const uPartes = partesByUser[u.uid] || [];
                const count = uPartes.flatMap(p => p.actuaciones).filter(a => a.type === type).length;
                row.push(count === 0 ? '' : count.toString());
            });
            return row;
        });

        autoTable(doc, {
            startY: 40,
            head: [headRow],
            body: bodyRows,
            theme: 'grid',
            headStyles: {
                fillColor: COLORS.headerOrange,
                textColor: COLORS.textBlack,
                fontStyle: 'bold',
                halign: 'center',
                lineWidth: 0.1,
                lineColor: COLORS.textBlack
            },
            styles: {
                textColor: COLORS.textBlack,
                lineColor: COLORS.textBlack,
                lineWidth: 0.1,
                cellPadding: 3,
                fontSize: 9
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 50 },
            }
        });

        // --- BOLSA DE HORAS TABLE (Only if data exists) ---
        if (data.bolsaHoras && (data.bolsaHoras.nominas || data.bolsaHoras.covid)) {
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            const bolsaRows = [];
            // Rows for bolsa de hora
            // The image usually shows:
            // Header (Orange): Bolsa de hora | (Empty) | (Empty)
            // Row: - Actualización Nóminas | (Empty) | Value (in last user column essentially, or separate?)
            // We'll mimic the request: "aparece tal y como en la imagen". Assuming a simple table.

            if (data.bolsaHoras.nominas) bolsaRows.push(['- Actualización Nóminas', data.bolsaHoras.nominas]);
            if (data.bolsaHoras.covid) bolsaRows.push(['- COVID', data.bolsaHoras.covid]);

            if (bolsaRows.length > 0) {
                autoTable(doc, {
                    startY: finalY,
                    head: [['Bolsa de hora', '']],
                    body: bolsaRows,
                    theme: 'grid',
                    headStyles: {
                        fillColor: COLORS.headerOrange,
                        textColor: COLORS.textBlack,
                        fontStyle: 'bold',
                        halign: 'left',
                        lineWidth: 0.1,
                        lineColor: COLORS.textBlack
                    },
                    styles: {
                        textColor: COLORS.textBlack,
                        lineColor: COLORS.textBlack,
                        lineWidth: 0.1,
                        fontSize: 9
                    },
                    columnStyles: {
                        0: { cellWidth: 100 },
                        1: { cellWidth: 30, halign: 'center' } // value column
                    }
                });
            }
        }
    }

    // --- 2. INDIVIDUAL SUMMARY PAGES ---
    userIds.forEach((userId, idx) => {
        doc.addPage();

        const uPartes = partesByUser[userId];
        const uData = data.users.find(u => u.id === userId);
        const userName = uData?.user_metadata?.full_name || uData?.name || uData?.email || "Usuario";

        addPageHeader("", userName);

        const metrics: any = calculateMetrics(uPartes);

        const rows1 = MAIN_INDICATORS.map(ind => {
            return [ind.label, metrics[ind.key]];
        });

        autoTable(doc, {
            startY: 40,
            body: rows1,
            theme: 'plain',
            styles: {
                lineColor: COLORS.textBlack,
                lineWidth: 0.1,
                textColor: COLORS.textBlack,
                fontSize: 10,
                cellPadding: 4,
            },
            columnStyles: {
                0: { cellWidth: 150 },
                1: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
            },
            didParseCell: (data) => {
                if (data.row.index < 3 && data.section === 'body') {
                    data.cell.styles.fillColor = COLORS.headerOrange;
                }
            }
        });

        const otherSum = OTHER_INDICATORS.reduce((acc, t) => acc + (metrics[t] || 0), 0);

        const rows2 = [
            [{ content: "Número total de otros indicadores", styles: { fillColor: COLORS.headerOrange, fontStyle: 'bold' } }, { content: otherSum, styles: { fillColor: COLORS.headerOrange, fontStyle: 'bold', halign: 'center' } }],
            ...OTHER_INDICATORS.map(t => [`- ${formatLabel(t)}`, metrics[t] || 0])
        ];

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 15,
            body: rows2,
            theme: 'plain',
            styles: {
                lineColor: COLORS.textBlack,
                lineWidth: 0.1,
                textColor: COLORS.textBlack,
                fontSize: 10,
                cellPadding: 4,
            },
            columnStyles: {
                0: { cellWidth: 150 },
                1: { cellWidth: 30, halign: 'center' }
            }
        });
    });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${totalPages}`, 195, pageHeight - 10, { align: 'right' });
    }

    doc.save(`Informe_Corporativo_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};

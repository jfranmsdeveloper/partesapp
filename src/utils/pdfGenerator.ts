import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type Parte, type ActuacionType, type User } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ACTUACION_CONFIG } from './actuacionConfig';

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
    headerSalmon: [244, 176, 132] as [number, number, number], // #F4B084
    rowGreen: [226, 239, 218] as [number, number, number],    // #E2EFDA
    borderGray: [204, 204, 204] as [number, number, number],  // #CCCCCC
    textDark: [45, 62, 80] as [number, number, number],       // #2D3E50
    textBlack: [0, 0, 0] as [number, number, number],
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

const OTHER_INDICATORS = Object.keys(ACTUACION_CONFIG).filter(type =>
    !['Llamada Realizada', 'Llamada Recibida', 'Correo Enviado', 'Correo Recibido', 'Traslado'].includes(type)
) as ActuacionType[];

const MATRIX_ROWS = Object.keys(ACTUACION_CONFIG).sort() as ActuacionType[];

export const generatePdfReport = async (data: ReportData) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;

    // Load logo as base64
    let logoBase64: string | null = null;
    try {
        const response = await fetch('/logo.png');
        if (response.ok) {
            const blob = await response.blob();
            logoBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        }
    } catch (e) {
        console.error("Failed to load logo for PDF report", e);
    }

    // --- HELPER: HEADER ---
    const addPageHeader = (subtitle?: string) => {
        // Logo and Branding
        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', 14, 10, 10, 10);
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
        doc.text("Serglobin S.L.", 28, 17);

        // Horizontal Line
        doc.setDrawColor(COLORS.borderGray[0], COLORS.borderGray[1], COLORS.borderGray[2]);
        doc.setLineWidth(0.1);
        doc.line(14, 22, pageWidth - 14, 22);

        // Titles
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);
        doc.text("Informe de Indicadores de Gestión", pageWidth / 2, 35, { align: 'center' });

        doc.setFontSize(14);
        const periodStr = format(data.startDate, 'MMMM yyyy', { locale: es }).toUpperCase();
        doc.text(subtitle ? `${periodStr} - ${subtitle}` : periodStr, pageWidth / 2, 45, { align: 'center' });
    };

    // --- HELPER: CALCULATE METRICS ---
    const calculateMetrics = (partes: Parte[]) => {
        const acts = partes.flatMap(p => p.actuaciones);
        const countType = (t: ActuacionType) => acts.filter(a => a.type === t).length;

        const trasladosCount = countType('Traslado');
        const cerrados = partes.filter(p => p.status === 'CERRADO').length;
        const resueltasDirectas = Math.max(0, cerrados - trasladosCount);
        const totalUsersAttended = partes.filter(p => p.clientId).length;

        return {
            users: totalUsersAttended,
            abiertos: totalUsersAttended,
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

    const partesByUser: Record<string, Parte[]> = {};
    data.partes.forEach(p => {
        const uid = p.userId || "unknown";
        if (!partesByUser[uid]) partesByUser[uid] = [];
        partesByUser[uid].push(p);
    });
    const userIds = Object.keys(partesByUser);

    // --- GENERATE PAGES ---
    userIds.forEach((userId, idx) => {
        if (idx > 0) doc.addPage();
        
        const uPartes = partesByUser[userId];
        const uData = data.users.find(u => u.id === userId);
        const userName = uData?.user_metadata?.full_name || uData?.name || uData?.email || "Usuario";
        const metrics: any = calculateMetrics(uPartes);

        addPageHeader(userName);

        let currentY = 55;

        // 1. INDICADORES PRINCIPALES
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text("1. Indicadores Principales", 14, currentY);
        currentY += 5;

        const rows1 = MAIN_INDICATORS.map(ind => {
            const isSub = ind.label.startsWith('-');
            return [isSub ? `    ${ind.label}` : ind.label, metrics[ind.key]];
        });

        autoTable(doc, {
            startY: currentY,
            body: rows1,
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 3,
                lineColor: COLORS.borderGray,
                lineWidth: 0.1,
                textColor: COLORS.textBlack,
            },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
            },
            didParseCell: (data) => {
                if (data.row.index < 3 && data.section === 'body') {
                    data.cell.styles.fillColor = COLORS.headerSalmon;
                    data.cell.styles.fontStyle = 'bold';
                } else if (!(data.row.raw as any)[0].startsWith('    ')) {
                    data.cell.styles.fillColor = COLORS.rowGreen;
                }
            }
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;

        // 2. OTROS INDICADORES
        doc.setFont('helvetica', 'bold');
        doc.text("2. Otros Indicadores de Gestión", 14, currentY);
        currentY += 5;

        const otherSum = OTHER_INDICATORS.reduce((acc, t) => acc + (metrics[t] || 0), 0);
        const rows2 = [
            [{ content: "Total otros indicadores", styles: { fillColor: COLORS.headerSalmon, fontStyle: 'bold' } }, { content: otherSum, styles: { fillColor: COLORS.headerSalmon, fontStyle: 'bold', halign: 'center' } }],
            ...OTHER_INDICATORS.map(t => [`    - ${formatLabel(t)}`, metrics[t] || 0])
        ];

        autoTable(doc, {
            startY: currentY,
            body: rows2,
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 3,
                lineColor: COLORS.borderGray,
                lineWidth: 0.1,
                textColor: COLORS.textBlack,
            },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 30, halign: 'center' }
            }
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;

        // 3. MATRIX (Only on some pages or if room)
        if (idx === userIds.length - 1) { // Add Matrix on the last page or dedicated
            doc.addPage();
            addPageHeader("Resumen Global");
            currentY = 55;

            doc.setFont('helvetica', 'bold');
            doc.text("3. Matriz de Indicadores por Técnico", 14, currentY);
            currentY += 5;

            const userCols = userIds.map(uid => {
                const u = data.users.find(usr => usr.id === uid);
                let name = u?.user_metadata?.full_name || u?.name || u?.email || "Técnico";
                const parts = name.split(' ');
                if (parts.length > 1) name = `${parts[0]} ${parts[1].charAt(0)}.`;
                return { name, uid };
            });

            const headRow = ["Concepto", ...userCols.map(u => u.name)];
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
                startY: currentY,
                head: [headRow],
                body: bodyRows,
                theme: 'grid',
                headStyles: {
                    fillColor: COLORS.headerSalmon,
                    textColor: COLORS.textBlack,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    lineColor: COLORS.borderGray,
                    lineWidth: 0.1,
                    textColor: COLORS.textBlack,
                },
                columnStyles: {
                    0: { fontStyle: 'bold', fillColor: COLORS.rowGreen, cellWidth: 50 },
                }
            });
        }
    });

    // --- FOOTER (Paging) ---
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - 25, pageHeight - 10);
    }

    doc.save(`informe_indicadores_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};

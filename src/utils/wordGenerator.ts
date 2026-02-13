import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeadingLevel, AlignmentType, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { type Parte, type ActuacionType, type User } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

const ORANGE_HEX = "FCD5B4";

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

import { ACTUACION_CONFIG } from './actuacionConfig';

const OTHER_INDICATORS = Object.keys(ACTUACION_CONFIG).filter(type =>
    !['Llamada Realizada', 'Llamada Recibida', 'Correo Enviado', 'Correo Recibido', 'Traslado'].includes(type)
) as ActuacionType[];

const MATRIX_ROWS = Object.keys(ACTUACION_CONFIG).sort() as ActuacionType[];

export const generateWordReport = async (data: ReportData) => {
    // helpers
    const partesByUser: Record<string, Parte[]> = {};
    data.partes.forEach(p => {
        const uid = p.userId || "unknown";
        if (!partesByUser[uid]) partesByUser[uid] = [];
        partesByUser[uid].push(p);
    });
    const userIds = Object.keys(partesByUser);

    // --- METRICS CALC ---
    const calculateMetrics = (partes: Parte[]) => {
        const acts = partes.flatMap(p => p.actuaciones);
        const countType = (t: ActuacionType) => acts.filter(a => a.type === t).length;

        const trasladosCount = countType('Traslado');
        const cerrados = partes.filter(p => p.status === 'CERRADO').length;
        const resueltasDirectas = Math.max(0, cerrados - trasladosCount);
        // Count all partes with clientId (allowing duplicates)
        // Si un cliente tiene 5 partes, cuenta como 5 usuarios atendidos
        const totalUsersAttended = partes.filter(p => p.clientId).length;

        return {
            users: totalUsersAttended,
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

    // --- DOC SECTIONS ---
    const sections = [];

    // 1. MATRIX SECTION
    if (userIds.length > 0) {
        const userCols = userIds.map(uid => {
            const u = data.users.find(usr => usr.id === uid);
            let name = u?.user_metadata?.full_name || u?.name || u?.email || "Desc.";
            const parts = name.split(' ');
            if (parts.length > 1) name = `${parts[0]} ${parts[1]}`;
            return { name, uid };
        });

        const headerRow = new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Indicadores Por Técnico", bold: true })] })], shading: { fill: ORANGE_HEX } }),
                ...userCols.map(u => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: u.name, bold: true })] })], shading: { fill: ORANGE_HEX } }))
            ]
        });

        const bodyRows = MATRIX_ROWS.map(type => {
            return new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: ` - ${formatLabel(type)}` })] }),
                    ...userCols.map(u => {
                        const uPartes = partesByUser[u.uid] || [];
                        const count = uPartes.flatMap(p => p.actuaciones).filter(a => a.type === type).length;
                        return new TableCell({ children: [new Paragraph({ text: count > 0 ? count.toString() : "", alignment: AlignmentType.CENTER })] });
                    })
                ]
            });
        });

        // Add Bolsa de Horas Table Rows if data exists
        let bolsaTable = null;
        if (data.bolsaHoras && (data.bolsaHoras.nominas || data.bolsaHoras.covid)) {
            const bolsaRows = [];
            if (data.bolsaHoras.nominas) {
                bolsaRows.push(new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: "- Actualización Nóminas" })] }),
                        new TableCell({ children: [new Paragraph({ text: data.bolsaHoras.nominas, alignment: AlignmentType.CENTER })] })
                    ]
                }));
            }
            if (data.bolsaHoras.covid) {
                bolsaRows.push(new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: "- COVID" })] }),
                        new TableCell({ children: [new Paragraph({ text: data.bolsaHoras.covid, alignment: AlignmentType.CENTER })] })
                    ]
                }));
            }

            if (bolsaRows.length > 0) {
                bolsaTable = new Table({
                    width: { size: 50, type: WidthType.PERCENTAGE }, // Smaller width
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Bolsa de hora", bold: true })] })], shading: { fill: ORANGE_HEX } }),
                                new TableCell({ children: [new Paragraph({ text: "" })], shading: { fill: ORANGE_HEX } })
                            ]
                        }),
                        ...bolsaRows
                    ]
                });
            }
        }

        const matrixChildren = [
            new Paragraph({ text: "INDICADORES APLICACIONES", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: format(data.startDate, 'MMMM yyyy', { locale: es }).toUpperCase(), heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
            new Paragraph({ children: [new TextRun({ text: "Resumen Global (Matriz)", bold: true })], spacing: { after: 200 } }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [headerRow, ...bodyRows]
            })
        ];

        if (bolsaTable) {
            matrixChildren.push(new Paragraph({ text: "", spacing: { after: 300 } })); // Spacer
            matrixChildren.push(bolsaTable);
        }

        sections.push({
            properties: {},
            children: matrixChildren
        });
    }

    // 2. INDIVIDUAL SECTIONS
    userIds.forEach(userId => {
        const uPartes = partesByUser[userId];
        const uData = data.users.find(u => u.id === userId);
        const userName = uData?.user_metadata?.full_name || uData?.name || uData?.email || "Usuario";
        const metrics: any = calculateMetrics(uPartes);

        const t1Rows = MAIN_INDICATORS.map((ind, idx) => {
            const isHeader = idx < 3;
            const fill = isHeader ? ORANGE_HEX : undefined;
            return new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: ind.label, bold: isHeader })] })], shading: fill ? { fill } : undefined }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: metrics[ind.key].toString(), bold: true })], alignment: AlignmentType.CENTER })], shading: fill ? { fill } : undefined, width: { size: 15, type: WidthType.PERCENTAGE } })
                ]
            });
        });

        const otherSum = OTHER_INDICATORS.reduce((acc, t) => acc + (metrics[t] || 0), 0);
        const t2Header = new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Número total de otros indicadores", bold: true })] })], shading: { fill: ORANGE_HEX } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: otherSum.toString(), bold: true })], alignment: AlignmentType.CENTER })], shading: { fill: ORANGE_HEX }, width: { size: 15, type: WidthType.PERCENTAGE } })
            ]
        });

        const t2Body = OTHER_INDICATORS.map(t => new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ text: ` - ${formatLabel(t)}` })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: (metrics[t] || 0).toString(), bold: true })], alignment: AlignmentType.CENTER })] })
            ]
        }));

        sections.push({
            properties: { type: "nextPage" },
            children: [
                new Paragraph({ text: "INDICADORES APLICACIONES", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
                new Paragraph({ text: format(data.startDate, 'MMMM yyyy', { locale: es }).toUpperCase(), heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER, spacing: { after: 100 } }),
                new Paragraph({ text: `Informe Individual: ${userName}`, alignment: AlignmentType.RIGHT, spacing: { after: 400 } }),

                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: t1Rows,
                    // spacing: { after: 400 } // Removed invalid spacing property
                }),

                new Paragraph({ text: "", spacing: { after: 300 } }),

                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [t2Header, ...t2Body]
                })
            ]
        });
    });

    const doc = new Document({
        sections: sections
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Informe_Corporativo_${format(new Date(), 'yyyyMMdd_HHmm')}.docx`);
};

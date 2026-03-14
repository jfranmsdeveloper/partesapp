import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeadingLevel, AlignmentType, TextRun, BorderStyle, ImageRun, Header, type ISectionOptions } from 'docx';
import { saveAs } from 'file-saver';
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

const COLOR_HEADER = "F4B084"; // Salmón
const COLOR_ROW = "E2EFDA";    // Verde claro
const COLOR_BORDER = "CCCCCC"; // Gris
const DEFAULT_FONT = "Arial";

export const generateWordReport = async (data: ReportData) => {
    // helpers
    const partesByUser: Record<string, Parte[]> = {};
    data.partes.forEach(p => {
        const uid = p.userId || "unknown";
        if (!partesByUser[uid]) partesByUser[uid] = [];
        partesByUser[uid].push(p);
    });
    // Load logo as array buffer
    let logoData: ArrayBuffer | null = null;
    try {
        const response = await fetch('/logo.png');
        if (response.ok) {
            logoData = await response.arrayBuffer();
        }
    } catch (e) {
        console.error("Failed to load logo for report", e);
    }

    const userIds = Object.keys(partesByUser);

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

    const sections: ISectionOptions[] = [];

    // Table Style Constants
    const tableBorders = {
        top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
        left: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
        right: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
    };

    // Helper to create a cell with consistent formatting
    const createCell = (text: string, options: { bold?: boolean, shading?: string, alignment?: (typeof AlignmentType)[keyof typeof AlignmentType], indent?: number } = {}) => {
        return new TableCell({
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: text,
                            bold: options.bold,
                            size: 20, // 10pt in half-points
                            font: DEFAULT_FONT
                        })
                    ],
                    alignment: options.alignment || AlignmentType.LEFT,
                    indent: options.indent ? { left: options.indent * 567 } : undefined, // 0.5cm approx (1cm = 567 twips)
                })
            ],
            shading: options.shading ? { fill: options.shading } : undefined,
            verticalAlign: "center"
        });
    };

    // Iterate through users (or global if scope was 'all')
    userIds.forEach((userId, sectionIdx) => {
        const uPartes = partesByUser[userId];
        const uData = data.users.find(u => u.id === userId);
        const userName = uData?.user_metadata?.full_name || uData?.name || uData?.email || "Usuario";
        const metrics: any = calculateMetrics(uPartes);

        const userChildren: (Paragraph | Table)[] = [
            new Paragraph({
                text: "Informe de Indicadores de Gestión",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            }),
            new Paragraph({
                text: `${format(data.startDate, 'MMMM yyyy', { locale: es }).toUpperCase()} - ${userName}`,
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            })
        ];

        // 1. INDICADORES PRINCIPALES
        userChildren.push(new Paragraph({
            children: [new TextRun({ text: "1. Indicadores Principales", bold: true, font: DEFAULT_FONT })],
            spacing: { before: 200, after: 200 }
        }));

        const t1Rows = MAIN_INDICATORS.map((ind, idx) => {
            const isHeader = idx < 3;
            const isSubRow = ind.label.startsWith('-');
            return new TableRow({
                children: [
                    createCell(ind.label, { 
                        bold: isHeader, 
                        shading: isHeader ? COLOR_HEADER : (isSubRow ? undefined : COLOR_ROW),
                        indent: isSubRow ? 0.5 : 0
                    }),
                    createCell(metrics[ind.key].toString(), { 
                        bold: true, 
                        shading: isHeader ? COLOR_HEADER : (isSubRow ? undefined : COLOR_ROW),
                        alignment: AlignmentType.CENTER 
                    })
                ]
            });
        });

        userChildren.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: t1Rows
        }));

        // 2. OTROS INDICADORES
        const otherSum = OTHER_INDICATORS.reduce((acc, t) => acc + (metrics[t] || 0), 0);
        userChildren.push(new Paragraph({
            children: [new TextRun({ text: "2. Otros Indicadores de Gestión", bold: true, font: DEFAULT_FONT })],
            spacing: { before: 400, after: 200 }
        }));

        const t2Rows = [
            new TableRow({
                children: [
                    createCell("Total otros indicadores", { bold: true, shading: COLOR_HEADER }),
                    createCell(otherSum.toString(), { bold: true, shading: COLOR_HEADER, alignment: AlignmentType.CENTER })
                ]
            }),
            ...OTHER_INDICATORS.map(t => new TableRow({
                children: [
                    createCell(`- ${formatLabel(t)}`, { indent: 0.5 }),
                    createCell((metrics[t] || 0).toString(), { alignment: AlignmentType.CENTER })
                ]
            }))
        ];

        userChildren.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: tableBorders,
            rows: t2Rows
        }));

        // 3. MATRIX (Only on first page or dedicated section)
        if (sectionIdx === 0 && userIds.length > 1) {
            userChildren.push(new Paragraph({
                children: [new TextRun({ text: "3. Matriz de Indicadores por Técnico", bold: true, font: DEFAULT_FONT })],
                spacing: { before: 400, after: 200 }
            }));

            const userCols = userIds.map(uid => {
                const u = data.users.find(usr => usr.id === uid);
                let name = u?.user_metadata?.full_name || u?.name || u?.email || "Técnico";
                const parts = name.split(' ');
                if (parts.length > 1) name = `${parts[0]} ${parts[1].charAt(0)}.`;
                return { name, uid };
            });

            const matrixHeader = new TableRow({
                children: [
                    createCell("Concepto", { bold: true, shading: COLOR_HEADER }),
                    ...userCols.map(u => createCell(u.name, { bold: true, shading: COLOR_HEADER, alignment: AlignmentType.CENTER }))
                ]
            });

            const matrixBody = MATRIX_ROWS.map(type => {
                return new TableRow({
                    children: [
                        createCell(formatLabel(type), { shading: COLOR_ROW }),
                        ...userCols.map(u => {
                            const uPartes = partesByUser[u.uid] || [];
                            const count = uPartes.flatMap(p => p.actuaciones).filter(a => a.type === type).length;
                            return createCell(count > 0 ? count.toString() : "", { shading: COLOR_ROW, alignment: AlignmentType.CENTER });
                        })
                    ]
                });
            });

            userChildren.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: tableBorders,
                rows: [matrixHeader, ...matrixBody]
            }));
        }

        sections.push({
            properties: {
                page: {
                    margin: {
                        top: 1134,
                        bottom: 1134,
                        left: 1134,
                        right: 1134,
                    }
                },
                type: sectionIdx > 0 ? "nextPage" : undefined
            },
            headers: {
                default: new Header({
                    children: [
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            borders: {
                                bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
                                top: { style: BorderStyle.NONE },
                                left: { style: BorderStyle.NONE },
                                right: { style: BorderStyle.NONE },
                            },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: logoData ? [
                                                new Paragraph({
                                                    children: [
                                                        new ImageRun({
                                                            data: logoData,
                                                            transformation: { width: 40, height: 40 },
                                                            type: 'png'
                                                        }),
                                                    ],
                                                }),
                                            ] : [],
                                            verticalAlign: "center",
                                            width: { size: 15, type: WidthType.PERCENTAGE },
                                        }),
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [
                                                        new TextRun({
                                                            text: "Serglobin S.L.",
                                                            bold: true,
                                                            size: 24,
                                                            font: DEFAULT_FONT,
                                                            color: "2D3E50"
                                                        }),
                                                    ],
                                                }),
                                                new Paragraph({
                                                    children: [
                                                        new TextRun({
                                                            text: "Gestión de Actuaciones y Servicios",
                                                            size: 16,
                                                            font: DEFAULT_FONT,
                                                            color: "64748B"
                                                        }),
                                                    ],
                                                }),
                                            ],
                                            verticalAlign: "center",
                                        }),
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [
                                                        new TextRun({
                                                            text: format(new Date(), 'dd/MM/yyyy'),
                                                            size: 16,
                                                            font: DEFAULT_FONT,
                                                            color: "94A3B8"
                                                        }),
                                                    ],
                                                    alignment: AlignmentType.RIGHT,
                                                }),
                                            ],
                                            verticalAlign: "center",
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            },
            children: userChildren
        });
    });

    const doc = new Document({
        sections: sections
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `informe_indicadores.docx`);
};

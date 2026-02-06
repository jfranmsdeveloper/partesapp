import { utils, writeFile } from 'xlsx';
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

export const generateExcelReport = async (data: ReportData) => {
    const workbook = utils.book_new();

    // Helpers
    const partesByUser: Record<string, Parte[]> = {};
    data.partes.forEach(p => {
        const uid = p.userId || "unknown";
        if (!partesByUser[uid]) partesByUser[uid] = [];
        partesByUser[uid].push(p);
    });
    const userIds = Object.keys(partesByUser);

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

    // --- SHEET 1: MATRIX (GLOBAL) ---
    if (userIds.length > 0) {
        const userCols = userIds.map(uid => {
            const u = data.users.find(usr => usr.id === uid);
            let name = u?.user_metadata?.full_name || u?.name || u?.email || "Desc.";
            const parts = name.split(' ');
            if (parts.length > 1) name = `${parts[0]} ${parts[1]}`;
            return { name, uid };
        });

        const matrixData = [
            ["INDICADORES APLICACIONES", format(data.startDate, 'MMMM yyyy', { locale: es }).toUpperCase()],
            [""],
            ["Indicadores Por Técnico", ...userCols.map(u => u.name)], // Header
        ];

        MATRIX_ROWS.forEach(type => {
            const row = [formatLabel(type)];
            userCols.forEach(u => {
                const uPartes = partesByUser[u.uid] || [];
                const count = uPartes.flatMap(p => p.actuaciones).filter(a => a.type === type).length;
                row.push(count === 0 ? '' : count.toString());
            });
            matrixData.push(row);
        });

        // Add Bolsa rows
        if (data.bolsaHoras && (data.bolsaHoras.nominas || data.bolsaHoras.covid)) {
            matrixData.push([""]); // Spacer
            matrixData.push(["Bolsa de hora"]);
            if (data.bolsaHoras.nominas) matrixData.push(["- Actualización Nóminas", "", data.bolsaHoras.nominas]);
            if (data.bolsaHoras.covid) matrixData.push(["- COVID", "", data.bolsaHoras.covid]);
        }

        const wsMatrix = utils.aoa_to_sheet(matrixData);
        wsMatrix['!cols'] = [{ wch: 30 }, ...userCols.map(() => ({ wch: 15 }))];
        utils.book_append_sheet(workbook, wsMatrix, "Matrix Global");
    }

    // --- SHEET 2...N: INDIVIDUAL SUMMARIES ---
    userIds.forEach(userId => {
        const uPartes = partesByUser[userId];
        const uData = data.users.find(u => u.id === userId);
        const userName = uData?.user_metadata?.full_name || uData?.name || uData?.email || "Usuario";
        const metrics: any = calculateMetrics(uPartes);

        const wsData = [
            ["INDICADORES APLICACIONES"],
            [format(data.startDate, 'MMMM yyyy', { locale: es }).toUpperCase()],
            ["Usuario:", userName],
            [""],
        ];

        // Table 1
        MAIN_INDICATORS.forEach(ind => {
            wsData.push([ind.label, metrics[ind.key]]);
        });

        wsData.push([""]);

        // Table 2
        const otherSum = OTHER_INDICATORS.reduce((acc, t) => acc + (metrics[t] || 0), 0);
        wsData.push(["Número total de otros indicadores", otherSum]);
        OTHER_INDICATORS.forEach(t => {
            wsData.push([`- ${formatLabel(t)}`, metrics[t] || 0]);
        });

        const ws = utils.aoa_to_sheet(wsData);
        ws['!cols'] = [{ wch: 60 }, { wch: 10 }];

        // Sheet name cleansing
        let sheetName = userName.replace(/[^a-zA-Z0-9 ]/g, "").slice(0, 31);
        if (!sheetName) sheetName = userId.slice(0, 8);
        if (workbook.SheetNames.includes(sheetName)) sheetName += Math.floor(Math.random() * 99);

        utils.book_append_sheet(workbook, ws, sheetName);
    });

    writeFile(workbook, `Informe_Corporativo_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
};

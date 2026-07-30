import { useMemo, Fragment } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import DOMPurify from 'dompurify';
import type { Parte, ParteStatus, ActuacionType } from '../../types';
import { ACTUACION_CONFIG } from '../../utils/actuacionConfig';

const STATUS_ORDER: ParteStatus[] = ['ABIERTO', 'EN TRÁMITE', 'CERRADO'];

function htmlToPlainText(html: string | undefined): string {
    if (!html?.trim()) return '';
    const clean = DOMPurify.sanitize(html);
    if (typeof document !== 'undefined') {
        const el = document.createElement('div');
        el.innerHTML = clean;
        return (el.textContent || el.innerText || '').replace(/\s+/g, ' ').trim();
    }
    return clean.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatParteDate(iso: string): string {
    try {
        const d = iso.includes('T') ? parseISO(iso) : new Date(iso);
        return format(d, 'dd/MM/yyyy', { locale: es });
    } catch {
        return '—';
    }
}

function formatActuacionDateTime(iso: string): string {
    try {
        return format(parseISO(iso), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
        return '—';
    }
}

function statusBadge(status: ParteStatus) {
    switch (status) {
        case 'ABIERTO':
            return 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30';
        case 'EN TRÁMITE':
            return 'bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30';
        case 'CERRADO':
            return 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30';
    }
}

function sectionHeaderClass(status: ParteStatus) {
    switch (status) {
        case 'ABIERTO':
            return 'bg-amber-500/15 text-amber-950 dark:text-amber-200 border-amber-300/50';
        case 'EN TRÁMITE':
            return 'bg-blue-500/15 text-blue-950 dark:text-blue-200 border-blue-300/50';
        case 'CERRADO':
            return 'bg-emerald-500/15 text-emerald-950 dark:text-emerald-200 border-emerald-300/50';
    }
}

function parteRowTint(status: ParteStatus) {
    switch (status) {
        case 'ABIERTO':
            return 'bg-amber-50/80 dark:bg-amber-500/[0.06] hover:bg-amber-50 dark:hover:bg-amber-500/10 border-l-4 border-l-amber-400';
        case 'EN TRÁMITE':
            return 'bg-blue-50/80 dark:bg-blue-500/[0.06] hover:bg-blue-50 dark:hover:bg-blue-500/10 border-l-4 border-l-blue-400';
        case 'CERRADO':
            return 'bg-emerald-50/80 dark:bg-emerald-500/[0.06] hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border-l-4 border-l-emerald-400';
    }
}

const actTypeBadge: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
    indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300',
    pink: 'bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-300',
    cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300',
    gray: 'bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-300',
    rose: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300',
    sky: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300',
    teal: 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300',
};

interface SpreadsheetViewProps {
    partes: Parte[];
    onOpenParte: (id: Parte['id']) => void;
}

export function SpreadsheetView({ partes, onOpenParte }: SpreadsheetViewProps) {
    const stats = useMemo(() => {
        let actuaciones = 0;
        let minutos = 0;
        const byStatus = { ABIERTO: 0, 'EN TRÁMITE': 0, CERRADO: 0 } as Record<ParteStatus, number>;
        partes.forEach((p) => {
            byStatus[p.status]++;
            actuaciones += p.actuaciones.length;
            minutos += p.totalTime ?? p.actuaciones.reduce((s, a) => s + a.duration, 0);
        });
        return { partes: partes.length, actuaciones, minutos, byStatus };
    }, [partes]);

    const grouped = useMemo(() => {
        return STATUS_ORDER.map((status) => ({
            status,
            items: partes.filter((p) => p.status === status),
        })).filter((g) => g.items.length > 0);
    }, [partes]);

    if (partes.length === 0) {
        return (
            <div className="py-16 text-center text-slate-500 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="font-medium">No hay partes para mostrar en la tabla</p>
                <p className="text-sm mt-1">Ajusta los filtros o crea un parte nuevo</p>
            </div>
        );
    }

    const th =
        'px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800/90 whitespace-nowrap sticky top-0 z-10';

    return (
        <div className="space-y-4 pb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2">
                    <p className="text-[9px] font-black uppercase text-slate-400">Partes</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{stats.partes}</p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2">
                    <p className="text-[9px] font-black uppercase text-slate-400">Actuaciones</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{stats.actuaciones}</p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2">
                    <p className="text-[9px] font-black uppercase text-slate-400">Minutos</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{stats.minutos}</p>
                </div>
                <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/10 px-3 py-2">
                    <p className="text-[9px] font-black uppercase text-amber-700 dark:text-amber-400">Abiertos</p>
                    <p className="text-lg font-black text-amber-900 dark:text-amber-200 tabular-nums">{stats.byStatus.ABIERTO}</p>
                </div>
                <div className="rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/80 dark:bg-blue-500/10 px-3 py-2">
                    <p className="text-[9px] font-black uppercase text-blue-700 dark:text-blue-400">En trámite</p>
                    <p className="text-lg font-black text-blue-900 dark:text-blue-200 tabular-nums">{stats.byStatus['EN TRÁMITE']}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-500/10 px-3 py-2">
                    <p className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-400">Cerrados</p>
                    <p className="text-lg font-black text-emerald-900 dark:text-emerald-200 tabular-nums">{stats.byStatus.CERRADO}</p>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="overflow-x-auto max-h-[calc(100dvh-22rem)] overflow-y-auto">
                    <table className="w-full min-w-[960px] border-collapse text-sm">
                        <thead>
                            <tr>
                                <th className={clsx(th, 'w-24')}>Nº Parte</th>
                                <th className={clsx(th, 'w-28')}>Fecha</th>
                                <th className={th}>Título / Detalle</th>
                                <th className={clsx(th, 'w-36')}>Cliente</th>
                                <th className={clsx(th, 'w-28')}>Estado</th>
                                <th className={clsx(th, 'w-32')}>Autor</th>
                                <th className={clsx(th, 'w-20 text-right')}>Duración</th>
                                <th className={clsx(th, 'w-24 text-right')}>Total min</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grouped.map(({ status, items }) => (
                                <Fragment key={status}>
                                    <tr className={clsx('border-y', sectionHeaderClass(status))}>
                                        <td colSpan={8} className="px-3 py-2 text-xs font-black uppercase tracking-widest">
                                            {status} · {items.length} {items.length === 1 ? 'parte' : 'partes'}
                                        </td>
                                    </tr>
                                    {items.map((parte) => {
                                        const acts = [...parte.actuaciones].sort(
                                            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                                        );
                                        const totalMin =
                                            parte.totalTime ?? acts.reduce((s, a) => s + a.duration, 0);
                                        return (
                                            <Fragment key={parte.id}>
                                                <tr
                                                    className={clsx(
                                                        'cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800',
                                                        parteRowTint(parte.status)
                                                    )}
                                                    onClick={() => onOpenParte(parte.id)}
                                                >
                                                    <td className="px-3 py-2 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                                                        #{parte.id}
                                                    </td>
                                                    <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                        {formatParteDate(parte.createdAt)}
                                                    </td>
                                                    <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">
                                                        {parte.title}
                                                    </td>
                                                    <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 truncate max-w-[9rem]">
                                                        {parte.clientName || '—'}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <span
                                                            className={clsx(
                                                                'text-[9px] font-black px-2 py-0.5 rounded border uppercase',
                                                                statusBadge(parte.status)
                                                            )}
                                                        >
                                                            {parte.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 truncate max-w-[8rem]">
                                                        {parte.createdBy}
                                                    </td>
                                                    <td className="px-3 py-2 text-xs text-right text-slate-500 tabular-nums">
                                                        {acts.length} act.
                                                    </td>
                                                    <td className="px-3 py-2 text-xs text-right font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                                                        {totalMin}
                                                    </td>
                                                </tr>
                                                {acts.length === 0 ? (
                                                    <tr className="bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-slate-800">
                                                        <td className="px-3 py-1.5" />
                                                        <td colSpan={7} className="px-3 py-1.5 text-xs text-slate-400 italic">
                                                            Sin actuaciones
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    acts.map((act, idx) => {
                                                        const cfg = ACTUACION_CONFIG[act.type as ActuacionType];
                                                        const theme = cfg?.themeColor || 'slate';
                                                        const notes = htmlToPlainText(act.notes);
                                                        return (
                                                            <tr
                                                                key={act.id}
                                                                className={clsx(
                                                                    'border-b border-slate-100 dark:border-slate-800/80',
                                                                    idx % 2 === 0
                                                                        ? 'bg-white dark:bg-slate-900'
                                                                        : 'bg-slate-50/70 dark:bg-slate-800/30'
                                                                )}
                                                            >
                                                                <td className="px-3 py-1.5 text-slate-300 dark:text-slate-600 text-center">↳</td>
                                                                <td className="px-3 py-1.5 text-[11px] text-slate-500 whitespace-nowrap tabular-nums">
                                                                    {formatActuacionDateTime(act.timestamp)}
                                                                </td>
                                                                <td className="px-3 py-1.5">
                                                                    <span
                                                                        className={clsx(
                                                                            'inline-block text-[10px] font-bold px-2 py-0.5 rounded',
                                                                            actTypeBadge[theme] || actTypeBadge.slate
                                                                        )}
                                                                    >
                                                                        {act.type}
                                                                    </span>
                                                                    {notes && (
                                                                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                                                                            {notes}
                                                                        </p>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-1.5 text-[11px] text-slate-400">—</td>
                                                                <td className="px-3 py-1.5 text-[11px] text-slate-400">—</td>
                                                                <td className="px-3 py-1.5 text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[8rem]">
                                                                    {act.user}
                                                                </td>
                                                                <td className="px-3 py-1.5 text-[11px] text-right font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                                                                    {act.duration} m
                                                                </td>
                                                                <td className="px-3 py-1.5" />
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </Fragment>
                                        );
                                    })}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

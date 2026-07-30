import { X, User, Clock, ArrowRight, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import type { Parte } from '../../types';
import { ACTUACION_CONFIG } from '../../utils/actuacionConfig';
import type { ActuacionType } from '../../types';
import { Button } from '../ui/Button';

function statusBadgeClass(status: Parte['status']) {
    switch (status) {
        case 'ABIERTO':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400';
        case 'EN TRÁMITE':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400';
        case 'CERRADO':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400';
    }
}

interface CalendarPartePreviewModalProps {
    parte: Parte | null;
    onClose: () => void;
    onOpenParte: (id: Parte['id']) => void;
}

export function CalendarPartePreviewModal({ parte, onClose, onOpenParte }: CalendarPartePreviewModalProps) {
    if (!parte) return null;

    const created = parte.createdAt.includes('T') ? parseISO(parte.createdAt) : new Date(parte.createdAt);
    const sortedActuaciones = [...parte.actuaciones].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
            role="presentation"
        >
            <div
                className="bg-white dark:bg-slate-900 w-full max-w-lg max-h-[min(85dvh,32rem)] rounded-2xl shadow-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 flex flex-col animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="calendar-parte-preview-title"
            >
                <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-start gap-3 bg-slate-50/60 dark:bg-white/[0.03] shrink-0">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Parte #{parte.id}</span>
                        </div>
                        <h3 id="calendar-parte-preview-title" className="font-bold text-slate-900 dark:text-white text-lg leading-snug truncate">
                            {parte.title}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-all shrink-0"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto min-h-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={clsx('text-[10px] font-black px-2 py-0.5 rounded-md uppercase', statusBadgeClass(parte.status))}>
                            {parte.status}
                        </span>
                        <span className="text-xs text-slate-500 capitalize">
                            {format(created, "d MMM yyyy", { locale: es })}
                        </span>
                        {parte.clientName && (
                            <span className="text-xs text-slate-500 truncate">· {parte.clientName}</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <User className="w-4 h-4 shrink-0" />
                        <span>{parte.createdBy}</span>
                        <span className="text-slate-300">|</span>
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>{parte.totalTime ?? 0} min · {parte.actuaciones.length} actuaciones</span>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Actuaciones</h4>
                        {sortedActuaciones.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">Sin actuaciones registradas.</p>
                        ) : (
                            <ul className="space-y-2">
                                {sortedActuaciones.map((a) => {
                                    const config = ACTUACION_CONFIG[a.type as ActuacionType];
                                    const Icon = config?.icon;
                                    return (
                                        <li
                                            key={a.id}
                                            className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/5"
                                        >
                                            <div className="flex items-start gap-2">
                                                {Icon && (
                                                    <span className="p-1.5 rounded-lg bg-white dark:bg-white/5 text-slate-600 shrink-0">
                                                        <Icon className="w-3.5 h-3.5" />
                                                    </span>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex justify-between gap-2">
                                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{a.type}</span>
                                                        <span className="text-[10px] font-black text-slate-400 shrink-0">{a.duration}m</span>
                                                    </div>
                                                    {a.notes && (
                                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-3">{a.notes}</p>
                                                    )}
                                                    <p className="text-[10px] text-slate-400 mt-1">{a.user}</p>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-white/5 shrink-0 bg-slate-50/40 dark:bg-white/[0.02]">
                    <Button
                        type="button"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => onOpenParte(parte.id)}
                    >
                        Abrir parte completo
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function parteStatusDotClass(status: Parte['status']): string {
    switch (status) {
        case 'ABIERTO':
            return 'bg-amber-500 hover:bg-amber-400 focus:ring-amber-400';
        case 'EN TRÁMITE':
            return 'bg-blue-500 hover:bg-blue-400 focus:ring-blue-400';
        case 'CERRADO':
            return 'bg-emerald-500 hover:bg-emerald-400 focus:ring-emerald-400';
    }
}

export function parteTooltipLabel(parte: { title: string; clientName?: string }): string {
    return [parte.title, parte.clientName].filter(Boolean).join(' · ');
}

import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { History, Calendar, Clock, User as UserIcon, Tag } from 'lucide-react';
import { Card } from '../ui/Card';
import { clsx } from 'clsx';

interface ClientHistoryProps {
    clientId?: string;
    currentParteId?: number | string;
}

export const ClientHistory = ({ clientId, currentParteId }: ClientHistoryProps) => {
    const { partes } = useAppStore();

    const history = useMemo(() => {
        if (!clientId) return [];

        // Flatten all actions across all parts for this client
        // excluding current part to avoid redundancy
        return partes
            .filter(p => String(p.clientId) === String(clientId))
            .flatMap(p => p.actuaciones.map(a => ({
                ...a,
                parteTitle: p.title,
                parteId: p.id,
                date: a.timestamp
            })))
            .filter(a => String(a.parteId) !== String(currentParteId))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5); // Take the last 5
    }, [partes, clientId, currentParteId]);

    if (!clientId || history.length === 0) return null;

    return (
        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                    <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">
                        Últimas Actuaciones
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                        Contexto histórico para este cliente
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.map((item, idx) => (
                    <div 
                        key={item.id}
                        className={clsx(
                            "group relative p-4 rounded-2xl border transition-all duration-300",
                            "bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-white/20 dark:border-white/5",
                            "hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 hover:border-blue-200/50 dark:hover:border-blue-500/30",
                            idx === 0 ? "md:col-span-2 lg:col-span-1 border-blue-100 dark:border-blue-900/30 bg-blue-50/20" : ""
                        )}
                    >
                        {/* Header: Date & Type */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                <Calendar className="w-3 h-3" />
                                <span className="text-[10px] font-black uppercase">
                                    {new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                            <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                                {item.type}
                            </span>
                        </div>

                        {/* Content */}
                        <div className="mb-3">
                            <p 
                                className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: item.notes || 'Sin descripción detallada' }} 
                            />
                        </div>

                        {/* Footer: User & Duration */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5 mt-auto">
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <UserIcon className="w-3 h-3" />
                                <span className="text-[10px] font-bold">{item.user}</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-400">
                                <Clock className="w-3 h-3" />
                                <span className="text-[10px] font-bold">{item.duration} min</span>
                            </div>
                        </div>

                        {/* Context Tag: Related Parte */}
                        <div className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-lg">
                            PARTE: {item.parteTitle}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

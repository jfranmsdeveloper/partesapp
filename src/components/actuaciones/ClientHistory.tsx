import React, { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { History, Calendar, Clock, User as UserIcon, Tag, ChevronDown } from 'lucide-react';
import { Card } from '../ui/Card';
import { clsx } from 'clsx';

interface ClientHistoryProps {
    clientId?: string;
    currentParteId?: number | string;
}

export const ClientHistory = ({ clientId, currentParteId }: ClientHistoryProps) => {
    const { partes } = useAppStore();
    const [isOpen, setIsOpen] = React.useState(false);

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
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 -m-2 rounded-xl transition-all"
            >
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 dark:group-hover:bg-blue-800/30 transition-colors">
                        <History className={clsx("w-5 h-5 text-blue-600 dark:text-blue-400 transition-transform duration-500", isOpen && "rotate-12")} />
                    </div>
                    <div className="text-left">
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter flex items-center gap-2">
                            Historial del Cliente
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-md font-black">
                                {history.length}
                            </span>
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                            {isOpen ? 'Haz clic para plegar' : 'Ver últimas actuaciones realizadas'}
                        </p>
                    </div>
                </div>
                <div className={clsx(
                    "p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-blue-500 transition-all",
                    isOpen ? "rotate-180" : ""
                )}>
                    <ChevronDown className="w-4 h-4" />
                </div>
            </button>

            {isOpen && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 animate-in zoom-in-95 fade-in duration-300">
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
                                        {new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                    </span>
                                </div>
                                <span className="text-[10px] font-black bg-blue-600/10 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                    {item.type}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="mb-3">
                                <p 
                                    className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: item.notes || 'Sin descripción' }} 
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
            )}
        </div>
    );
};

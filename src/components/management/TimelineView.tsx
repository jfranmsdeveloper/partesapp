import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, User, ArrowRight, FileText, Activity } from 'lucide-react';
import { clsx } from 'clsx';
import type { Parte } from '../../types';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';

interface TimelineViewProps {
    partes: Parte[];
}

export const TimelineView = ({ partes }: TimelineViewProps) => {
    const navigate = useNavigate();

    const timelineItems = useMemo(() => {
        return [...partes].sort((a, b) => {
            const dateA = a.createdAt.includes('T') ? parseISO(a.createdAt) : new Date(a.createdAt);
            const dateB = b.createdAt.includes('T') ? parseISO(b.createdAt) : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        });
    }, [partes]);

    if (timelineItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] border border-dashed border-slate-300 dark:border-slate-800">
                <Activity className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
                <p className="text-slate-500 font-medium">No hay actividad reciente para mostrar.</p>
            </div>
        );
    }

    return (
        <div className="relative space-y-8 pb-12">
            {/* Vertical Line */}
            <div className="absolute left-[39px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-blue-500 via-indigo-500/50 to-transparent hidden md:block" />

            {timelineItems.map((parte) => {
                const date = parte.createdAt.includes('T') ? parseISO(parte.createdAt) : new Date(parte.createdAt);
                
                return (
                    <div key={parte.id} className="relative flex flex-col md:flex-row gap-6 md:items-center group">
                        {/* Time Marker */}
                        <div className="flex items-center gap-4 md:w-32 flex-shrink-0 relative z-10">
                            <div className="w-20 hidden md:block text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-500 transition-colors">
                                    {format(date, 'MMM d', { locale: es })}
                                </p>
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                    {format(date, 'p', { locale: es })}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Clock className="w-5 h-5 text-blue-500" />
                            </div>
                        </div>

                        {/* Event Card */}
                        <Card 
                            className="flex-1 p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-white/40 dark:border-white/5 rounded-[2rem] hover:scale-[1.01] transition-all duration-500 cursor-pointer shadow-xl group/card relative overflow-hidden"
                            onClick={() => navigate(`/parte/${parte.id}`)}
                        >
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                            
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <span className={clsx(
                                            "text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter",
                                            parte.status === 'ABIERTO' ? 'bg-green-500/10 text-green-600' : 
                                            parte.status === 'EN TRÁMITE' ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-500/10 text-slate-500'
                                        )}>
                                            {parte.status}
                                        </span>
                                        <span className="text-xs font-black text-slate-400">#{parte.id}</span>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover/card:text-blue-500 transition-colors">
                                        {parte.title}
                                    </h3>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-500">{parte.createdBy}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs font-bold text-slate-500">{parte.actuaciones.length} Actuaciones</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end">
                                    <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover/card:bg-blue-600 group-hover/card:text-white transition-all transform group-hover/card:translate-x-1">
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                );
            })}
        </div>
    );
};

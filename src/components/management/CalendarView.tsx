import { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
    parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, User, Calendar as CalendarIcon } from 'lucide-react';
import { clsx } from 'clsx';
import type { Parte } from '../../types';
import { useNavigate } from 'react-router-dom';

interface CalendarViewProps {
    partes: Parte[];
}

export const CalendarView = ({ partes }: CalendarViewProps) => {
    const navigate = useNavigate();
    
    // Smart initialization: Focus on the month with the most recent data
    const [currentMonth, setCurrentMonth] = useState(() => {
        if (partes.length === 0) return new Date();
        const sorted = [...partes].sort((a, b) => {
            const dateA = a.createdAt.includes('T') ? parseISO(a.createdAt) : new Date(a.createdAt);
            const dateB = b.createdAt.includes('T') ? parseISO(b.createdAt) : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        });
        const mostRecent = sorted[0].createdAt;
        return mostRecent.includes('T') ? parseISO(mostRecent) : new Date(mostRecent);
    });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/40 dark:border-white/5 shadow-2xl flex flex-col h-full overflow-hidden transition-all duration-500">
            {/* Calendar Header - Liquid Style */}
            <div className="flex flex-col md:flex-row items-center justify-between p-6 gap-4 border-b border-white/20 dark:border-white/5 bg-white/30 dark:bg-white/5">
                <div className="flex items-center gap-5">
                    <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white capitalize tracking-tight">
                            {format(currentMonth, 'MMMM yyyy', { locale: es })}
                        </h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Vista de Gestión</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-white/40 dark:border-white/10 shadow-lg">
                    <button
                        onClick={prevMonth}
                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all active:scale-90 text-slate-600 dark:text-slate-300"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={goToToday}
                        className="px-4 py-1.5 text-sm font-black text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all"
                    >
                        Hoy
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all active:scale-90 text-slate-600 dark:text-slate-300"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Week Headers */}
            <div className="grid grid-cols-7 border-b border-white/20 dark:border-white/5">
                {weekDays.map(day => (
                    <div key={day} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-7 auto-rows-fr min-h-[600px]">
                    {calendarDays.map((day, idx) => {
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isTodayDate = isToday(day);

                        const dayPartes = partes.filter(p => {
                            const date = p.createdAt.includes('T') ? parseISO(p.createdAt) : new Date(p.createdAt);
                            return isSameDay(date, day);
                        });

                        return (
                            <div
                                key={idx}
                                className={clsx(
                                    "min-h-[140px] p-3 border-b border-r border-white/20 dark:border-white/5 transition-all duration-300 group",
                                    !isCurrentMonth ? "bg-slate-50/10 dark:bg-slate-900/10 opacity-30 grayscale-[0.5]" : "bg-transparent",
                                    isTodayDate && "bg-blue-500/5"
                                )}
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <span className={clsx(
                                        "text-xs font-black w-7 h-7 flex items-center justify-center rounded-xl transition-all",
                                        isTodayDate
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110"
                                            : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                                    )}>
                                        {format(day, 'd')}
                                    </span>

                                    {dayPartes.length > 0 && (
                                        <div className="flex -space-x-1">
                                            {dayPartes.slice(0, 3).map((_, i) => (
                                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-900" />
                                            ))}
                                            {dayPartes.length > 3 && (
                                                <span className="text-[8px] font-black text-slate-400 ml-1.5">
                                                    +{dayPartes.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {dayPartes.map(parte => (
                                        <div
                                            key={parte.id}
                                            onClick={() => navigate(`/parte/${parte.id}`)}
                                            className={clsx(
                                                "group/item flex flex-col p-2.5 rounded-2xl border transition-all duration-500 cursor-pointer hover:scale-[1.05] hover:shadow-2xl hover:z-10 relative overflow-hidden",
                                                parte.status === 'ABIERTO' ? "bg-green-500/5 border-green-500/20 hover:bg-green-500/10" :
                                                    parte.status === 'EN TRÁMITE' ? "bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10" :
                                                        "bg-slate-500/5 border-slate-500/20 hover:bg-slate-500/10"
                                            )}
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                            
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={clsx(
                                                    "text-[10px] font-black tracking-wider uppercase",
                                                    parte.status === 'ABIERTO' ? "text-green-600 dark:text-green-400" :
                                                        parte.status === 'EN TRÁMITE' ? "text-blue-600 dark:text-blue-400" :
                                                            "text-slate-500"
                                                )}>
                                                    #{parte.id}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-800 dark:text-slate-100 line-clamp-1 truncate">
                                                {parte.title}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <div className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-white/50 dark:border-white/5">
                                                    <User className="w-2.5 h-2.5 text-slate-400" />
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400 truncate uppercase tracking-tighter">
                                                    {parte.createdBy.split(' ')[0]}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

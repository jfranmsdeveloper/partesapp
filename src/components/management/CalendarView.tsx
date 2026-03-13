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
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { clsx } from 'clsx';
import type { Parte } from '../../types';
import { useNavigate } from 'react-router-dom';

interface CalendarViewProps {
    partes: Parte[];
}

export const CalendarView = ({ partes }: CalendarViewProps) => {
    const navigate = useNavigate();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: es });
    const endDate = endOfWeek(monthEnd, { locale: es });

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </h2>
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button
                            onClick={prevMonth}
                            className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-all text-slate-500 hover:text-orange-600"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={nextMonth}
                            className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-all text-slate-500 hover:text-orange-600"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                    <button
                        onClick={goToToday}
                        className="text-sm font-medium text-orange-600 hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        Hoy
                    </button>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Abierto</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span>En Trámite</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                        <span>Cerrado</span>
                    </div>
                </div>
            </div>

            {/* Week Headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                {weekDays.map(day => (
                    <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-7 auto-rows-fr min-h-[600px] h-full">
                    {calendarDays.map((day) => {
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isTodayDate = isToday(day);

                        // Filter partes for this day
                        const dayPartes = partes.filter(p => {
                            const date = p.createdAt.includes('T') ? parseISO(p.createdAt) : new Date(p.createdAt);
                            return isSameDay(date, day);
                        });

                        return (
                            <div
                                key={day.toString()}
                                className={clsx(
                                    "min-h-[120px] p-2 border-b border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
                                    !isCurrentMonth && "bg-slate-50/30 dark:bg-slate-900/50 opacity-60",
                                    isTodayDate && "bg-orange-50/30 dark:bg-orange-900/10"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={clsx(
                                        "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
                                        isTodayDate
                                            ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                                            : "text-slate-700 dark:text-slate-300"
                                    )}>
                                        {format(day, 'd')}
                                    </span>

                                    {dayPartes.length > 0 && (
                                        <span className="text-[10px] font-bold text-slate-400">
                                            {dayPartes.length} {dayPartes.length === 1 ? 'parte' : 'partes'}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    {dayPartes.map(parte => (
                                        <div
                                            key={parte.id}
                                            onClick={() => navigate(`/parte/${parte.id}`)}
                                            className={clsx(
                                                "group flex flex-col p-1.5 rounded-lg border text-xs cursor-pointer transition-all hover:shadow-md",
                                                parte.status === 'ABIERTO' ? "bg-green-50 border-green-200 hover:border-green-300" :
                                                    parte.status === 'EN TRÁMITE' ? "bg-blue-50 border-blue-200 hover:border-blue-300" :
                                                        "bg-slate-50 border-slate-200 hover:border-slate-300 opacity-80"
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className={clsx(
                                                    "font-bold truncate",
                                                    parte.status === 'ABIERTO' ? "text-green-700" :
                                                        parte.status === 'EN TRÁMITE' ? "text-blue-700" :
                                                            "text-slate-600"
                                                )}>
                                                    #{parte.id}
                                                </span>
                                                <div className={clsx(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    parte.status === 'ABIERTO' ? "bg-green-500" :
                                                        parte.status === 'EN TRÁMITE' ? "bg-blue-500" :
                                                            "bg-slate-400"
                                                )} />
                                            </div>
                                            <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1 truncate leading-tight">
                                                {parte.title}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                                                <User className="w-3 h-3" />
                                                <span className="truncate max-w-[80px]">{parte.createdBy.split(' ')[0]}</span>
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

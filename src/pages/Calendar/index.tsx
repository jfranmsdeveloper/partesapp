import { useState, useMemo } from 'react';
import { useUserStore } from '../../hooks/useUserStore';
import { Card } from '../../components/ui/Card';
import { 
    ChevronLeft, 
    ChevronRight, 
    Calendar as CalendarIcon, 
    Clock, 
    ArrowRight
} from 'lucide-react';
import { 
    format, 
    addMonths, 
    subMonths, 
    startOfMonth, 
    endOfMonth, 
    startOfWeek, 
    endOfWeek, 
    eachDayOfInterval, 
    isSameMonth, 
    isSameDay, 
    isToday,
    parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import { ACTUACION_CONFIG } from '../../utils/actuacionConfig';

export default function CalendarPage() {
    const { partes } = useUserStore();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Calendar logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate
    });

    // Extract all actions for the calendar
    const allActions = useMemo(() => {
        return partes.flatMap(p => 
            p.actuaciones.map(a => ({
                ...a,
                parteId: p.id,
                parteTitle: p.title,
                // Prioritize Parte date for calendar grouping (The PDF date)
                // rather than the specific timestamp of the action which might be "Now"
                date: parseISO(p.createdAt) 
            }))
        );
    }, [partes]);

    // Actions for the selected day
    const selectedDayActions = useMemo(() => {
        return allActions.filter(a => isSameDay(a.date, selectedDate));
    }, [allActions, selectedDate]);

    // Handle navigation
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
        <div className="w-full space-y-8 pb-20 fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 w-fit">
                        <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Control Temporal</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">Calendario</h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-light">
                        Vista mensual de tus actuaciones y partes de trabajo.
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-800/50 p-2 rounded-3xl border border-white/20 dark:border-white/10 backdrop-blur-xl shadow-2xl">
                    <button 
                        onClick={prevMonth}
                        className="p-3 rounded-2xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all active:scale-90"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="px-4 min-w-[160px] text-center">
                        <h2 className="text-xl font-black capitalize text-slate-900 dark:text-white">
                            {format(currentMonth, 'MMMM yyyy', { locale: es })}
                        </h2>
                    </div>
                    <button 
                        onClick={nextMonth}
                        className="p-3 rounded-2xl hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all active:scale-90"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Calendar Grid - Liquid Glass Container */}
                <Card className="lg:col-span-2 p-4 md:p-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border-white/40 dark:border-white/5 shadow-2xl rounded-[3rem] overflow-hidden">
                    {/* Days of week header */}
                    <div className="grid grid-cols-7 mb-4">
                        {weekDays.map(day => (
                            <div key={day} className="text-center py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar body */}
                    <div className="grid grid-cols-7 gap-1 md:gap-3">
                        {calendarDays.map((day, idx) => {
                            const dayActions = allActions.filter(a => isSameDay(a.date, day));
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isSelected = isSameDay(day, selectedDate);
                            const isTodayDay = isToday(day);

                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDate(day)}
                                    className={clsx(
                                        "relative h-20 md:h-32 p-2 rounded-[1.5rem] md:rounded-[2rem] border transition-all duration-500 flex flex-col items-center justify-between group overflow-hidden",
                                        !isCurrentMonth ? "opacity-20 scale-95" : "opacity-100",
                                        isSelected 
                                            ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)] z-10 scale-105" 
                                            : "bg-white/30 dark:bg-white/5 border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10"
                                    )}
                                >
                                    {/* Glass Shine Effect */}
                                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                                    
                                    <div className="w-full flex justify-between items-start relative z-10">
                                        <span className={clsx(
                                            "text-sm font-black w-8 h-8 flex items-center justify-center rounded-full transition-all",
                                            isTodayDay ? "bg-blue-600 text-white shadow-lg" : 
                                            isSelected ? "text-blue-600" : "text-slate-700 dark:text-slate-300"
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>

                                    {/* Action Indicators */}
                                    <div className="flex flex-wrap justify-center gap-1 mt-auto pb-1 max-w-full">
                                        {dayActions.slice(0, 4).map((action, i) => {
                                            const config = ACTUACION_CONFIG[action.type];
                                            const colorClass = config?.themeColor === 'blue' ? 'bg-blue-500' :
                                                              config?.themeColor === 'green' ? 'bg-green-500' :
                                                              config?.themeColor === 'red' ? 'bg-red-500' :
                                                              config?.themeColor === 'orange' ? 'bg-orange-500' :
                                                              config?.themeColor === 'amber' ? 'bg-amber-500' : 'bg-slate-400';
                                            
                                            return (
                                                <div 
                                                    key={i} 
                                                    className={clsx(
                                                        "w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ring-1 ring-white dark:ring-slate-900 shadow-sm",
                                                        colorClass
                                                    )} 
                                                    title={action.type}
                                                />
                                            );
                                        })}
                                        {dayActions.length > 4 && (
                                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-slate-300 dark:bg-slate-600 ring-1 ring-white flex items-center justify-center">
                                                <span className="text-[6px] font-bold text-slate-800">...</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Fluid Background Glow */}
                                    {isSelected && (
                                        <div className="absolute inset-0 bg-blue-500/5 animate-pulse -z-10" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </Card>

                {/* Day Details Sidebar */}
                <div className="space-y-6 max-h-[800px] overflow-y-auto no-scrollbar pr-2">
                    <div className="px-4">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white capitalize">
                            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Actividades de este día</p>
                    </div>

                    {selectedDayActions.length > 0 ? (
                        <div className="space-y-4">
                            {selectedDayActions.map((action, idx) => {
                                const config = ACTUACION_CONFIG[action.type];
                                const Icon = config?.icon || CalendarIcon;
                                const themeColor = config?.themeColor || 'blue';

                                return (
                                    <Card 
                                        key={idx} 
                                        className="p-5 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-white/40 dark:border-white/5 rounded-[2rem] hover:scale-[1.02] transition-all group cursor-pointer"
                                        onClick={() => window.location.href = `/parte/${action.parteId}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={clsx(
                                                "p-3 rounded-2xl transition-all shadow-sm",
                                                `bg-${themeColor}-500/10 text-${themeColor}-600`
                                            )}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{action.type}</h4>
                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                                                        {format(action.date, 'HH:mm')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{action.parteTitle}</p>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-100/30 dark:bg-white/5 rounded-[3rem] border border-dashed border-slate-300 dark:border-slate-800">
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-full mb-4 shadow-sm">
                                <Clock className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">No hay actuaciones registradas para este día.</p>
                        </div>
                    )}

                    {/* Quick Stats of the day */}
                    {selectedDayActions.length > 0 && (
                        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-indigo-100">Resumen del día</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-3xl font-black tabular-nums">{selectedDayActions.length}</p>
                                    <p className="text-[10px] uppercase font-bold opacity-70">Tareas</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-black tabular-nums">
                                        {selectedDayActions.reduce((acc, a) => acc + (a.duration || 0), 0)}
                                    </p>
                                    <p className="text-[10px] uppercase font-bold opacity-70">Minutos</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TrendingUp(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
        </svg>
    )
}

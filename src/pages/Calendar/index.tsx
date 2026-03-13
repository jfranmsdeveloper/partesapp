import { useState, useMemo } from 'react';
import { useUserStore } from '../../hooks/useUserStore';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { 
    ChevronLeft, 
    ChevronRight, 
    Calendar as CalendarIcon, 
    Clock, 
    User,
    ArrowRight,
    FileText
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
import type { ActuacionType } from '../../types';

export default function CalendarPage() {
    const navigate = useNavigate();
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

    // Extract all items for the calendar (Both Partes and Actions)
    const calendarData = useMemo(() => {
        const items: any[] = [];
        
        partes.forEach(p => {
            const date = p.createdAt.includes('T') ? parseISO(p.createdAt) : new Date(p.createdAt);
            // Add the Parte itself
            items.push({
                id: `parte-${p.id}`,
                type: 'PARTE',
                parteId: p.id,
                title: p.title,
                date: date,
                status: p.status,
                createdBy: p.createdBy
            });

            // Add its Actions
            p.actuaciones.forEach((a, idx) => {
                items.push({
                    ...a,
                    id: `act-${a.id}-${idx}`,
                    type: 'ACTUACION',
                    parteId: p.id,
                    parteTitle: p.title,
                    date: date // Group by Parte date
                });
            });
        });
        
        return items;
    }, [partes]);

    // Items for the selected day
    const selectedDayItems = useMemo(() => {
        return calendarData.filter(item => isSameDay(item.date, selectedDate));
    }, [calendarData, selectedDate]);

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
                    <div className="grid grid-cols-7 mb-4">
                        {weekDays.map(day => (
                            <div key={day} className="text-center py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 md:gap-3">
                        {calendarDays.map((day, idx) => {
                            const dayItems = calendarData.filter(item => isSameDay(item.date, day));
                            const dayPartes = dayItems.filter(i => i.type === 'PARTE');
                            const dayActions = dayItems.filter(i => i.type === 'ACTUACION');
                            
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isSelected = isSameDay(day, selectedDate);
                            const isTodayDay = isToday(day);

                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDate(day)}
                                    className={clsx(
                                        "relative h-28 md:h-40 p-2 rounded-[1.5rem] md:rounded-[2rem] border transition-all duration-500 flex flex-col items-center justify-between group overflow-hidden",
                                        !isCurrentMonth ? "opacity-20 scale-95" : "opacity-100",
                                        isSelected 
                                            ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)] z-10 scale-105" 
                                            : "bg-white/30 dark:bg-white/5 border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10"
                                    )}
                                >
                                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                                    
                                    <div className="w-full flex justify-between items-start relative z-10">
                                        <span className={clsx(
                                            "text-xs font-black w-6 h-6 flex items-center justify-center rounded-full transition-all",
                                            isTodayDay ? "bg-blue-600 text-white shadow-lg" : 
                                            isSelected ? "text-blue-600" : "text-slate-700 dark:text-slate-300"
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                        {dayPartes.length > 0 && (
                                            <span className="text-[8px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                                                {dayPartes.length} P
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1 w-full mt-auto">
                                        <div className="flex flex-wrap justify-center gap-1 pb-1 max-w-full">
                                            {dayActions.slice(0, 6).map((action, i) => {
                                                const actionType = action.type as ActuacionType;
                                                const config = ACTUACION_CONFIG[actionType];
                                                const themeColor = config?.themeColor || 'blue';
                                                
                                                return (
                                                    <div 
                                                        key={i} 
                                                        className={clsx(
                                                            "w-1.5 h-1.5 rounded-full ring-1 ring-white dark:ring-slate-900 shadow-sm",
                                                            themeColor === 'blue' ? 'bg-blue-500' :
                                                            themeColor === 'green' ? 'bg-green-500' :
                                                            themeColor === 'red' ? 'bg-red-500' :
                                                            themeColor === 'orange' ? 'bg-orange-500' :
                                                            themeColor === 'amber' ? 'bg-amber-500' : 'bg-slate-400'
                                                        )} 
                                                    />
                                                );
                                            })}
                                        </div>
                                        
                                        <div className="flex gap-0.5 w-full h-1 px-1">
                                            {dayPartes.slice(0, 10).map((p, i) => (
                                                <div 
                                                    key={i} 
                                                    className={clsx(
                                                        "flex-1 rounded-full",
                                                        p.status === 'ABIERTO' ? 'bg-green-400' : 
                                                        p.status === 'EN TRÁMITE' ? 'bg-blue-400' : 'bg-slate-300'
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>

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

                    {selectedDayItems.length > 0 ? (
                        <div className="space-y-4">
                            {selectedDayItems.map((item, idx) => {
                                if (item.type === 'PARTE') {
                                    return (
                                        <Card 
                                            key={idx} 
                                            className="p-5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-blue-200/50 dark:border-blue-500/10 rounded-[2rem] hover:scale-[1.02] transition-all group cursor-pointer shadow-lg"
                                            onClick={() => navigate(`/parte/${item.parteId}`)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-2xl bg-indigo-500 text-white shadow-lg">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-slate-900 dark:text-white truncate">Parte #{item.parteId}</h4>
                                                        <span className={clsx(
                                                            "text-[8px] font-black px-2 py-0.5 rounded-full uppercase",
                                                            item.status === 'ABIERTO' ? 'bg-green-100 text-green-700' : 
                                                            item.status === 'EN TRÁMITE' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                                        )}>
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 italic">{item.title}</p>
                                                    <div className="flex items-center gap-1 mt-2">
                                                        <User className="w-3 h-3 text-slate-400" />
                                                        <span className="text-[10px] text-slate-400 font-bold">{item.createdBy}</span>
                                                    </div>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                            </div>
                                        </Card>
                                    );
                                }

                                const itemType = item.type as ActuacionType;
                                const config = ACTUACION_CONFIG[itemType];
                                const Icon = config?.icon || CalendarIcon;
                                const themeColor = config?.themeColor || 'blue';

                                return (
                                    <Card 
                                        key={idx} 
                                        className="p-4 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border-white/20 dark:border-white/5 rounded-2xl hover:scale-[1.02] transition-all group cursor-pointer ml-4 border-l-4 border-l-blue-500"
                                        onClick={() => navigate(`/parte/${item.parteId}`)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={clsx(
                                                "p-2 rounded-xl transition-all",
                                                `bg-${themeColor}-500/10 text-${themeColor}-600`
                                            )}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate">{item.type}</h4>
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        {item.duration} min
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">En Parte #{item.parteId}</p>
                                            </div>
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
                            <p className="text-slate-500 dark:text-slate-400 font-medium">No hay registros para este día.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

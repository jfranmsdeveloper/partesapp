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
    FileText,
    Plus,
    Bell,
    Trash2,
    CheckCircle2,
    CheckCircle,
    Link2
} from 'lucide-react';
import { ReminderModal } from '../../components/reminders/ReminderModal';
import { useAppStore } from '../../store/useAppStore';
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
    const { partes, reminders, updateReminder, deleteReminder } = useAppStore();
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(() => {
        if (partes.length === 0) return new Date();
        const sorted = [...partes].sort((a, b) => {
            const dateA = a.createdAt.includes('T') ? parseISO(a.createdAt) : new Date(a.createdAt);
            const dateB = b.createdAt.includes('T') ? parseISO(b.createdAt) : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        });
        return sorted[0].createdAt.includes('T') ? parseISO(sorted[0].createdAt) : new Date(sorted[0].createdAt);
    });
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        if (partes.length === 0) return new Date();
        const sorted = [...partes].sort((a, b) => {
            const dateA = a.createdAt.includes('T') ? parseISO(a.createdAt) : new Date(a.createdAt);
            const dateB = b.createdAt.includes('T') ? parseISO(b.createdAt) : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        });
        return sorted[0].createdAt.includes('T') ? parseISO(sorted[0].createdAt) : new Date(sorted[0].createdAt);
    });

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
        
        // Add Reminders
        reminders.forEach(r => {
            items.push({
                ...r,
                type: 'REMINDER',
                date: parseISO(r.dueDate)
            });
        });
        
        return items;
    }, [partes, reminders]);

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
            {/* Header Section (Notion Style) */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-4">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Calendario</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-tight">
                        Gestiona tus actuaciones y partes desde una vista temporal.
                    </p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <button 
                        onClick={prevMonth}
                        className="p-2 rounded-lg hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all active:scale-95"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="px-4 min-w-[140px] text-center">
                        <h2 className="text-sm font-black capitalize text-slate-900 dark:text-white">
                            {format(currentMonth, 'MMMM yyyy', { locale: es })}
                        </h2>
                    </div>
                    <button 
                        onClick={nextMonth}
                        className="p-2 rounded-lg hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all active:scale-95"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-0 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden bg-white dark:bg-black shadow-2xl">
                {/* Calendar Grid - Minimalist Notion Style */}
                <div className="lg:col-span-8 p-1 md:p-4 bg-white dark:bg-black border-r border-slate-200 dark:border-white/10">
                    <div className="grid grid-cols-7 border-b border-slate-100 dark:border-white/5">
                        {weekDays.map(day => (
                            <div key={day} className="text-center py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-[1px] bg-slate-100 dark:bg-white/10">
                        {calendarDays.map((day, idx) => {
                            const dayItems = calendarData.filter(item => isSameDay(item.date, day));
                            const dayPartes = dayItems.filter(i => i.type === 'PARTE');
                            
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isSelected = isSameDay(day, selectedDate);
                            const isTodayDay = isToday(day);

                            return (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedDate(day)}
                                    className={clsx(
                                        "relative h-32 md:h-44 p-2 transition-all duration-300 flex flex-col items-start justify-start group cursor-pointer",
                                        !isCurrentMonth ? "bg-slate-50/50 dark:bg-white/[0.02]" : "bg-white dark:bg-black",
                                        isSelected && "bg-blue-50/50 dark:bg-blue-500/[0.05]"
                                    )}
                                >
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 z-20">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedDate(day);
                                                setIsReminderModalOpen(true);
                                            }}
                                            className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-500/20 text-orange-600 hover:bg-orange-200 transition-all shadow-sm"
                                            title="Nuevo Recordatorio"
                                        >
                                            <Bell className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/new?date=${format(day, 'yyyy-MM-dd')}`);
                                            }}
                                            className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg"
                                            title="Nuevo Parte"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <div className="w-full flex justify-between items-start mb-2 relative z-10">
                                        <span className={clsx(
                                            "text-xs font-black w-7 h-7 flex items-center justify-center rounded-lg transition-all",
                                            isTodayDay ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : 
                                            isSelected ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" : "text-slate-700 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>

                                    {/* Partes as Text Pills */}
                                    <div className="flex flex-col gap-1 w-full overflow-hidden">
                                        {dayPartes.slice(0, 3).map((p, i) => (
                                            <div 
                                                key={i} 
                                                className={clsx(
                                                    "px-2 py-1 rounded-md text-[9px] font-bold truncate border shadow-sm transition-transform hover:scale-[1.02]",
                                                    p.status === 'ABIERTO' ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-100 dark:border-green-500/20' : 
                                                    p.status === 'EN TRÁMITE' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20' : 
                                                    'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-white/10'
                                                )}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/parte/${p.parteId}`);
                                                }}
                                            >
                                                {p.title}
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Reminders Indicators (Dots) */}
                                    <div className="flex gap-1 mt-auto">
                                        {dayItems.filter(i => i.type === 'REMINDER').map((r, i) => (
                                            <div key={i} className={clsx("w-1.5 h-1.5 rounded-full", r.completed ? "bg-slate-300 dark:bg-slate-600" : "bg-orange-500")} />
                                        ))}
                                    </div>

                                    {isSelected && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Day Details Sidebar - Refined Agenda Style */}
                <div className="lg:col-span-4 bg-slate-50/50 dark:bg-white/[0.02] flex flex-col h-full max-h-[800px]">
                    <div className="p-8 border-b border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 mb-2">
                             <Clock className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Planificación Diaria</span>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white capitalize leading-tight">
                            {format(selectedDate, "EEEE", { locale: es })}
                            <br />
                            <span className="text-slate-400 font-light">{format(selectedDate, "d 'de' MMMM", { locale: es })}</span>
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                        {selectedDayItems.length > 0 ? (
                            <div className="space-y-4">
                                {selectedDayItems.map((item, idx) => {
                                    if (item.type === 'PARTE') {
                                        return (
                                            <div 
                                                key={idx} 
                                                className="relative pl-6 border-l-2 border-slate-200 dark:border-white/10 pb-2 group cursor-pointer"
                                                onClick={() => navigate(`/parte/${item.parteId}`)}
                                            >
                                                <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white dark:bg-black border-2 border-indigo-500 z-10 group-hover:scale-125 transition-transform" />
                                                <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm group-hover:shadow-md transition-all group-hover:-translate-y-1">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className={clsx(
                                                            "text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter",
                                                            item.status === 'ABIERTO' ? 'bg-green-100 text-green-700' : 
                                                            item.status === 'EN TRÁMITE' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                                        )}>
                                                            {item.status}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-400">#{item.parteId}</span>
                                                    </div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{item.title}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-3 h-3 text-slate-400" />
                                                        <span className="text-[10px] text-slate-500 font-medium">{item.createdBy}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (item.type === 'REMINDER') {
                                        return (
                                            <div key={idx} className="relative pl-6 border-l-2 border-orange-200 dark:border-orange-500/20 pb-2 group">
                                                 <div className={clsx(
                                                     "absolute left-[-6px] top-1 w-2.5 h-2.5 rounded-full z-10 transition-colors", 
                                                     item.completed ? "bg-slate-300" : "bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                                                 )} />
                                                 <div className={clsx(
                                                     "p-4 rounded-2xl border transition-all",
                                                     item.completed 
                                                        ? "bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5 opacity-60" 
                                                        : "bg-white dark:bg-white/5 border-orange-100 dark:border-orange-500/20 shadow-sm"
                                                 )}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <button 
                                                                onClick={() => updateReminder(item.id, { completed: !item.completed })}
                                                                className={clsx(
                                                                    "p-1 rounded-md transition-colors",
                                                                    item.completed ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" : "text-slate-300 hover:text-emerald-500"
                                                                )}
                                                            >
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </button>
                                                            <span className={clsx("text-xs font-bold", item.completed ? "text-slate-400 line-through" : "text-slate-800 dark:text-white")}>
                                                                {item.text}
                                                            </span>
                                                        </div>
                                                        <button 
                                                            onClick={() => deleteReminder(item.id)}
                                                            className="text-slate-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between mt-2">
                                                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                            <Clock className="w-3 h-3" />
                                                            {format(parseISO(item.dueDate), 'HH:mm')}
                                                        </div>
                                                        {item.parteId && (
                                                            <button 
                                                                onClick={() => navigate(`/parte/${item.parteId}`)}
                                                                className="flex items-center gap-1 text-[9px] font-black text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-md uppercase"
                                                            >
                                                                <Link2 className="w-2.5 h-2.5" /> Ver Parte
                                                            </button>
                                                        )}
                                                    </div>
                                                 </div>
                                            </div>
                                        );
                                    }

                                    const itemType = item.type as ActuacionType;
                                    const config = ACTUACION_CONFIG[itemType];
                                    const Icon = config?.icon || CalendarIcon;
                                    const themeColor = config?.themeColor || 'blue';

                                    return (
                                        <div key={idx} className="relative pl-6 border-l-2 border-slate-200 dark:border-white/10 pb-2 group cursor-pointer" onClick={() => navigate(`/parte/${item.parteId}`)}>
                                             <div className={clsx("absolute left-[-6px] top-1 w-2.5 h-2.5 rounded-full z-10", `bg-${themeColor}-500 shadow-[0_0_8px_rgba(0,0,0,0.2)]`)} />
                                             <div className="bg-white/40 dark:bg-white/5 p-3 rounded-xl border border-dashed border-slate-200 dark:border-white/10 flex items-center gap-3">
                                                <div className={clsx("p-1.5 rounded-lg", `bg-${themeColor}-500/10 text-${themeColor}-600`)}>
                                                    <Icon className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{item.type}</h4>
                                                        <span className="text-[9px] font-black text-slate-400">{item.duration}m</span>
                                                    </div>
                                                </div>
                                             </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                                <div className="p-5 bg-slate-100 dark:bg-white/5 rounded-3xl mb-4 text-slate-300">
                                    <Plus className="w-8 h-8 opacity-20" />
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No hay actividades.</p>
                                <button 
                                    onClick={() => navigate(`/new?date=${format(selectedDate, 'yyyy-MM-dd')}`)}
                                    className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                                >
                                    Agendar Parte
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ReminderModal 
                isOpen={isReminderModalOpen} 
                onClose={() => setIsReminderModalOpen(false)} 
                initialDate={format(selectedDate, 'yyyy-MM-dd')}
            />
        </div>
    );
}

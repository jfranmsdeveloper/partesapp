import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, 
    ChevronRight, 
    Calendar as CalendarIcon, 
    Clock, 
    User,
    Plus,
    Bell,
    Trash2,
    CheckCircle2,
    Link2
} from 'lucide-react';
import { ReminderModal } from '../../components/reminders/ReminderModal';
import {
    CalendarPartePreviewModal,
    CALENDAR_PARTE_DOTS_MAX,
    parteStatusDotTintClass,
    parteTooltipLabel,
} from '../../components/calendar/CalendarPartePreviewModal';
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
import type { ActuacionType, ParteStatus } from '../../types';

export default function CalendarPage() {
    const navigate = useNavigate();
    const { partes, reminders, updateReminder, deleteReminder } = useAppStore();
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [previewParteId, setPreviewParteId] = useState<number | string | null>(null);
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

    const previewParte = useMemo(
        () => (previewParteId != null ? partes.find((p) => p.id === previewParteId) ?? null : null),
        [partes, previewParteId]
    );

    return (
        <div className="flex flex-col h-[calc(100dvh-6.5rem)] min-h-[32rem] max-h-[calc(100dvh-4rem)] gap-4 pb-4 fade-in">
            {/* Header compacto */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div className="space-y-0.5">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Calendario</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Partes, actuaciones y recordatorios por día.
                    </p>
                </div>

                <div className="flex items-center gap-1 bg-white/50 dark:bg-slate-950/30 backdrop-blur-xl p-1 rounded-2xl border border-white/40 dark:border-white/10 shadow-lg shadow-slate-900/5">
                    <button
                        onClick={prevMonth}
                        className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all active:scale-95"
                        type="button"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="px-3 min-w-[9rem] text-center">
                        <h2 className="text-sm font-black capitalize text-slate-900 dark:text-white">
                            {format(currentMonth, 'MMMM yyyy', { locale: es })}
                        </h2>
                    </div>
                    <button
                        onClick={nextMonth}
                        className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all active:scale-95"
                        type="button"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
                {/* Rejilla mensual — panel flotante */}
                <div className="lg:col-span-8 min-h-0 flex flex-col rounded-[2rem] bg-white/45 dark:bg-slate-950/35 backdrop-blur-3xl border border-white/35 dark:border-white/10 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18)] overflow-hidden">
                    <div className="grid grid-cols-7 shrink-0 border-b border-white/30 dark:border-white/5 bg-white/20 dark:bg-white/[0.02]">
                        {weekDays.map(day => (
                            <div key={day} className="text-center py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 min-h-0 p-2 sm:p-3">
                        <div
                            className="grid grid-cols-7 gap-1.5 sm:gap-2 h-full min-h-[18rem]"
                            style={{ gridTemplateRows: `repeat(${Math.ceil(calendarDays.length / 7)}, minmax(0, 1fr))` }}
                        >
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
                                        "relative min-h-0 h-full min-w-0 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl transition-all duration-300 flex flex-col overflow-hidden group cursor-pointer border border-transparent",
                                        !isCurrentMonth ? "bg-slate-100/40 dark:bg-white/[0.02] opacity-70" : "bg-white/50 dark:bg-white/[0.03] hover:bg-white/70 dark:hover:bg-white/[0.06]",
                                        isSelected && "ring-2 ring-blue-400/50 bg-blue-50/60 dark:bg-blue-500/[0.08] border-blue-200/40 dark:border-blue-500/20 shadow-md shadow-blue-500/10"
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

                                    <div className="w-full shrink-0 flex justify-between items-start mb-1 relative z-10">
                                        <span className={clsx(
                                            "text-xs font-black w-7 h-7 flex items-center justify-center rounded-lg transition-all",
                                            isTodayDay ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : 
                                            isSelected ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" : "text-slate-700 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>

                                    {/* Partes: puntos cristal (contenidos en la celda) */}
                                    <div className="w-full min-w-0 flex-1 min-h-0 flex flex-col justify-end overflow-hidden mt-auto">
                                        <div className="flex flex-wrap gap-0.5 sm:gap-1 justify-start items-center w-full max-h-[2.5rem] sm:max-h-[3rem] overflow-hidden content-start px-0.5 pb-0.5 pt-0.5 relative z-10">
                                        {dayPartes.slice(0, CALENDAR_PARTE_DOTS_MAX).map((p) => {
                                            const parte = partes.find((x) => x.id === p.parteId);
                                            const tooltip = parte
                                                ? parteTooltipLabel(parte)
                                                : p.title;
                                            return (
                                                <div key={String(p.parteId)} className="relative group/dot shrink-0">
                                                    <button
                                                        type="button"
                                                        title={tooltip}
                                                        aria-label={tooltip}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPreviewParteId(p.parteId);
                                                        }}
                                                        className={clsx(
                                                            'relative block w-[8px] h-[8px] sm:w-2.5 sm:h-2.5 rounded-full shrink-0 overflow-hidden',
                                                            'border border-white/85 dark:border-white/35',
                                                            'bg-white/25 dark:bg-white/10 backdrop-blur-md',
                                                            'shadow-[0_2px_8px_rgba(15,23,42,0.09),inset_0_1px_1px_rgba(255,255,255,0.9)]',
                                                            'dark:shadow-[0_2px_10px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]',
                                                            'transition-all duration-200 ease-out',
                                                            'hover:-translate-y-px hover:scale-110',
                                                            'hover:shadow-[0_4px_12px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,1)]',
                                                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent'
                                                        )}
                                                    >
                                                        <span
                                                            className={clsx(
                                                                'absolute inset-0 bg-gradient-to-br pointer-events-none',
                                                                parteStatusDotTintClass(p.status as ParteStatus)
                                                            )}
                                                            aria-hidden
                                                        />
                                                        <span
                                                            className="absolute inset-0 bg-gradient-to-b from-white/75 via-white/20 to-transparent pointer-events-none dark:from-white/30 dark:via-white/5"
                                                            aria-hidden
                                                        />
                                                        <span
                                                            className="absolute left-[18%] top-[10%] w-[44%] h-[36%] rounded-full bg-white/80 blur-[0.4px] pointer-events-none dark:bg-white/50"
                                                            aria-hidden
                                                        />
                                                    </button>
                                                    <div
                                                        role="tooltip"
                                                        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/95 text-white text-[10px] font-medium leading-snug max-w-[11rem] text-center opacity-0 group-hover/dot:opacity-100 transition-opacity z-[60] shadow-lg line-clamp-4 hidden sm:block"
                                                    >
                                                        {tooltip}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {dayPartes.length > CALENDAR_PARTE_DOTS_MAX && (
                                            <span
                                                className="text-[8px] sm:text-[9px] font-black text-slate-500 dark:text-slate-400 leading-none shrink-0 tabular-nums"
                                                title={`${dayPartes.length - CALENDAR_PARTE_DOTS_MAX} partes más este día`}
                                            >
                                                +{dayPartes.length - CALENDAR_PARTE_DOTS_MAX}
                                            </span>
                                        )}
                                        {dayItems.filter((i) => i.type === 'REMINDER').map((r, i) => (
                                            <span
                                                key={`rem-${i}`}
                                                className={clsx(
                                                    'relative block w-[7px] h-[7px] sm:w-2 sm:h-2 rounded-full shrink-0 overflow-hidden',
                                                    'border border-white/85 dark:border-white/35 bg-white/25 backdrop-blur-md',
                                                    'shadow-[0_2px_8px_rgba(15,23,42,0.09),inset_0_1px_1px_rgba(255,255,255,0.9)]'
                                                )}
                                                title={r.text}
                                            >
                                                {!r.completed && (
                                                    <>
                                                        <span className="absolute inset-0 bg-gradient-to-br from-orange-400/45 via-orange-300/15 to-orange-500/30 pointer-events-none" />
                                                        <span className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/15 to-transparent pointer-events-none" />
                                                    </>
                                                )}
                                                {r.completed && (
                                                    <span className="absolute inset-0 bg-gradient-to-br from-slate-300/50 to-slate-500/35 pointer-events-none" />
                                                )}
                                                <span className="absolute left-[18%] top-[10%] w-[40%] h-[34%] rounded-full bg-white/75 blur-[0.3px] pointer-events-none" />
                                            </span>
                                        ))}
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-blue-500" />
                                    )}
                                </div>
                            );
                        })}
                        </div>
                    </div>
                </div>

                {/* Agenda del día — panel flotante */}
                <div className="lg:col-span-4 min-h-[16rem] lg:min-h-0 flex flex-col rounded-[2rem] bg-white/45 dark:bg-slate-950/35 backdrop-blur-3xl border border-white/35 dark:border-white/10 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.18)] overflow-hidden">
                    <div className="p-5 sm:p-6 border-b border-white/30 dark:border-white/5 shrink-0 bg-white/15 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                             <Clock className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Agenda</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white capitalize leading-tight">
                            {format(selectedDate, "EEEE", { locale: es })}
                            <span className="text-slate-400 font-light normal-case text-base sm:text-lg block sm:inline sm:ml-2">
                                {format(selectedDate, "d 'de' MMMM", { locale: es })}
                            </span>
                        </h3>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
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
                            <div className="flex flex-col items-center justify-center py-10 text-center h-full min-h-[12rem]">
                                <div className="p-4 bg-white/50 dark:bg-white/5 rounded-2xl mb-3 text-slate-300 border border-white/30 dark:border-white/5">
                                    <Plus className="w-7 h-7 opacity-30" />
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No hay actividades.</p>
                                <button 
                                    onClick={() => navigate(`/new?date=${format(selectedDate, 'yyyy-MM-dd')}`)}
                                    className="mt-3 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                                    type="button"
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

            <CalendarPartePreviewModal
                parte={previewParte}
                onClose={() => setPreviewParteId(null)}
                onOpenParte={(id) => {
                    setPreviewParteId(null);
                    navigate(`/parte/${id}`);
                }}
            />
        </div>
    );
}

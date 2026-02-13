import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, setMonth, setYear, getYear, getMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx } from 'clsx';

interface DatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    label?: string;
    className?: string;
    required?: boolean;
    min?: string;
    max?: string;
    disabled?: boolean;
}

export const DatePicker = ({ value, onChange, label, className, required, disabled }: DatePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync current month when value changes
    useEffect(() => {
        if (value) setCurrentMonth(new Date(value));
    }, [value]);

    // Handle click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const handleDayClick = (day: Date) => {
        onChange(format(day, 'yyyy-MM-dd'));
        setIsOpen(false);
    };

    const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentMonth(setMonth(currentMonth, parseInt(e.target.value)));
    };

    const handleYearSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentMonth(setYear(currentMonth, parseInt(e.target.value)));
    };

    // Generate days
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: es });
    const endDate = endOfWeek(monthEnd, { locale: es });
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const months = Array.from({ length: 12 }, (_, i) => format(new Date(2000, i, 1), 'MMMM', { locale: es }));
    const currentYear = getYear(currentMonth);
    const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

    return (
        <div className={clsx("relative", className, disabled && "opacity-60 pointer-events-none")} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={clsx(
                    "w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-all cursor-pointer bg-white dark:bg-slate-900/50",
                    isOpen
                        ? "border-orange-500 ring-4 ring-orange-500/10"
                        : "border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700"
                )}
            >
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                    <CalendarIcon className={clsx("w-4 h-4", value ? "text-orange-500" : "text-slate-400")} />
                    <span className={clsx(!value && "text-slate-400")}>
                        {value ? format(new Date(value), "d 'de' MMMM, yyyy", { locale: es }) : "Seleccionar fecha"}
                    </span>
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 z-50 mt-2 p-4 w-[320px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button type="button" onClick={prevMonth} className="p-1.5 hover:bg-orange-50 dark:hover:bg-orange-900/30 text-slate-500 hover:text-orange-600 rounded-full transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex gap-1">
                            <select
                                value={getMonth(currentMonth)}
                                onChange={handleMonthSelect}
                                className="bg-transparent font-semibold capitalize text-slate-700 dark:text-slate-200 text-sm hover:text-orange-600 cursor-pointer outline-none appearance-none"
                            >
                                {months.map((m, i) => (
                                    <option key={i} value={i} className="text-slate-900 bg-white">{m}</option>
                                ))}
                            </select>
                            <select
                                value={getYear(currentMonth)}
                                onChange={handleYearSelect}
                                className="bg-transparent font-semibold text-slate-700 dark:text-slate-200 text-sm hover:text-orange-600 cursor-pointer outline-none appearance-none"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y} className="text-slate-900 bg-white">{y}</option>
                                ))}
                            </select>
                        </div>

                        <button type="button" onClick={nextMonth} className="p-1.5 hover:bg-orange-50 dark:hover:bg-orange-900/30 text-slate-500 hover:text-orange-600 rounded-full transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Weekdays */}
                    <div className="grid grid-cols-7 mb-2 text-center">
                        {weekDays.map(d => (
                            <div key={d} className="text-xs font-bold text-slate-400 dark:text-slate-500 h-8 flex items-center justify-center">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, i) => {
                            const isSelected = value ? isSameDay(day, new Date(value)) : false;
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isTodayDate = isToday(day);

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleDayClick(day)}
                                    disabled={!isCurrentMonth}
                                    className={clsx(
                                        "h-9 w-9 rounded-full flex items-center justify-center text-sm transition-all duration-200",
                                        !isCurrentMonth && "text-slate-300 dark:text-slate-700 opacity-0 pointer-events-none",
                                        isSelected
                                            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105 font-bold"
                                            : isTodayDate
                                                ? "text-orange-600 font-bold bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-200 dark:ring-orange-800"
                                                : "text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600"
                                    )}
                                >
                                    {format(day, 'd')}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// @ts-nocheck
import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import 'cally';
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

export const DatePicker = ({ value, onChange, label, className, required, min, max, disabled }: DatePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLElement>(null);

    // Handle click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Handle custom element event listener
    useEffect(() => {
        const calendarElement = calendarRef.current;
        if (!calendarElement || !isOpen) return;

        const handleChange = (e: any) => {
            // Stop propagation to prevent bubbling issues if any
            e.stopPropagation();
            onChange(e.target.value);
            setIsOpen(false);
        };

        calendarElement.addEventListener('change', handleChange);
        return () => {
            calendarElement.removeEventListener('change', handleChange);
        };
    }, [isOpen, onChange]);

    return (
        <div className={clsx("relative", className, disabled && "opacity-60 pointer-events-none")} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-all cursor-pointer bg-white dark:bg-slate-800",
                    isOpen
                        ? "border-blue-500 ring-4 ring-blue-500/10"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                )}
            >
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                    <span className={clsx(!value && "text-slate-400")}>
                        {value ? format(new Date(value), "d 'de' MMMM, yyyy", { locale: es }) : "Seleccionar fecha"}
                    </span>
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 z-50 mt-2 animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 rounded-xl glass-card border border-white/20 shadow-xl bg-white dark:bg-slate-900 ring-1 ring-black/5">
                        {/* @ts-ignore */}
                        <calendar-date
                            ref={calendarRef}
                            value={value}
                            min={min}
                            max={max}
                            locale="es-ES"
                            className="text-slate-700 dark:text-slate-200"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <button slot="previous" type="button" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                </button>
                                <span slot="month" className="font-display font-semibold text-lg capitalize"></span>
                                <button slot="next" type="button" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                </button>
                            </div>

                            <calendar-month></calendar-month>
                        </calendar-date>

                        <style>{`
                    calendar-date {
                        --color-accent: #3b82f6;
                        --color-text-on-accent: #ffffff;
                    }
                    calendar-month::part(button today) { color: #3b82f6; font-weight: bold; }
                    calendar-month::part(button):hover { background-color: rgba(59, 130, 246, 0.1); }
                    calendar-month::part(button selected) { background-color: #3b82f6; color: white; }
                `}</style>
                    </div>
                </div>
            )}
        </div>
    );
};

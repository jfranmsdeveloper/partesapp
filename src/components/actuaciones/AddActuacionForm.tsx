import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useNotesStore } from '../../store/useNotesStore';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import type { ActuacionType } from '../../types';
import { ACTUACION_CONFIG } from '../../utils/actuacionConfig';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { clsx } from 'clsx';
import { NotionEditor } from '../ui/NotionEditor';
import { FileText, Plus, X, Mic, MicOff, Settings2, Sparkles, StickyNote, History } from 'lucide-react';
import { toLocalISOString } from '../../utils/dateUtils';
import { ClientHistory } from './ClientHistory';

interface AddActuacionFormProps {
    onAdd: (actuacion: { type: ActuacionType; duration: number; notes: string; user: string; timestamp?: string; priority?: 'BAJA' | 'MEDIA' | 'ALTA'; tags?: string[] }) => void;
    onCancel: () => void;
    initialData?: { type: ActuacionType; duration: number; notes: string; user: string; timestamp?: string; priority?: 'BAJA' | 'MEDIA' | 'ALTA'; tags?: string[] };
    defaultTimestamp?: string;
    clientId?: string;
}

export const AddActuacionForm = ({ onAdd, onCancel, initialData, defaultTimestamp, clientId }: AddActuacionFormProps) => {
    const { users, currentUser, snippets, updateQuickButtons, partes } = useAppStore();
    const { notes: allQuickNotes, activeNoteIndex } = useNotesStore();
    const activeQuickNote = allQuickNotes[activeNoteIndex]?.content || '';
    const { isListening, interimTranscript, finalSegment, start, stop } = useSpeechRecognition();
    const durationInputRef = useRef<HTMLInputElement>(null);

    const [type, setType] = useState<ActuacionType | null>(initialData?.type || null);
    const [duration, setDuration] = useState<string>(initialData?.duration.toString() || '');
    const [notes, setNotes] = useState(initialData?.notes || '');
    const [priority, setPriority] = useState<'BAJA' | 'MEDIA' | 'ALTA'>(initialData?.priority || 'MEDIA');
    const [tagInput, setTagInput] = useState(initialData?.tags?.join(', ') || '');
    const [user, setUser] = useState<string>(initialData?.user || currentUser?.name || currentUser?.user_metadata?.full_name || '');
    const [isConfiguringQuickButtons, setIsConfiguringQuickButtons] = useState(false);

    const [customTimestamp, setCustomTimestamp] = useState(() => {
        if (initialData?.timestamp) return toLocalISOString(new Date(initialData.timestamp));
        if (defaultTimestamp) return toLocalISOString(new Date(defaultTimestamp));
        return toLocalISOString(new Date());
    });

    // Voice to notes sync - Fixed to avoid progressive duplication
    useEffect(() => {
        if (finalSegment) {
            setNotes((prev: string) => {
                const cleanSegment = finalSegment.trim();
                if (!cleanSegment) return prev;
                // Append to existing HTML if present
                if (prev.endsWith('</p>')) {
                    return prev.replace(/<\/p>$/, ` ${cleanSegment}</p>`);
                }
                return prev + `<p>${cleanSegment}</p>`;
            });
        }
    }, [finalSegment]);

    // Numeric Shortcuts (Idea 5)
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            // Only trigger if no input is focused
            const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '');
            const isEditorFocused = document.activeElement?.getAttribute('role') === 'textbox';
            
            if (isInputFocused || isEditorFocused) return;

            const key = parseInt(e.key);
            if (key >= 1 && key <= 9) {
                const configKeys = Object.keys(ACTUACION_CONFIG) as ActuacionType[];
                const targetType = configKeys[key - 1];
                if (targetType) {
                    setType(targetType);
                    const config = ACTUACION_CONFIG[targetType];
                    setNotes((prev: string) => {
                       if (!prev || prev === '<p></p>') return `<p><strong>${config.label}:</strong> </p>`;
                       return prev;
                    });
                }
            }
        };

        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, []);

    const quickButtons = (currentUser?.quickButtons && currentUser.quickButtons.length > 0) 
        ? currentUser.quickButtons 
        : [
            "Reparación finalizada con éxito.",
            "Pendiente de recibir pieza.",
            "Revisión preventiva sin novedad.",
            "Cliente ausente."
        ];

    const filteredSnippets = useMemo(() => {
        if (!type) return snippets;
        return snippets.filter(s => !s.type || s.type === type);
    }, [snippets, type]);


    useEffect(() => {
        if (initialData) {
            setType(initialData.type);
            setDuration(initialData.duration.toString());
            setNotes(initialData.notes);
            setPriority(initialData.priority || 'MEDIA');
            setTagInput(initialData.tags?.join(', ') || '');
            setUser(initialData.user);
            if (initialData.timestamp) {
                setCustomTimestamp(toLocalISOString(new Date(initialData.timestamp)));
            }
        }
    }, [initialData]);

    // High Speed Interface: Auto-focus duration input on mount
    useEffect(() => {
        // slight delay to let glass effects mount
        const timer = setTimeout(() => {
            durationInputRef.current?.focus();
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!type || !duration) return;

        onAdd({
            type,
            duration: parseInt(duration),
            notes,
            user,
            priority,
            tags: tagInput.split(',').map((t: string) => t.trim()).filter(Boolean),
            timestamp: customTimestamp.replace('T', ' ') + (customTimestamp.includes(':') && customTimestamp.split(':').length === 2 ? ':00' : '')
        });
    };

    const handleFormKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleNotesChange = useCallback((html: string) => {
      setNotes(html);
    }, []);

    return (
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollVelocity = useRef(0);
    const requestRef = useRef<number>();

    const scrollLoop = useCallback(() => {
        if (scrollRef.current && scrollVelocity.current !== 0) {
            scrollRef.current.scrollLeft += scrollVelocity.current;
            requestRef.current = requestAnimationFrame(scrollLoop);
        }
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        const rect = scrollRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const threshold = 120; // Margin in px to start scrolling

        if (x < threshold) {
            // Near left edge - speed depends on proximity
            scrollVelocity.current = -((threshold - x) / 5);
            if (!requestRef.current) requestRef.current = requestAnimationFrame(scrollLoop);
        } else if (x > width - threshold) {
            // Near right edge
            scrollVelocity.current = (x - (width - threshold)) / 5;
            if (!requestRef.current) requestRef.current = requestAnimationFrame(scrollLoop);
        } else {
            scrollVelocity.current = 0;
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
                requestRef.current = undefined;
            }
        }
    };

    const handleMouseLeave = () => {
        scrollVelocity.current = 0;
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = undefined;
        }
    };

    return (
        <div className="rounded-[2.5rem] border border-blue-100 bg-white/40 glass-card p-6 shadow-xl mb-6 relative overflow-hidden transition-all duration-700">
            <div className="flex justify-between items-center mb-6 mt-2">
                <h3 className="text-xl font-display font-black tracking-tight text-slate-800 dark:text-white/90">
                    {initialData ? 'Editar Actuación' : 'Registrar Nueva Actuación'}
                    <span className="ml-3 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full hidden sm:inline-block border border-slate-200 dark:border-white/10">Cmd+Enter para guardar</span>
                </h3>
                <button onClick={onCancel} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-6">
                <div className="relative group/carousel">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Selecciona el tipo</label>
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse delay-75" />
                        </div>
                    </div>
                    
                    {/* Horizontal Scroll with Edge Auto-scroll */}
                    <div className="relative overflow-hidden rounded-[2.2rem]">
                        {/* Indicadores de Scroll (Faders) */}
                        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white/80 dark:from-dark-card/80 via-white/20 dark:via-dark-card/20 to-transparent z-10 pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-500" />
                        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white/80 dark:from-dark-card/80 via-white/20 dark:via-dark-card/20 to-transparent z-10 pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-500" />
                        
                        <div 
                            ref={scrollRef}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth p-4 -m-4 relative"
                        >
                            {(Object.keys(ACTUACION_CONFIG) as ActuacionType[]).map((actionType) => {
                                const isSelected = type === actionType;
                                const config = ACTUACION_CONFIG[actionType];
                                const Icon = config.icon;
                                const theme = config.themeColor;
                                
                                // Map theme color to specific glass classes
                                const glassStyles: Record<string, string> = {
                                    blue: isSelected ? 'bg-blue-500/15 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'hover:border-blue-300/50 hover:bg-blue-50/50',
                                    green: isSelected ? 'bg-green-500/15 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'hover:border-green-300/50 hover:bg-green-50/50',
                                    amber: isSelected ? 'bg-amber-500/15 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'hover:border-amber-300/50 hover:bg-amber-50/50',
                                    indigo: isSelected ? 'bg-indigo-500/15 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'hover:border-indigo-300/50 hover:bg-indigo-50/50',
                                    pink: isSelected ? 'bg-pink-500/15 border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.3)]' : 'hover:border-pink-300/50 hover:bg-pink-50/50',
                                    cyan: isSelected ? 'bg-cyan-500/15 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'hover:border-cyan-300/50 hover:bg-cyan-50/50',
                                    gray: isSelected ? 'bg-gray-500/15 border-gray-500/50 shadow-[0_0_20px_rgba(107,114,128,0.3)]' : 'hover:border-gray-300/50 hover:bg-gray-50/50',
                                    rose: isSelected ? 'bg-rose-500/15 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'hover:border-rose-300/50 hover:bg-rose-50/50',
                                    sky: isSelected ? 'bg-sky-500/15 border-sky-500/50 shadow-[0_0_20px_rgba(14,165,233,0.3)]' : 'hover:border-sky-300/50 hover:bg-sky-50/50',
                                    slate: isSelected ? 'bg-slate-500/15 border-slate-500/50 shadow-[0_0_20px_rgba(100,116,139,0.3)]' : 'hover:border-slate-300/50 hover:bg-slate-50/50',
                                    red: isSelected ? 'bg-red-500/15 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'hover:border-red-300/50 hover:bg-red-50/50',
                                    orange: isSelected ? 'bg-orange-500/15 border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'hover:border-orange-300/50 hover:bg-orange-50/50',
                                    teal: isSelected ? 'bg-teal-500/15 border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.3)]' : 'hover:border-teal-300/50 hover:bg-teal-50/50',
                                };
    
                                const textColor = `text-${theme}-600 dark:text-${theme}-400`;
                                const activeBg = `bg-${theme}-500`;
    
                                return (
                                    <button
                                        key={actionType}
                                        type="button"
                                        onClick={() => {
                                            setType(actionType);
                                            if (!notes || notes === '<p></p>') {
                                                setNotes(`<p><strong>${config.label}:</strong> </p>`);
                                            }
                                        }}
                                        className={clsx(
                                            "group relative flex flex-col items-center justify-center p-4 rounded-[1.8rem] border-2 transition-all duration-500 backdrop-blur-md shrink-0 w-[140px] h-28",
                                            glassStyles[theme] || 'border-slate-100 bg-white/40',
                                            isSelected ? "scale-[1.02] border-opacity-100" : "bg-white/20 border-white/40 hover:scale-[1.01] grayscale-[0.5] hover:grayscale-0 shadow-sm"
                                        )}
                                    >
                                        <div className="absolute top-2 left-2 w-4 h-4 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-[8px] font-black text-slate-400 group-hover:text-blue-500 transition-colors">
                                            {Object.keys(ACTUACION_CONFIG).indexOf(actionType) + 1}
                                        </div>
                                        
                                        <div className={clsx(
                                            "p-3 rounded-2xl transition-all duration-500 mb-2 relative",
                                            isSelected ? "bg-white shadow-xl ring-1 ring-white/50" : "bg-white/40 group-hover:bg-white"
                                        )}>
                                            <Icon className={clsx("w-5 h-5", isSelected ? textColor : "text-slate-400 group-hover:scale-110 transition-transform")} />
                                        </div>
                                        
                                        <span className={clsx(
                                            "text-[9px] font-black uppercase tracking-widest text-center leading-tight relative",
                                            isSelected ? textColor : "text-slate-500"
                                        )}>
                                            {config.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Action Buttons (Configurable) */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 text-slate-500">
                                <Sparkles className="w-4 h-4 text-orange-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Resumen Rápido</span>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setIsConfiguringQuickButtons(!isConfiguringQuickButtons)}
                                className="text-[10px] font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1"
                            >
                                <Settings2 className="w-3 h-3" />
                                {isConfiguringQuickButtons ? 'Cerrar' : 'Configurar'}
                            </button>
                        </div>
                        
                        {isConfiguringQuickButtons ? (
                            <div className="space-y-3 bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                                <p className="text-[10px] text-slate-500 mb-2 font-medium">Define tus 4 botones de acceso rápido:</p>
                                {quickButtons.map((btn, idx) => (
                                    <input 
                                        key={idx}
                                        className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-white/10 rounded-lg focus:border-orange-500 outline-none bg-white dark:bg-black/40"
                                        value={btn}
                                        onChange={(e) => {
                                            const newBtns = [...quickButtons];
                                            newBtns[idx] = e.target.value;
                                            updateQuickButtons(newBtns);
                                        }}
                                        placeholder={`Botón ${idx + 1}`}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {quickButtons.map((btn, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setNotes((prev: string) => prev + (prev && prev !== '<p></p>' ? ' ' : '') + btn)}
                                        className="px-3 py-1.5 rounded-xl bg-orange-50/50 dark:bg-orange-500/5 hover:bg-orange-50 dark:hover:bg-orange-500/10 border border-orange-100/50 dark:border-white/10 text-[10px] font-bold text-orange-800 dark:text-orange-300 transition-all shadow-sm active:scale-95"
                                    >
                                        {btn}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Snippets / Templates Section (Smart Filtered) */}
                    {filteredSnippets.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-2 mb-3 text-slate-500">
                                <FileText className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                    {type ? `Plantillas para ${type}` : 'Otras Plantillas'}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {filteredSnippets.map((snippet: any) => (
                                    <button
                                        key={snippet.id}
                                        type="button"
                                        onClick={() => {
                                            const cleanContent = snippet.content.replace(/\n/g, '<br/>');
                                            setNotes((prev: string) => prev + (prev && prev !== '<p></p>' ? '<br/>' : '') + cleanContent);
                                        }}
                                        className="px-3 py-1.5 rounded-xl bg-blue-50/50 dark:bg-blue-500/5 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-blue-100/50 dark:border-white/10 text-[10px] font-bold text-blue-800 dark:text-blue-300 transition-all shadow-sm flex items-center gap-2"
                                    >
                                        <Plus className="w-3 h-3 text-blue-500" />
                                        {snippet.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="relative">
                        <Input
                            ref={durationInputRef}
                            type="number"
                            label="Duración (minutos)"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            required
                            min="1"
                            placeholder="0"
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <DatePicker
                                label="Fecha"
                                value={customTimestamp.split('T')[0]}
                                onChange={(date) => {
                                    const time = customTimestamp.split('T')[1] || '00:00';
                                    setCustomTimestamp(`${date}T${time}`);
                                }}
                                required
                            />
                        </div>
                        <div className="w-32">
                            <Input
                                type="text"
                                label="Hora"
                                value={customTimestamp.split('T')[1]?.slice(0, 5) || '00:00'}
                                onChange={(e) => {
                                    const date = customTimestamp.split('T')[0];
                                    setCustomTimestamp(`${date}T${e.target.value}`);
                                }}
                                required
                                placeholder="HH:MM"
                            />
                        </div>
                    </div>

                    <div className="w-full">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Realizado por</label>
                        <select
                            value={user}
                            onChange={(e) => setUser(e.target.value)}
                            className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                        >
                            <option value="" disabled>Selecciona un usuario</option>
                            {users.map((u) => {
                                const name = u.user_metadata?.full_name || u.name || u.email;
                                return <option key={u.id} value={name}>{name}</option>
                            })}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3 ml-1">Prioridad</label>
                        <div className="flex gap-2">
                            {(['BAJA', 'MEDIA', 'ALTA'] as const).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPriority(p)}
                                    className={clsx(
                                        "flex-1 py-2 px-3 rounded-xl border text-[10px] font-black transition-all duration-200",
                                        priority === p
                                            ? p === 'ALTA' ? "bg-red-50 border-red-200 text-red-600 ring-1 ring-red-500" :
                                              p === 'MEDIA' ? "bg-orange-50 border-orange-200 text-orange-600 ring-1 ring-orange-500" :
                                              "bg-blue-50 border-blue-200 text-blue-600 ring-1 ring-blue-500"
                                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                                    )}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <Input
                            label="Etiquetas (separadas por coma)"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="ej: presupuesto, reparación, urgente"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-sm font-medium text-slate-700">Descripción detallada</label>
                        <div className="flex gap-2">
                            {activeQuickNote && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const cleanNotes = activeQuickNote.replace(/\n/g, '<br/>');
                                        setNotes((prev: string) => prev + (prev && prev !== '<p></p>' ? '<br/><br/>' : '') + cleanNotes);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 hover:bg-amber-200 transition-all border border-amber-200"
                                    title="Añadir desde Nota Rápida"
                                >
                                    <StickyNote className="w-3 h-3 text-amber-600" />
                                    Importar Nota
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={isListening ? stop : start}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 border",
                                    isListening 
                                        ? "bg-red-500 text-white border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]" 
                                        : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                                )}
                            >
                                {isListening ? (
                                    <>
                                        <MicOff className="w-3 h-3" />
                                        Detener
                                    </>
                                ) : (
                                    <>
                                        <Mic className="w-3 h-3 text-blue-500" />
                                        Voz
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    <NotionEditor
                        initialContent={notes}
                        onChange={handleNotesChange}
                        placeholder={isListening ? "Escuchando..." : "Escribe aquí los detalles o usa el dictado por voz..."}
                    />
                    {isListening && interimTranscript && (
                        <div className="mt-2 p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-[11px] text-blue-600 italic animate-pulse">
                            {interimTranscript}...
                        </div>
                    )}
                </div>

                {/* Premium Client History Section */}
                <ClientHistory clientId={clientId} currentParteId={initialData ? 'editing' : 'new'} />

                {/* Navigation & One-Hand Mode Optimization for Mobile */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100 sm:relative sticky bottom-0 bg-white/80 sm:bg-transparent backdrop-blur-md p-4 -mx-6 sm:mx-0 -mb-6 sm:mb-0 z-50">
                    <Button type="button" variant="ghost" onClick={onCancel} className="w-full sm:w-auto h-12 sm:h-auto order-2 sm:order-1 font-bold">
                        Cancelar
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={!type || !duration} 
                        variant="primary" 
                        className="w-full sm:w-auto h-12 sm:h-auto order-1 sm:order-2 shadow-lg shadow-blue-500/20 font-black text-xs uppercase tracking-widest"
                    >
                        {initialData ? 'Actualizar Actuación' : 'Añadir Actuación'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

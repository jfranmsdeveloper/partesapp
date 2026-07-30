/* UI Version: 12:30 Baseline */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import type { ActuacionType } from '../../types';
import { ACTUACION_CONFIG } from '../../utils/actuacionConfig';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import clsx from 'clsx';
import { NotionEditor } from '../ui/NotionEditor';
import { FileText, Plus, X, Mic, MicOff, Settings2, Sparkles, Clock, ChevronDown, Pencil } from 'lucide-react';
import { toLocalISOString } from '../../utils/dateUtils';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const DURATION_PRESETS = [5, 10, 15, 30, 45, 60, 90, 120];
const LAST_FORM_KEY = 'actuacionFormDefaults';

interface AddActuacionFormProps {
    onAdd: (actuacion: { type: ActuacionType; duration: number; notes: string; user: string; timestamp?: string; priority?: 'BAJA' | 'MEDIA' | 'ALTA'; tags?: string[] }, keepOpen?: boolean) => void;
    onCancel: () => void;
    initialData?: { type: ActuacionType; duration: number; notes: string; user: string; timestamp?: string; priority?: 'BAJA' | 'MEDIA' | 'ALTA'; tags?: string[] };
    defaultTimestamp?: string;
}

function loadLastDefaults(): { type?: ActuacionType; duration?: string } {
    try {
        const raw = localStorage.getItem(LAST_FORM_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveLastDefaults(type: ActuacionType, duration: string) {
    localStorage.setItem(LAST_FORM_KEY, JSON.stringify({ type, duration }));
}

export const AddActuacionForm = ({ onAdd, onCancel, initialData, defaultTimestamp }: AddActuacionFormProps) => {
    const { users, currentUser, snippets, updateQuickButtons, partes } = useAppStore();
    const { isListening, transcript, start, stop } = useSpeechRecognition();
    const durationInputRef = useRef<HTMLInputElement>(null);
    const lastDefaults = useMemo(() => loadLastDefaults(), []);

    const [type, setType] = useState<ActuacionType | null>(initialData?.type || lastDefaults.type || null);
    const [duration, setDuration] = useState<string>(initialData?.duration?.toString() || lastDefaults.duration || '');
    const [notes, setNotes] = useState(initialData?.notes || '');
    const [priority, setPriority] = useState<'BAJA' | 'MEDIA' | 'ALTA'>(initialData?.priority || 'MEDIA');
    const [tags, setTags] = useState<string[]>(initialData?.tags || []);
    const [tagDraft, setTagDraft] = useState('');
    const [user, setUser] = useState<string>(initialData?.user || currentUser?.name || currentUser?.user_metadata?.full_name || '');
    const [isConfiguringQuickButtons, setIsConfiguringQuickButtons] = useState(false);
    const [shouldContinue, setShouldContinue] = useState(false);
    const [showAllTypes, setShowAllTypes] = useState(false);
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const [showDateEditor, setShowDateEditor] = useState(false);

    const [customTimestamp, setCustomTimestamp] = useState(() => {
        if (initialData?.timestamp) return toLocalISOString(new Date(initialData.timestamp));
        if (defaultTimestamp) return toLocalISOString(new Date(defaultTimestamp));
        return toLocalISOString(new Date());
    });

    useEffect(() => {
        if (transcript) {
            setNotes((prev: string) => {
                const cleanTranscript = transcript.trim();
                if (!cleanTranscript) return prev;
                if (prev.endsWith('</p>')) {
                    return prev.replace(/<\/p>$/, ` ${cleanTranscript}</p>`);
                }
                return prev + `<p>${cleanTranscript}</p>`;
            });
        }
    }, [transcript]);

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

    const typeFrequency = useMemo(() => {
        const counts = new Map<ActuacionType, number>();
        partes.forEach(p => {
            p.actuaciones.forEach(a => {
                counts.set(a.type, (counts.get(a.type) || 0) + 1);
            });
        });
        return counts;
    }, [partes]);

    const allTypes = useMemo(() => Object.keys(ACTUACION_CONFIG) as ActuacionType[], []);

    const rankedTypes = useMemo(() => {
        return [...allTypes].sort((a, b) => (typeFrequency.get(b) || 0) - (typeFrequency.get(a) || 0));
    }, [allTypes, typeFrequency]);

    const visibleTypes = showAllTypes ? rankedTypes : rankedTypes.slice(0, 5);

    const suggestedTags = useMemo(() => {
        const counts = new Map<string, number>();
        partes.forEach(p => {
            p.actuaciones.forEach(a => {
                (a.tags || []).forEach(t => {
                    const key = t.trim();
                    if (!key) return;
                    counts.set(key, (counts.get(key) || 0) + 1);
                });
            });
        });
        return [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([t]) => t)
            .filter(t => !tags.some(x => x.toLowerCase() === t.toLowerCase()))
            .slice(0, 8);
    }, [partes, tags]);

    useEffect(() => {
        if (initialData) {
            setType(initialData.type);
            setDuration(initialData.duration.toString());
            setNotes(initialData.notes);
            setPriority(initialData.priority || 'MEDIA');
            setTags(initialData.tags || []);
            setUser(initialData.user);
            if (initialData.timestamp) {
                setCustomTimestamp(toLocalISOString(new Date(initialData.timestamp)));
            }
        }
    }, [initialData]);

    useEffect(() => {
        const timer = setTimeout(() => durationInputRef.current?.focus(), 200);
        return () => clearTimeout(timer);
    }, []);

    // Number keys 1-9 select visible type chips
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
            const idx = parseInt(e.key, 10) - 1;
            if (idx >= 0 && idx < Math.min(9, visibleTypes.length)) {
                e.preventDefault();
                const actionType = visibleTypes[idx];
                setType(actionType);
                setNotes(prev => {
                    if (!prev || prev === '<p></p>') {
                        return `<p><strong>${ACTUACION_CONFIG[actionType].label}:</strong> </p>`;
                    }
                    return prev;
                });
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [visibleTypes]);

    const selectType = (actionType: ActuacionType) => {
        setType(actionType);
        if (!notes || notes === '<p></p>') {
            const config = ACTUACION_CONFIG[actionType];
            setNotes(`<p><strong>${config.label}:</strong> </p>`);
        }
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!type || !duration) return;

        saveLastDefaults(type, duration);

        onAdd({
            type,
            duration: parseInt(duration),
            notes,
            user,
            priority,
            tags,
            timestamp: customTimestamp.replace('T', ' ') + (customTimestamp.includes(':') && customTimestamp.split(':').length === 2 ? ':00' : '')
        }, shouldContinue);

        if (shouldContinue) {
            setDuration('');
            setNotes('');
            setTags([]);
            setTimeout(() => durationInputRef.current?.focus(), 100);
        }
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

    const appendQuickText = (text: string) => {
        setNotes((prev: string) => {
            if (!prev || prev === '<p></p>') return `<p>${text}</p>`;
            if (prev.endsWith('</p>')) return prev.replace(/<\/p>$/, ` ${text}</p>`);
            return prev + ` ${text}`;
        });
    };

    const toggleTag = (tag: string) => {
        setTags(prev =>
            prev.some(t => t.toLowerCase() === tag.toLowerCase())
                ? prev.filter(t => t.toLowerCase() !== tag.toLowerCase())
                : [...prev, tag]
        );
    };

    const commitTagDraft = () => {
        const value = tagDraft.trim();
        if (!value) return;
        toggleTag(value);
        setTagDraft('');
    };

    const timestampLabel = useMemo(() => {
        try {
            const d = parseISO(customTimestamp);
            const time = format(d, 'HH:mm');
            if (isToday(d)) return `Hoy · ${time}`;
            if (isYesterday(d)) return `Ayer · ${time}`;
            return format(d, "d MMM yyyy · HH:mm", { locale: es });
        } catch {
            return customTimestamp;
        }
    }, [customTimestamp]);

    const chipClass = (active: boolean, color = 'orange') =>
        clsx(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-200",
            active
                ? color === 'orange'
                    ? "bg-orange-500/15 border-orange-400/60 text-orange-700 dark:text-orange-300 shadow-sm"
                    : "bg-blue-500/15 border-blue-400/60 text-blue-700 dark:text-blue-300 shadow-sm"
                : "bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-300 hover:text-orange-600"
        );

    return (
        <div className="rounded-[1.75rem] border border-orange-100/80 dark:border-white/10 bg-white/50 dark:bg-dark-card/60 backdrop-blur-md p-4 sm:p-5 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                        {initialData ? 'Editar Actuación' : 'Nueva Actuación'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        Teclas 1–9 eligen tipo · ⌘↵ guarda
                    </p>
                </div>
                <button onClick={onCancel} className="p-2 rounded-full hover:bg-white/50 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-4">
                {/* Type chips */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Tipo</label>
                        {rankedTypes.length > 5 && (
                            <button
                                type="button"
                                onClick={() => setShowAllTypes(v => !v)}
                                className="text-[10px] font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1"
                            >
                                {showAllTypes ? 'Ver menos' : `Ver todos (${rankedTypes.length})`}
                                <ChevronDown className={clsx("w-3.5 h-3.5 transition-transform", showAllTypes && "rotate-180")} />
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {visibleTypes.map((actionType, index) => {
                            const isSelected = type === actionType;
                            const config = ACTUACION_CONFIG[actionType];
                            const Icon = config.icon;
                            return (
                                <button
                                    key={actionType}
                                    type="button"
                                    onClick={() => selectType(actionType)}
                                    className={clsx(
                                        "relative inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full text-[11px] font-bold border transition-all",
                                        isSelected
                                            ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/25 scale-[1.02]"
                                            : "bg-white/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-300 hover:text-orange-600"
                                    )}
                                    title={`${config.label}${index < 9 ? ` (${index + 1})` : ''}`}
                                >
                                    {index < 9 && (
                                        <span className={clsx(
                                            "text-[9px] font-black w-4 h-4 rounded-md flex items-center justify-center",
                                            isSelected ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                                        )}>
                                            {index + 1}
                                        </span>
                                    )}
                                    <Icon className="w-3.5 h-3.5" />
                                    {config.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* LEFT: meta */}
                    <div className="space-y-4">
                        {/* Duration */}
                        <div>
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-orange-400" />
                                Duración
                            </label>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {DURATION_PRESETS.map(mins => (
                                    <button
                                        key={mins}
                                        type="button"
                                        onClick={() => setDuration(String(mins))}
                                        className={chipClass(duration === String(mins))}
                                    >
                                        {mins}′
                                    </button>
                                ))}
                            </div>
                            <Input
                                ref={durationInputRef}
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                required
                                min="1"
                                placeholder="Minutos (otro valor)"
                                className="py-2"
                            />
                        </div>

                        {/* Timestamp summary */}
                        <div>
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2 block">Fecha y hora</label>
                            <button
                                type="button"
                                onClick={() => setShowDateEditor(v => !v)}
                                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-orange-300 transition-colors"
                            >
                                <span>{timestampLabel}</span>
                                <Pencil className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            {showDateEditor && (
                                <div className="mt-2 flex gap-2">
                                    <div className="flex-1">
                                        <DatePicker
                                            value={customTimestamp.split('T')[0]}
                                            onChange={(date) => {
                                                const time = customTimestamp.split('T')[1] || '00:00';
                                                setCustomTimestamp(`${date}T${time}`);
                                            }}
                                        />
                                    </div>
                                    <div className="w-28">
                                        <Input
                                            type="time"
                                            value={customTimestamp.split('T')[1]?.slice(0, 5) || '00:00'}
                                            onChange={(e) => {
                                                const date = customTimestamp.split('T')[0];
                                                setCustomTimestamp(`${date}T${e.target.value}`);
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-1.5 mt-2">
                                <button
                                    type="button"
                                    className={chipClass((() => { try { return isToday(parseISO(customTimestamp)); } catch { return false; } })(), 'blue')}
                                    onClick={() => {
                                        const t = customTimestamp.split('T')[1] || format(new Date(), 'HH:mm');
                                        setCustomTimestamp(`${format(new Date(), 'yyyy-MM-dd')}T${t}`);
                                    }}
                                >
                                    Hoy
                                </button>
                                <button
                                    type="button"
                                    className={chipClass((() => { try { return isYesterday(parseISO(customTimestamp)); } catch { return false; } })(), 'blue')}
                                    onClick={() => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - 1);
                                        const t = customTimestamp.split('T')[1] || format(new Date(), 'HH:mm');
                                        setCustomTimestamp(`${format(d, 'yyyy-MM-dd')}T${t}`);
                                    }}
                                >
                                    Ayer
                                </button>
                            </div>
                        </div>

                        {/* Users as avatars */}
                        <div>
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2 block">Realizado por</label>
                            <div className="flex flex-wrap gap-2">
                                {users.map((u) => {
                                    const name = u.user_metadata?.full_name || u.name || u.email;
                                    const selected = user === name;
                                    return (
                                        <button
                                            key={u.id}
                                            type="button"
                                            onClick={() => setUser(name)}
                                            title={name}
                                            className={clsx(
                                                "flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-all",
                                                selected
                                                    ? "bg-orange-500/15 border-orange-400 text-orange-700 dark:text-orange-300 ring-1 ring-orange-400/40"
                                                    : "bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-600 hover:border-orange-300"
                                            )}
                                        >
                                            {u.avatar_url ? (
                                                <img src={u.avatar_url} alt={name} className="w-7 h-7 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-[10px] font-bold text-orange-700 dark:text-orange-300">
                                                    {name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <span className="text-xs font-bold">{name.split(' ')[0]}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* More options: priority + tags */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setShowMoreOptions(v => !v)}
                                className="text-[11px] font-bold text-slate-400 hover:text-orange-500 flex items-center gap-1"
                            >
                                Más opciones
                                <ChevronDown className={clsx("w-3.5 h-3.5 transition-transform", showMoreOptions && "rotate-180")} />
                            </button>
                            {showMoreOptions && (
                                <div className="mt-3 space-y-3 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 block">Prioridad</label>
                                        <div className="flex gap-1.5">
                                            {(['BAJA', 'MEDIA', 'ALTA'] as const).map((p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setPriority(p)}
                                                    className={clsx(
                                                        "flex-1 py-1.5 rounded-xl border text-[10px] font-black transition-all",
                                                        priority === p
                                                            ? p === 'ALTA' ? "bg-red-50 border-red-300 text-red-600" :
                                                              p === 'MEDIA' ? "bg-orange-50 border-orange-300 text-orange-600" :
                                                              "bg-blue-50 border-blue-300 text-blue-600"
                                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500"
                                                    )}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 block">Etiquetas</label>
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {tags.map(tag => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => toggleTag(tag)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-500 text-white"
                                                >
                                                    {tag}
                                                    <X className="w-3 h-3" />
                                                </button>
                                            ))}
                                            {suggestedTags.map(tag => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => toggleTag(tag)}
                                                    className={chipClass(false)}
                                                >
                                                    + {tag}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                value={tagDraft}
                                                onChange={(e) => setTagDraft(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        commitTagDraft();
                                                    }
                                                }}
                                                placeholder="Nueva etiqueta…"
                                                className="py-1.5"
                                            />
                                            <Button type="button" variant="outline" size="sm" onClick={commitTagDraft}>
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: notes + shortcuts */}
                    <div className="space-y-3 flex flex-col">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Notas</label>
                            <button
                                type="button"
                                onClick={isListening ? stop : start}
                                className={clsx(
                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                                    isListening
                                        ? "bg-red-500 text-white border-red-500 animate-pulse"
                                        : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-500/30"
                                )}
                            >
                                {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                                {isListening ? 'Detener' : 'Voz'}
                            </button>
                        </div>

                        {/* Quick text next to editor */}
                        <div className="rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30 p-2.5 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-slate-500">
                                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Resumen rápido</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsConfiguringQuickButtons(!isConfiguringQuickButtons)}
                                    className="text-[10px] font-bold text-blue-500 flex items-center gap-1"
                                >
                                    <Settings2 className="w-3 h-3" />
                                    {isConfiguringQuickButtons ? 'Listo' : 'Editar'}
                                </button>
                            </div>
                            {isConfiguringQuickButtons ? (
                                <div className="space-y-1.5">
                                    {quickButtons.map((btn, idx) => (
                                        <input
                                            key={idx}
                                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 outline-none focus:border-orange-500"
                                            value={btn}
                                            onChange={(e) => {
                                                const newBtns = [...quickButtons];
                                                newBtns[idx] = e.target.value;
                                                updateQuickButtons(newBtns);
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {quickButtons.map((btn, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => appendQuickText(btn)}
                                            className="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100/60 dark:border-orange-500/20 text-[10px] font-bold text-orange-800 dark:text-orange-400 hover:border-orange-300 transition-all"
                                        >
                                            {btn}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {filteredSnippets.length > 0 && (
                                <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-1.5 mb-1.5 text-slate-500">
                                        <FileText className="w-3 h-3" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Plantillas</span>
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
                                                className="px-2.5 py-1 rounded-lg bg-blue-50/70 dark:bg-blue-900/20 border border-blue-100/60 dark:border-blue-500/20 text-[10px] font-bold text-blue-800 dark:text-blue-400 flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" />
                                                {snippet.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-h-[160px]">
                            <NotionEditor
                                initialContent={notes}
                                onChange={handleNotesChange}
                                placeholder={isListening ? "Escuchando..." : "Detalles de la actuación…"}
                            />
                        </div>
                    </div>
                </div>

                {/* Sticky actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/10 sticky bottom-0 bg-white/90 dark:bg-dark-bg/90 backdrop-blur-md -mx-4 sm:-mx-5 px-4 sm:px-5 py-3 z-10">
                    <label className="relative inline-flex items-center cursor-pointer group mr-auto">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={shouldContinue}
                            onChange={(e) => setShouldContinue(e.target.checked)}
                        />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
                        <span className="ms-2.5 text-xs font-bold text-slate-500 group-hover:text-orange-500 transition-colors">Añadir y seguir</span>
                    </label>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1 sm:flex-none font-bold">
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={!type || !duration}
                            variant="primary"
                            className="flex-1 sm:flex-none shadow-lg shadow-orange-500/20 font-black text-xs uppercase tracking-widest bg-orange-500 hover:bg-orange-600"
                        >
                            {initialData ? 'Actualizar' : 'Añadir Actuación'}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};

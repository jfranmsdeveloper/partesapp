import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { ActuacionType } from '../../types';
import { ACTUACION_CONFIG } from '../../utils/actuacionConfig';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { clsx } from 'clsx';
import { X, Check, Mic, MicOff } from 'lucide-react';
import { toLocalISOString } from '../../utils/dateUtils';

import { NotionEditor } from '../ui/NotionEditor';

import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface AddActuacionFormProps {
    onAdd: (actuacion: { type: ActuacionType; duration: number; notes: string; user: string; timestamp?: string }) => void;
    onCancel: () => void;
    initialData?: { type: ActuacionType; duration: number; notes: string; user: string; timestamp?: string };
    defaultTimestamp?: string;
}

export const AddActuacionForm = ({ onAdd, onCancel, initialData, defaultTimestamp }: AddActuacionFormProps) => {
    const { users, currentUser } = useAppStore();

    const [type, setType] = useState<ActuacionType | null>(initialData?.type || null);
    const [duration, setDuration] = useState<string>(initialData?.duration.toString() || '');
    const [notes, setNotes] = useState(initialData?.notes || '');
    // Default to current user as requested
    const [user, setUser] = useState<string>(initialData?.user || currentUser?.name || currentUser?.user_metadata?.full_name || '');

    // Initialize timestamp. This acts as the visual "Result" time.
    const [customTimestamp, setCustomTimestamp] = useState(() => {
        if (initialData?.timestamp) return toLocalISOString(new Date(initialData.timestamp));
        if (defaultTimestamp) return toLocalISOString(new Date(defaultTimestamp));
        return toLocalISOString(new Date());
    });



    // Voice Dictation
    const { isListening, transcript, startListening, stopListening, resetTranscript, hasRecognitionSupport } = useSpeechRecognition();

    // Append transcript to notes when it changes
    useEffect(() => {
        if (transcript) {
            // Simple accumulation: add space if needed
            setNotes(prev => {
                const cleanTranscript = transcript.trim();
                if (!cleanTranscript) return prev;
                // If it's already HTML (from NotionEditor), we might need to be careful,
                // but BlockNote handles HTML well enough if we just append text.
                // However, for best results we wrap in a paragraph if it looks like HTML.
                if (prev.includes('</p>')) {
                  return prev.replace(/<\/p>$/, ` ${cleanTranscript}</p>`);
                }
                return prev + ' ' + cleanTranscript;
            });
            resetTranscript();
        }
    }, [transcript, resetTranscript]);

    // Sync state if initialData changes while component is mounted
    useEffect(() => {
        if (initialData) {
            setType(initialData.type);
            setDuration(initialData.duration.toString());
            setNotes(initialData.notes);
            setUser(initialData.user);
            if (initialData.timestamp) {
                setCustomTimestamp(toLocalISOString(new Date(initialData.timestamp)));
            }
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!type || !duration) return;

        onAdd({
            type,
            duration: parseInt(duration),
            notes,
            user,
            // Send local time string formatted for MySQL (YYYY-MM-DD HH:MM:SS)
            timestamp: customTimestamp.replace('T', ' ') + (customTimestamp.includes(':') && customTimestamp.split(':').length === 2 ? ':00' : '')
        });
    };

    const handleCancel = () => {
        onCancel();
    };

    const handleNotesChange = useCallback((html: string) => {
      setNotes(html);
    }, []);

    return (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-6 shadow-sm mb-6 relative overflow-hidden transition-all duration-300">
            <div className="flex justify-between items-center mb-6 mt-2">
                <h3 className="text-lg font-semibold text-slate-800">
                    {initialData ? 'Editar Actuación' : 'Registrar Nueva Actuación'}
                </h3>
                <button onClick={handleCancel} className="p-2 rounded-full hover:bg-white/50 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3 ml-1">Selecciona el tipo</label>
                    <div className="flex flex-wrap gap-3">
                        {(Object.keys(ACTUACION_CONFIG) as ActuacionType[]).map((t) => {
                            const config = ACTUACION_CONFIG[t];
                            const Icon = config.icon;
                            const isSelected = type === t;
                            return (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={clsx(
                                        'relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 text-xs font-medium gap-2 w-24 h-24 group',
                                        isSelected
                                            ? 'border-blue-500 bg-white shadow-md shadow-blue-500/10 text-blue-700 ring-1 ring-blue-500 z-10'
                                            : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md text-slate-600'
                                    )}
                                >
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 text-blue-500">
                                            <Check className="w-3 h-3" />
                                        </div>
                                    )}
                                    <Icon className={clsx("w-6 h-6 transition-transform group-hover:scale-110 duration-200", config.color)} />
                                    <span className="text-center leading-tight line-clamp-2">{config.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input
                        type="number"
                        label="Duración (minutos)"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        required
                        min="1"
                        placeholder="0"
                        className="bg-white dark:bg-slate-800"
                    />

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <DatePicker
                                label="Fecha"
                                value={customTimestamp.split('T')[0]}
                                onChange={(date) => {
                                    const time = customTimestamp.split('T')[1] || '00:00';
                                    const newTs = `${date}T${time}`;
                                    setCustomTimestamp(newTs);
                                }}
                                required
                                className="bg-white dark:bg-slate-800"
                            />
                        </div>
                        <div className="w-32">
                            <Input
                                type="text"
                                label="Hora"
                                value={customTimestamp.split('T')[1]?.slice(0, 5) || '00:00'}
                                onChange={(e) => {
                                    const date = customTimestamp.split('T')[0];
                                    const newTs = `${date}T${e.target.value}`;
                                    setCustomTimestamp(newTs);
                                }}
                                onBlur={(e) => {
                                    let val = e.target.value.replace(/[^0-9]/g, '');
                                    if (val.length === 3) val = '0' + val;

                                    if (val.length === 4) {
                                        const hours = parseInt(val.substring(0, 2));
                                        const mins = parseInt(val.substring(2, 4));

                                        if (hours >= 0 && hours < 24 && mins >= 0 && mins < 60) {
                                            const formattedTime = `${val.substring(0, 2)}:${val.substring(2, 4)}`;
                                            const date = customTimestamp.split('T')[0];
                                            const newTs = `${date}T${formattedTime}`;

                                            setCustomTimestamp(newTs);
                                        }
                                    }
                                }}
                                required
                                className="bg-white dark:bg-slate-800"
                                placeholder="HH:MM"
                            />
                        </div>
                    </div>

                    <div className="w-full">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Realizado por</label>
                        <div className="relative">
                            <select
                                value={user}
                                onChange={(e) => setUser(e.target.value)}
                                className="block w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                            >
                                <option value="" disabled>Selecciona un usuario</option>
                                {users.length > 0 ? (
                                    users.map((u) => {
                                        const name = u.user_metadata?.full_name || u.name || u.email;
                                        return <option key={u.id} value={name}>{name}</option>
                                    })
                                ) : (
                                    <option value="" disabled>Cargando usuarios...</option>
                                )}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between items-end mb-1.5">
                        <label className="text-sm font-medium text-slate-700 ml-1">Descripción de la Actuación</label>

                        {hasRecognitionSupport && (
                            <button
                                type="button"
                                onClick={isListening ? stopListening : startListening}
                                className={clsx(
                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-300",
                                    isListening
                                        ? "bg-red-50 text-red-600 ring-1 ring-red-200 animate-pulse"
                                        : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                )}
                            >
                                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                {isListening ? "Detener Dictado" : "Dictar voz"}
                            </button>
                        )}
                    </div>

                    <div className="transition-all group relative">
                        <NotionEditor
                          initialContent={notes}
                          onChange={handleNotesChange}
                          placeholder={isListening ? "Escuchando... habla ahora." : "Describe los detalles de la actuación..."}
                        />
                        {isListening && (
                            <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-ping pointer-events-none z-20" />
                        )}
                    </div>
                    {isListening && <p className="text-xs text-slate-500 px-1 animate-pulse">Grabando... (El texto aparecerá al terminar la frase)</p>}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={handleCancel}>Cancelar</Button>
                    <Button type="submit" disabled={!type || !duration} variant="primary">
                        {initialData ? 'Actualizar Actuación' : 'Guardar Actuación'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

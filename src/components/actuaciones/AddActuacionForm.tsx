import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { ActuacionType } from '../../types';
import { ACTUACION_CONFIG } from '../../utils/actuacionConfig';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { clsx } from 'clsx';
import { X, Mic, MicOff, FileText, Plus } from 'lucide-react';
import { toLocalISOString } from '../../utils/dateUtils';
import { NotionEditor } from '../ui/NotionEditor';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

interface AddActuacionFormProps {
    onAdd: (actuacion: { type: ActuacionType; duration: number; notes: string; user: string; timestamp?: string; priority?: 'BAJA' | 'MEDIA' | 'ALTA'; tags?: string[] }) => void;
    onCancel: () => void;
    initialData?: { type: ActuacionType; duration: number; notes: string; user: string; timestamp?: string; priority?: 'BAJA' | 'MEDIA' | 'ALTA'; tags?: string[] };
    defaultTimestamp?: string;
}

export const AddActuacionForm = ({ onAdd, onCancel, initialData, defaultTimestamp }: AddActuacionFormProps) => {
    const { users, currentUser, snippets } = useAppStore();

    const [type, setType] = useState<ActuacionType | null>(initialData?.type || null);
    const [duration, setDuration] = useState<string>(initialData?.duration.toString() || '');
    const [notes, setNotes] = useState(initialData?.notes || '');
    const [priority, setPriority] = useState<'BAJA' | 'MEDIA' | 'ALTA'>(initialData?.priority || 'MEDIA');
    const [tagInput, setTagInput] = useState(initialData?.tags?.join(', ') || '');
    const [user, setUser] = useState<string>(initialData?.user || currentUser?.name || currentUser?.user_metadata?.full_name || '');

    const [customTimestamp, setCustomTimestamp] = useState(() => {
        if (initialData?.timestamp) return toLocalISOString(new Date(initialData.timestamp));
        if (defaultTimestamp) return toLocalISOString(new Date(defaultTimestamp));
        return toLocalISOString(new Date());
    });

    const { isListening, transcript, startListening, stopListening, resetTranscript, hasRecognitionSupport } = useSpeechRecognition();

    useEffect(() => {
        if (transcript) {
            setNotes(prev => {
                const cleanTranscript = transcript.trim();
                if (!cleanTranscript) return prev;
                if (prev.includes('</p>')) {
                  return prev.replace(/<\/p>$/, ` ${cleanTranscript}</p>`);
                }
                return prev + ' ' + cleanTranscript;
            });
            resetTranscript();
        }
    }, [transcript, resetTranscript]);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!type || !duration) return;

        onAdd({
            type,
            duration: parseInt(duration),
            notes,
            user,
            priority,
            tags: tagInput.split(',').map(t => t.trim()).filter(Boolean),
            timestamp: customTimestamp.replace('T', ' ') + (customTimestamp.includes(':') && customTimestamp.split(':').length === 2 ? ':00' : '')
        });
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
                <button onClick={onCancel} className="p-2 rounded-full hover:bg-white/50 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3 ml-1">Selecciona el tipo</label>
                    <div className="flex flex-wrap gap-3">
                        {(Object.keys(ACTUACION_CONFIG) as ActuacionType[]).map((actionType) => {
                            const isSelected = type === actionType;
                            const config = ACTUACION_CONFIG[actionType];
                            const Icon = config.icon;
                            
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
                                        "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 group",
                                        isSelected 
                                            ? `${config.color.split(' ')[0].replace('text-', 'bg-').replace('-600', '-50')} ${config.color.split(' ')[0].replace('text-', 'border-').replace('-600', '-200')} shadow-md scale-[1.02]` 
                                            : "bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm"
                                    )}
                                >
                                    <div className={clsx(
                                        "p-3 rounded-xl transition-all duration-300",
                                        isSelected ? "bg-white shadow-sm" : "bg-slate-50 group-hover:bg-white"
                                    )}>
                                        <Icon className={clsx("w-6 h-6", isSelected ? config.color : "text-slate-400 group-hover:text-slate-600")} />
                                    </div>
                                    <span className={clsx(
                                        "text-[10px] font-black uppercase tracking-widest text-center leading-tight",
                                        isSelected ? config.color : "text-slate-500"
                                    )}>
                                        {config.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Snippets / Templates Section */}
                    {snippets.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-2 mb-4 text-slate-500">
                                <FileText className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Mis Plantillas</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {snippets.map(snippet => (
                                    <button
                                        key={snippet.id}
                                        type="button"
                                        onClick={() => {
                                            const cleanContent = snippet.content.replace(/\n/g, '<br/>');
                                            setNotes(prev => prev + (prev && prev !== '<p></p>' ? '<br/>' : '') + cleanContent);
                                        }}
                                        className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-orange-300 text-[11px] font-bold text-slate-600 hover:text-orange-700 transition-all shadow-sm flex items-center gap-2"
                                    >
                                        <Plus className="w-3 h-3 text-orange-500" />
                                        {snippet.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
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
                    />

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
                        {hasRecognitionSupport && (
                            <Button
                                type="button"
                                onClick={isListening ? stopListening : startListening}
                                variant={isListening ? 'danger' : 'outline'}
                                size="sm"
                                className={clsx("rounded-full h-8", isListening && "animate-pulse")}
                            >
                                {isListening ? <MicOff className="w-3.5 h-3.5 mr-2" /> : <Mic className="w-3.5 h-3.5 mr-2 text-blue-500" />}
                                {isListening ? "Detener" : "Dictar"}
                            </Button>
                        )}
                    </div>
                    <NotionEditor
                        initialContent={notes}
                        onChange={handleNotesChange}
                        placeholder="Escribe aquí los detalles..."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit" disabled={!type || !duration} variant="primary">
                        {initialData ? 'Actualizar Actuación' : 'Añadir Actuación'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

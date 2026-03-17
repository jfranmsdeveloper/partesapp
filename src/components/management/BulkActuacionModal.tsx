import { useState, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { ACTUACION_CONFIG } from '../../utils/actuacionConfig';
import type { ActuacionType } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { NotionEditor } from '../ui/NotionEditor';
import { X, Layers, Clock, User, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';

interface BulkActuacionModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedIds: (number | string)[];
}

export const BulkActuacionModal = ({ isOpen, onClose, selectedIds }: BulkActuacionModalProps) => {
    const { bulkAddActuacion, users, currentUser } = useAppStore();
    
    // Form State
    const [type, setType] = useState<ActuacionType | null>(null);
    const [duration, setDuration] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [user, setUser] = useState<string>(currentUser?.name || currentUser?.user_metadata?.full_name || '');
    const [shouldClose, setShouldClose] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleNotesChange = useCallback((html: string) => {
        setNotes(html);
    }, []);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!type || !duration || selectedIds.length === 0) return;

        setIsSaving(true);
        try {
            await bulkAddActuacion(selectedIds, {
                type,
                duration: parseInt(duration),
                notes,
                user,
                priority: 'MEDIA', // Default for bulk
                tags: []
            }, { shouldClose });
            onClose();
            // Reset form
            setType(null);
            setDuration('');
            setNotes('');
            setShouldClose(false);
        } catch (error) {
            console.error('Bulk add error:', error);
            alert('Error al realizar la operación masiva');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/20">
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl text-white shadow-xl shadow-orange-500/30">
                            <Layers className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                Añadir Actuación Masiva
                            </h3>
                            <p className="text-sm text-slate-500 font-bold flex items-center gap-2 mt-1 uppercase tracking-wider">
                                <span className="bg-orange-100 text-orange-600 px-2.5 py-0.5 rounded-full text-xs">
                                    {selectedIds.length} Partes
                                </span>
                                Selección actual preparada para proceso
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-all hover:rotate-90 duration-300"
                    >
                        <X className="w-8 h-8" />
                    </button>
                </div>

                {/* Form Body */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    {isSaving ? (
                        <div className="py-32 flex flex-col items-center justify-center gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 border-8 border-orange-100 rounded-full" />
                                <div className="w-24 h-24 border-8 border-orange-500 border-t-transparent rounded-full animate-spin absolute top-0" />
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-widest">Sincronizando registros...</p>
                                <p className="text-slate-500 font-medium italic">Actualizando bases de datos y recalculando tiempos...</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-12">
                            {/* 1. Type Selection */}
                            <section>
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-500 font-black">1</div>
                                    <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Selecciona el tipo de actividad</h4>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {(Object.keys(ACTUACION_CONFIG) as ActuacionType[]).map((actionType) => {
                                        const isSelected = type === actionType;
                                        const config = ACTUACION_CONFIG[actionType];
                                        const Icon = config.icon;
                                        const theme = config.themeColor;

                                        return (
                                            <button
                                                key={actionType}
                                                type="button"
                                                onClick={() => setType(actionType)}
                                                className={clsx(
                                                    "group relative flex flex-col items-center justify-center p-5 rounded-[2rem] border-2 transition-all duration-500 backdrop-blur-md overflow-hidden h-32",
                                                    isSelected 
                                                        ? `bg-${theme}-500/10 border-${theme}-500/50 shadow-[0_0_20px_rgba(0,0,0,0.1)]` 
                                                        : "bg-white/40 border-slate-100 hover:border-orange-300 hover:bg-orange-50/10 grayscale-[0.5] hover:grayscale-0"
                                                )}
                                            >
                                                <div className={clsx(
                                                    "p-3.5 rounded-2xl transition-all duration-500 mb-2",
                                                    isSelected ? "bg-white shadow-lg" : "bg-slate-100 group-hover:bg-white"
                                                )}>
                                                    <Icon className={clsx("w-6 h-6", isSelected ? `text-${theme}-600` : "text-slate-400")} />
                                                </div>
                                                <span className={clsx(
                                                    "text-[10px] font-black uppercase tracking-widest text-center leading-tight",
                                                    isSelected ? `text-${theme}-700` : "text-slate-500"
                                                )}>
                                                    {config.label}
                                                </span>
                                                {isSelected && (
                                                    <div className={`absolute top-4 right-4 w-2 h-2 rounded-full bg-${theme}-500 animate-pulse`} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* 2. Metrics & Details */}
                            <section className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 bg-orange-50 dark:bg-orange-900/30 rounded-lg flex items-center justify-center text-orange-500 font-black">2</div>
                                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Tiempo y Usuario</h4>
                                    </div>
                                    
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl space-y-6 border border-slate-100 dark:border-slate-800 shadow-inner">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Clock className="w-3 h-3" /> Duración Total
                                            </label>
                                            <Input
                                                type="number"
                                                value={duration}
                                                onChange={(e) => setDuration(e.target.value)}
                                                required
                                                min="1"
                                                placeholder="Minutos por cada parte"
                                                className="bg-white dark:bg-slate-900 border-0 shadow-sm"
                                            />
                                            <p className="text-[10px] text-slate-400 px-2 italic font-medium">Se sumarán {duration || '0'} min a cada {selectedIds.length} partes ({duration ? parseInt(duration) * selectedIds.length : 0} min totales)</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <User className="w-3 h-3" /> Técnico Responsable
                                            </label>
                                            <select
                                                value={user}
                                                onChange={(e) => setUser(e.target.value)}
                                                className="block w-full rounded-2xl border-0 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white shadow-sm focus:ring-4 focus:ring-orange-500/10 transition-all font-semibold"
                                            >
                                                {users.map((u) => {
                                                    const name = u.user_metadata?.full_name || u.name || u.email;
                                                    return <option key={u.id} value={name}>{name}</option>
                                                })}
                                            </select>
                                        </div>

                                        <div className="space-y-2 p-4 bg-orange-100/50 dark:bg-orange-950/20 rounded-2xl border border-orange-200/50">
                                            <label className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center gap-2">
                                                <Layers className="w-3 h-3" /> Fecha Auto-calculada
                                            </label>
                                            <p className="text-[10px] text-orange-700/80 dark:text-orange-300/60 leading-relaxed font-medium">
                                                Esta actuación se registrará automáticamente <strong>al finalizar</strong> el tiempo actual de cada parte (Fecha PDF + duración acumulada).
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-500 font-black">3</div>
                                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">Descripción Detallada</h4>
                                    </div>
                                    
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-inner min-h-[300px] flex flex-col">
                                        <div className="flex items-center gap-2 mb-4 text-slate-400">
                                            <MessageSquare className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Contenido de la actuación</span>
                                        </div>
                                        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                                            <NotionEditor
                                                initialContent={notes}
                                                onChange={handleNotesChange}
                                                placeholder="Describe lo realizado en estos partes..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Footer Actions */}
                            <div className="flex justify-end items-center gap-6 pt-8 border-t border-slate-100 dark:border-slate-800 mt-12">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative">
                                        <input 
                                            type="checkbox" 
                                            checked={shouldClose}
                                            onChange={(e) => setShouldClose(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
                                    </div>
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-orange-500 transition-colors">
                                        Cerrar partes al finalizar
                                    </span>
                                </label>

                                <div className="flex gap-4">
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        onClick={onClose}
                                        className="px-8 py-3 font-bold text-slate-500"
                                    >
                                        Cancelar selección
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={!type || !duration} 
                                        variant="primary"
                                        className="px-12 py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 font-black text-lg shadow-2xl shadow-orange-500/20 disabled:grayscale disabled:opacity-50"
                                    >
                                        <Layers className="w-5 h-5 mr-3" />
                                        {shouldClose ? 'Añadir y Cerrar' : 'Añadir Actuaciones'} ({selectedIds.length})
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

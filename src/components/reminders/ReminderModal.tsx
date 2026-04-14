import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Bell, Link2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate?: string; // YYYY-MM-DD
}

export const ReminderModal = ({ isOpen, onClose, initialDate }: ReminderModalProps) => {
    const { partes, addReminder } = useAppStore();
    const [text, setText] = useState('');
    const [date, setDate] = useState(initialDate || format(new Date(), 'yyyy-MM-dd'));
    const [time, setTime] = useState(format(new Date(), 'HH:mm'));
    const [selectedParteId, setSelectedParteId] = useState<string | number>('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (initialDate) setDate(initialDate);
    }, [initialDate]);

    const handleSave = async () => {
        if (!text.trim()) return;
        
        setIsSaving(true);
        try {
            const dueDate = `${date}T${time}:00`;
            await addReminder({
                text,
                dueDate,
                parteId: selectedParteId || undefined
            });
            onClose();
            setText('');
            setSelectedParteId('');
        } catch (error) {
            console.error('Error saving reminder:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-white/10">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-600">
                            <Bell className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white">Nuevo Recordatorio</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-all">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Text Area */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">¿Qué quieres recordar?</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Ej: Llamar a soporte, revisar informe..."
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none resize-none min-h-[100px]"
                        />
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" /> Fecha
                            </label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Hora
                            </label>
                            <Input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"
                            />
                        </div>
                    </div>

                    {/* Link to Parte */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <Link2 className="w-3 h-3" /> Vincular a Parte (Opcional)
                        </label>
                        <select
                            value={selectedParteId}
                            onChange={(e) => setSelectedParteId(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Ninguno</option>
                            {partes.filter(p => p.status !== 'CERRADO').map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.title.length > 40 ? p.title.substring(0, 40) + '...' : p.title}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving || !text.trim()}
                        className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20 px-8"
                    >
                        {isSaving ? 'Guardando...' : 'Crear Recordatorio'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

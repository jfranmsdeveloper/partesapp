import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAppStore } from '../../store/useAppStore';

interface AddClientModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AddClientModal = ({ isOpen, onClose }: AddClientModalProps) => {
    const { addClient } = useAppStore();
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        await addClient({ name: name.trim() }); // userId is not strictly needed for simplified client list
        setIsLoading(false);
        setName('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Nuevo Usuario Atendido
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Nombre Completo
                        </label>
                        <Input
                            placeholder="APELLIDO 1 APELLIDO 2, NOMBRE"
                            value={name}
                            onChange={(e) => setName(e.target.value.toUpperCase())}
                            autoFocus
                            required
                        />
                        <p className="text-xs text-slate-500">
                            Formato recomendado: APELLIDOS, NOMBRE
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isLoading || !name.trim()}
                        >
                            {isLoading ? 'Guardando...' : 'Guardar Usuario'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

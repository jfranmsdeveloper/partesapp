import { useState, useMemo, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from './Button';
import { Plus, Search, User, X } from 'lucide-react';
import clsx from 'clsx';

interface ClientSelectProps {
    value?: string; // Client ID
    onChange: (clientId: string) => void;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
}

export function ClientSelect({ value, onChange, label, placeholder = "Buscar o crear usuario...", disabled }: ClientSelectProps) {
    const { clients, addClient } = useAppStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get selected client object if value exists
    const selectedClient = useMemo(() =>
        clients.find(c => c.id === value),
        [clients, value]);

    // Filter clients based on search
    const filteredClients = useMemo(() =>
        clients.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [clients, searchTerm]);

    // Handle clicking outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsCreating(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (clientId: string) => {
        onChange(clientId);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleCreateClient = async () => {
        if (!searchTerm.trim()) return;

        setIsCreating(true);
        try {
            // We need addClient to return the ID or finding it after adding
            // Since addClient is void and fetches data mostly async, 
            // we have to wait for the fetch and filter by name to find the new one.
            // A better way would be updating the store action to return the new record, 
            // but for now let's rely on the name.

            await addClient({ name: searchTerm });

            // Wait a brief moment or optimistically find?
            // Since addClient calls fetchData, the state should update.
            // Ideally we'd optimize the store action properly. For now we try to find it in the updated state.
            // But we can't await the state update easily here without subscription.

            // Hacky workaround: find by name in the *next* render or assume success.
            // Wait, we can't reliably get the ID without backend return.
            // Let's assume the user selects it after creation or we just close.
            // Optimistic approach: The user will appear in the list.

            setSearchTerm('');
            setIsCreating(false);
            setIsOpen(false);

            // Note: Auto-selecting the new client is tricky without store support to return the ID.
            // We will let the user search/select it (it will be at the top if sorted or matched).
        } catch (error) {
            console.error(error);
            setIsCreating(false);
        }
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                    {label}
                </label>
            )}

            {!isOpen && selectedClient && !disabled ? (
                <div
                    onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
                    className="flex items-center justify-between w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-orange-500 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400">
                            <User className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{selectedClient.name}</span>
                    </div>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onChange(''); }}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
                        onFocus={() => setIsOpen(true)}
                        placeholder={selectedClient ? selectedClient.name : placeholder}
                        disabled={disabled}
                        className={clsx(
                            "w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border rounded-xl outline-none transition-all",
                            isOpen
                                ? "border-orange-500 ring-4 ring-orange-500/10 rounded-b-none"
                                : "border-slate-200 dark:border-slate-700 focus:border-orange-500"
                        )}
                    />
                </div>
            )}

            {/* Dropdown Results */}
            {isOpen && !disabled && (
                <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-x border-b border-orange-500/30 rounded-b-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                    {filteredClients.length > 0 ? (
                        filteredClients.map(client => (
                            <div
                                key={client.id}
                                onClick={() => handleSelect(client.id)}
                                className="px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer flex items-center gap-3 border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                            >
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-xs font-bold">
                                    {client.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-slate-700 dark:text-slate-300 font-medium">{client.name}</span>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center">
                            <p className="text-sm text-slate-500 mb-3">No se encontraron resultados.</p>
                            {searchTerm && (
                                <Button
                                    type="button"
                                    size="sm"
                                    className="w-full bg-orange-100 text-orange-700 hover:bg-orange-200 border-0"
                                    onClick={handleCreateClient}
                                    disabled={isCreating}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    {isCreating ? 'Creando...' : `Crear "${searchTerm}"`}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

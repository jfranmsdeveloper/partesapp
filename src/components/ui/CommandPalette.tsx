import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Plus, User, ArrowRight, Clock } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { clsx } from 'clsx';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CommandPalette = ({ isOpen, onClose }: CommandPaletteProps) => {
    const navigate = useNavigate();
    const { partes } = useAppStore();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 10);
        }
    }, [isOpen]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const selected = results[selectedIndex];
                if (selected) handleAction(selected);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, query]);

    // Search Logic
    const results = useMemo(() => {
        if (!query.trim()) {
            // Default Quick Actions when empty
            return [
                { id: 'new-parte', title: 'Nuevo Parte de Trabajo', type: 'action', icon: Plus, action: () => navigate('/new') },
                { id: 'go-management', title: 'Ir a Gestión de Partes', type: 'action', icon: FileText, action: () => navigate('/management') },
                { id: 'go-profile', title: 'Mi Perfil', type: 'action', icon: User, action: () => navigate('/profile') },
            ];
        }

        const term = query.toLowerCase();
        const searchMatches: any[] = [];

        // Search in Partes
        partes.forEach(parte => {
            const matchesTitle = parte.title.toLowerCase().includes(term);
            const matchesClient = parte.clientName?.toLowerCase().includes(term);
            const matchesId = parte.id.toString().includes(term);

            if (matchesTitle || matchesClient || matchesId) {
                searchMatches.push({
                    id: `parte-${parte.id}`,
                    title: parte.title,
                    subtitle: `Parte #${parte.id} • ${parte.clientName || 'Sin Cliente'}`,
                    type: 'parte',
                    icon: FileText,
                    action: () => navigate(`/parte/${parte.id}`),
                    data: parte
                });
            }

            // Search in Actuaciones
            parte.actuaciones.forEach(act => {
                if (act.notes?.toLowerCase().includes(term) || act.type.toLowerCase().includes(term)) {
                    searchMatches.push({
                        id: `act-${act.id}`,
                        title: act.type,
                        subtitle: `En: ${parte.title} • ${act.notes?.substring(0, 50)}...`,
                        type: 'actuacion',
                        icon: Clock,
                        action: () => navigate(`/parte/${parte.id}`),
                        data: act
                    });
                }
            });
        });

        return searchMatches.slice(0, 8); // Limit results
    }, [query, partes, navigate]);

    const handleAction = (item: any) => {
        item.action();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 sm:px-6">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center px-4 py-4 border-b border-slate-100 dark:border-slate-800">
                    <Search className="w-5 h-5 text-slate-400 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Busca partes, actuaciones o acciones rápidas..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-lg"
                    />
                    <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-400">
                        ESC
                    </kbd>
                </div>

                <div className="max-h-[60vh] overflow-y-auto py-2">
                    {results.length > 0 ? (
                        <div className="px-2 space-y-1">
                            {results.map((item, index) => {
                                const Icon = item.icon;
                                const isSelected = index === selectedIndex;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleAction(item)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={clsx(
                                            "w-full flex items-center p-3 rounded-xl gap-4 transition-all text-left group",
                                            isSelected 
                                                ? "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400" 
                                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        <div className={clsx(
                                            "p-2 rounded-lg",
                                            isSelected ? "bg-white dark:bg-slate-800 shadow-sm" : "bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 shadow-none"
                                        )}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm truncate">{item.title}</div>
                                            {item.subtitle && (
                                                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                    {item.subtitle}
                                                </div>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <ArrowRight className="w-4 h-4 opacity-70" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <Search className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                            <p className="text-slate-400 font-medium">No hay resultados para "{query}"</p>
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm flex items-center justify-center min-w-[20px]">↑↓</kbd>
                            Navegar
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                            <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-sm flex items-center justify-center min-w-[20px]">↵</kbd>
                            Seleccionar
                        </div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-300 dark:text-slate-600">
                        PartesApp Global Search
                    </div>
                </div>
            </div>
        </div>
    );
};

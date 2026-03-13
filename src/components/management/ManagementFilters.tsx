import { Search, Plus, Calendar, Filter, X, Clock, Users, BarChart3, List, Layout } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FilterState {
    globalSearch: string;
    startDate: string;
    endDate: string;
    parteId: string;
    creator: string;
    clientId: string;
    status: string;
}

interface ManagementFiltersProps {
    filters: FilterState;
    onFilterChange: (key: keyof FilterState, value: string) => void;
    onClearFilters: () => void;
    view: 'list' | 'kanban' | 'timeline' | 'clients' | 'workload';
    onViewChange: (val: 'list' | 'kanban' | 'timeline' | 'clients' | 'workload') => void;
    onAddClient: () => void;
}

export const ManagementFilters = ({
    filters,
    onFilterChange,
    onClearFilters,
    view,
    onViewChange,
    onAddClient
}: ManagementFiltersProps) => {
    const { clients, users } = useAppStore();
    const [isExpanded, setIsExpanded] = useState(false);

    const creators = Array.from(new Set(users.map(u => u.name || u.email)));

    const activeFiltersCount = Object.entries(filters).filter(([key, val]) => key !== 'globalSearch' && val !== '').length;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 mb-6 space-y-4">
            {/* Top Bar: Search + Toggles */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Búsqueda rápida..."
                        className="pl-10 bg-slate-50 border-transparent focus:bg-white"
                        value={filters.globalSearch}
                        onChange={(e) => onFilterChange('globalSearch', e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`flex items-center gap-2 ${isExpanded || activeFiltersCount > 0 ? 'border-orange-200 bg-orange-50 text-orange-700' : ''}`}
                    >
                        <Filter className="w-4 h-4" />
                        Filtros
                        {activeFiltersCount > 0 && (
                            <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {activeFiltersCount}
                            </span>
                        )}
                    </Button>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => onViewChange('list')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'list'
                                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            <List className="w-3 h-3" />
                            Lista
                        </button>
                        <button
                            onClick={() => onViewChange('kanban')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'kanban'
                                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            <Layout className="w-3 h-3" />
                            Kanban
                        </button>
                        <button
                            onClick={() => onViewChange('timeline')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'timeline'
                                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            <Clock className="w-3 h-3" />
                            Timeline
                        </button>
                        <button
                            onClick={() => onViewChange('clients')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'clients'
                                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            <Users className="w-3 h-3" />
                            Clientes
                        </button>
                        <button
                            onClick={() => onViewChange('workload')}
                            className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'workload'
                                ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            <BarChart3 className="w-3 h-3" />
                            Cargas
                        </button>
                    </div>
                </div>
            </div>

            {/* Advanced Filters Area */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Date Range */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Fecha Desde</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        type="date"
                                        className="pl-9"
                                        value={filters.startDate}
                                        onChange={(e) => onFilterChange('startDate', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Fecha Hasta</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        type="date"
                                        className="pl-9"
                                        value={filters.endDate}
                                        onChange={(e) => onFilterChange('endDate', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* ID & Status */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Nº Parte</label>
                                <Input
                                    placeholder="#12345"
                                    value={filters.parteId}
                                    onChange={(e) => onFilterChange('parteId', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Estado</label>
                                <select
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                                    value={filters.status}
                                    onChange={(e) => onFilterChange('status', e.target.value)}
                                >
                                    <option value="">Todos</option>
                                    <option value="ABIERTO">Abierto</option>
                                    <option value="EN TRÁMITE">En Trámite</option>
                                    <option value="CERRADO">Cerrado</option>
                                </select>
                            </div>

                            {/* Creator */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Creador</label>
                                <select
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                                    value={filters.creator}
                                    onChange={(e) => onFilterChange('creator', e.target.value)}
                                >
                                    <option value="">Todos</option>
                                    {creators.map((c, i) => (
                                        <option key={i} value={c || ''}>{c || 'Desconocido'}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Attended User */}
                            <div className="space-y-1 sm:col-span-2">
                                <label className="text-xs font-semibold text-slate-500 uppercase flex justify-between">
                                    Usuario Atendido
                                    <button onClick={onAddClient} className="text-orange-600 hover:text-orange-700 text-[10px] font-bold flex items-center gap-1">
                                        <Plus className="w-3 h-3" />
                                        NUEVO
                                    </button>
                                </label>
                                <select
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                                    value={filters.clientId}
                                    onChange={(e) => onFilterChange('clientId', e.target.value)}
                                >
                                    <option value="">Todos los usuarios</option>
                                    {clients.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Clear Filters Button */}
                            {activeFiltersCount > 0 && (
                                <div className="sm:col-span-4 flex justify-end mt-2">
                                    <button
                                        onClick={onClearFilters}
                                        className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                        Limpiar filtros
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

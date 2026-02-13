import { useState, useMemo, useEffect } from 'react';
import { useUserStore } from '../../hooks/useUserStore';
import { ParteCard } from '../../components/management/ParteCard';
import { KanbanBoard } from '../../components/management/KanbanBoard';
import { CalendarView } from '../../components/management/CalendarView';
import { ManagementFilters } from '../../components/management/ManagementFilters';
import type { FilterState } from '../../components/management/ManagementFilters';
import { AddClientModal } from '../../components/management/AddClientModal';
import { Button } from '../../components/ui/Button';
import type { Parte } from '../../types';

export default function Management() {
    const { partes, fixLegacyAuthorship, currentUser } = useUserStore();
    const [view, setView] = useState<'list' | 'kanban' | 'calendar'>('list');
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);

    const [filters, setFilters] = useState<FilterState>({
        globalSearch: '',
        startDate: '',
        endDate: '',
        parteId: '',
        creator: '',
        clientId: '',
        status: ''
    });

    const filteredPartes = useMemo(() => {
        return partes.filter((p: Parte) => {
            // Global Search (Title or Creator)
            if (filters.globalSearch) {
                const searchLower = filters.globalSearch.toLowerCase();
                const matchesGlobal =
                    p.title.toLowerCase().includes(searchLower) ||
                    p.createdBy.toLowerCase().includes(searchLower) ||
                    p.id.toString().includes(searchLower);
                if (!matchesGlobal) return false;
            }

            // ID Filter
            if (filters.parteId && !p.id.toString().includes(filters.parteId)) return false;

            // Status Filter
            if (filters.status && p.status !== filters.status) return false;

            // Creator Filter
            if (filters.creator && !p.createdBy.includes(filters.creator)) return false; // Includes for name variations

            // Client/Attended User Filter
            if (filters.clientId && p.clientId !== filters.clientId) return false;

            // Date Range Filter
            if (filters.startDate) {
                const pDate = new Date(p.createdAt).getTime();
                const fDate = new Date(filters.startDate).setHours(0, 0, 0, 0);
                if (pDate < fDate) return false;
            }
            if (filters.endDate) {
                const pDate = new Date(p.createdAt).getTime();
                const fDate = new Date(filters.endDate).setHours(23, 59, 59, 999);
                if (pDate > fDate) return false;
            }

            return true;
        });
    }, [partes, filters]);

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            globalSearch: '',
            startDate: '',
            endDate: '',
            parteId: '',
            creator: '',
            clientId: '',
            status: ''
        });
    };

    // Auto-check for legacy data (Usuario Actual) and prompt to fix
    useEffect(() => {
        if (!currentUser || partes.length === 0) return;

        const checkAndFix = async () => {
            const correctName = currentUser.user_metadata?.full_name || currentUser.name || currentUser.email;
            if (!correctName) return;

            const partesToFix = partes.filter(p => p.createdBy === 'Usuario Actual');

            if (partesToFix.length > 0) {
                // Use a slight delay to ensure UI is ready
                setTimeout(async () => {
                    if (confirm(`⚠️ DETECTADOS PARTES ANTIGUOS SIN NOMBRE DE AUTOR\n\nHemos encontrado ${partesToFix.length} partes asignados a "Usuario Actual".\n\n¿Quieres actualizarlos automáticamente a tu nombre: "${correctName}"?`)) {
                        await fixLegacyAuthorship(correctName);
                        alert(`✅ Se han corregido los partes exitosamente.`);
                    }
                }, 1000);
            }
        };

        checkAndFix();
    }, [partes.length, currentUser]); // Run once when data loads

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    Gestión de Partes
                </h1>
                <div className="flex gap-2">
                    {/* Button removed as per user request to use Sidebar only */}
                </div>
            </div>

            <ManagementFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                view={view}
                onViewChange={setView}
                onAddClient={() => setIsClientModalOpen(true)}
            />

            <div className="flex-1 overflow-auto min-h-0">
                {view === 'list' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                        {filteredPartes.map(parte => (
                            <ParteCard key={parte.id} parte={parte} />
                        ))}
                        {filteredPartes.length === 0 && (
                            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-lg font-medium">No se encontraron partes</p>
                                <p className="text-sm">Prueba a ajustar los filtros de búsqueda</p>
                                <Button
                                    variant="ghost"
                                    className="mt-4 text-orange-600"
                                    onClick={handleClearFilters}
                                >
                                    Limpiar filtros
                                </Button>
                            </div>
                        )}
                    </div>
                ) : view === 'kanban' ? (
                    <KanbanBoard partes={filteredPartes} />
                ) : (
                    <CalendarView partes={filteredPartes} />
                )}
            </div>

            <AddClientModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
            />
        </div>
    );
}

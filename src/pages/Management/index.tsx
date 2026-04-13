import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../hooks/useUserStore';
import { parsePartePDF } from '../../utils/pdfParser';
import { ParteCard } from '../../components/management/ParteCard';
import { KanbanBoard } from '../../components/management/KanbanBoard';
import { TimelineView } from '../../components/management/TimelineView';
import { ClientsView } from '../../components/management/ClientsView';
import { WorkloadView } from '../../components/management/WorkloadView';
import { ManagementFilters } from '../../components/management/ManagementFilters';
import type { FilterState } from '../../components/management/ManagementFilters';
import { AddClientModal } from '../../components/management/AddClientModal';
import { Button } from '../../components/ui/Button';
import type { Parte } from '../../types';
import { Square, CheckSquare, Trash2, X, Plus, FileUp, Loader2, Files, CloudDownload, CloudUpload } from 'lucide-react';
import { BulkActuacionModal } from '../../components/management/BulkActuacionModal';

export default function Management() {
    const navigate = useNavigate();
    const { 
        partes, addParte, fixLegacyAuthorship, currentUser, 
        deletePartes, upsertClientFromPDF, isSingleFileMode, 
        importFiles, exportDatabase 
    } = useUserStore();
    const [view, setView] = useState<'list' | 'kanban' | 'timeline' | 'clients' | 'workload'>('list');
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

    // Bulk Upload State
    const [isBulkUploading, setIsBulkUploading] = useState(false);
    const bulkInputRef = useRef<HTMLInputElement>(null);
    const icloudFilesRef = useRef<HTMLInputElement>(null);
    const [isSyncingFiles, setIsSyncingFiles] = useState(false);

    // Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);

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
            if (filters.globalSearch) {
                const searchLower = filters.globalSearch.toLowerCase();
                const matchesGlobal =
                    p.title.toLowerCase().includes(searchLower) ||
                    p.createdBy.toLowerCase().includes(searchLower) ||
                    p.id.toString().includes(searchLower);
                if (!matchesGlobal) return false;
            }
            if (filters.parteId && !p.id.toString().includes(filters.parteId)) return false;
            if (filters.status && p.status !== filters.status) return false;
            if (filters.creator && !p.createdBy.includes(filters.creator)) return false;
            if (filters.clientId && p.clientId !== filters.clientId) return false;
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

    // Selection Handlers
    const toggleSelection = (id: number | string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBatchDelete = async () => {
        if (selectedIds.length === 0) return;
        if (window.confirm(`¿Estás seguro de que quieres eliminar los ${selectedIds.length} partes seleccionados? Esta acción es irreversible.`)) {
            await deletePartes(selectedIds);
            setSelectedIds([]);
            setIsSelectionMode(false);
            alert('✅ Partes eliminados correctamente');
        }
    };

    // Auto-check for legacy data
    useEffect(() => {
        if (!currentUser || partes.length === 0) return;
        const checkAndFix = async () => {
            const correctName = currentUser.user_metadata?.full_name || currentUser.name || currentUser.email;
            if (!correctName) return;
            const partesToFix = partes.filter(p => p.createdBy === 'Usuario Actual');
            if (partesToFix.length > 0) {
                setTimeout(async () => {
                    if (confirm(`⚠️ DETECTADOS PARTES ANTIGUOS SIN NOMBRE DE AUTOR\n\nHemos encontrado ${partesToFix.length} partes asignados a "Usuario Actual".\n\n¿Quieres actualizarlos automáticamente a tu nombre: "${correctName}"?`)) {
                        await fixLegacyAuthorship(correctName);
                        alert(`✅ Se han corregido los partes exitosamente.`);
                    }
                }, 1000);
            }
        };
        checkAndFix();
    }, [partes.length, currentUser]);

    const handleICloudFilesSync = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsSyncingFiles(true);
        try {
            const { success, total } = await importFiles(files);
            alert(`✅ Sincronización completada: ${success} de ${total} archivos cargados en la caché local.`);
        } catch (err) {
            console.error('Error syncing iCloud files:', err);
            alert('❌ Error al sincronizar archivos de iCloud.');
        } finally {
            setIsSyncingFiles(false);
            if (e.target) e.target.value = '';
        }
    };

    return (
        <div className="space-y-6 pb-24">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    Gestión de Partes
                </h1>
                <div className="flex flex-wrap gap-2">
                    {/* iCloud Sync Controls (Safari/iOS only) */}
                    {isSingleFileMode && (
                        <div className="flex gap-2 mr-2 pr-4 border-r border-slate-200 dark:border-slate-700">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => icloudFilesRef.current?.click()}
                                disabled={isSyncingFiles}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                                {isSyncingFiles ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CloudDownload className="w-4 h-4 mr-2" />}
                                Sincronizar Adjuntos iCloud
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={exportDatabase}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                                <CloudUpload className="w-4 h-4 mr-2" />
                                Guardar cambios en iCloud
                            </Button>
                            <input
                                type="file"
                                webkitdirectory=""
                                directory=""
                                multiple
                                ref={icloudFilesRef}
                                className="hidden"
                                onChange={handleICloudFilesSync}
                            />
                        </div>
                    )}

                    <Button 
                        variant="primary"
                        size="sm"
                        onClick={() => navigate('/new')}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-md border-0"
                    >
                        <FileUp className="w-4 h-4 mr-2" />
                        PDF Individual
                    </Button>
                    <Button 
                        variant="primary"
                        size="sm"
                        onClick={() => bulkInputRef.current?.click()}
                        disabled={isBulkUploading}
                        className="bg-orange-500 hover:bg-orange-600 text-white shadow-md border-0"
                    >
                        {isBulkUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Files className="w-4 h-4 mr-2" />}
                        Carga Masiva PDF
                    </Button>
                    <input
                        type="file"
                        multiple
                        accept=".pdf"
                        ref={bulkInputRef}
                        className="hidden"
                        onChange={handleBulkUpload}
                    />
                    {view === 'list' && (
                        <Button 
                            variant={isSelectionMode ? "primary" : "outline"}
                            size="sm"
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                if (isSelectionMode) setSelectedIds([]);
                            }}
                        >
                            {isSelectionMode ? <CheckSquare className="w-4 h-4 mr-2" /> : <Square className="w-4 h-4 mr-2" />}
                            {isSelectionMode ? 'Cancelar Selección' : 'Seleccionar varios'}
                        </Button>
                    )}
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
                            <ParteCard 
                                key={parte.id} 
                                parte={parte} 
                                isSelectionMode={isSelectionMode}
                                isSelected={selectedIds.includes(parte.id)}
                                onSelect={toggleSelection}
                            />
                        ))}
                        {filteredPartes.length === 0 && (
                            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-lg font-medium">No se encontraron partes</p>
                                <p className="text-sm">Prueba a ajustar los filtros de búsqueda</p>
                                <Button variant="ghost" className="mt-4 text-orange-600" onClick={handleClearFilters}>
                                    Limpiar filtros
                                </Button>
                            </div>
                        )}
                    </div>
                ) : view === 'kanban' ? (
                    <KanbanBoard partes={filteredPartes} />
                ) : view === 'timeline' ? (
                    <TimelineView partes={filteredPartes} />
                ) : view === 'clients' ? (
                    <ClientsView onFilterChange={handleFilterChange} onViewChange={setView} />
                ) : (
                    <WorkloadView partes={filteredPartes} />
                )}
            </div>

            {/* Bulk Actions Floating Bar */}
            {isSelectionMode && selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-slate-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-6 border border-slate-800">
                        <div className="flex items-center gap-2 border-r border-slate-700 pr-6">
                            <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                {selectedIds.length}
                            </span>
                            <span className="text-sm font-medium">seleccionados</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="primary" 
                                size="sm" 
                                className="bg-orange-500 hover:bg-orange-600 border-0"
                                onClick={() => setIsBulkModalOpen(true)}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Añadir Actuación
                            </Button>
                            <Button 
                                variant="danger" 
                                size="sm" 
                                className="bg-red-500 hover:bg-red-600 border-0"
                                onClick={handleBatchDelete}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-slate-400 hover:text-white"
                                onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }}
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <AddClientModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
            />

            <BulkActuacionModal
                isOpen={isBulkModalOpen}
                onClose={() => {
                    setIsBulkModalOpen(false);
                    setIsSelectionMode(false);
                    setSelectedIds([]);
                }}
                selectedIds={selectedIds}
            />
        </div>
    );
}

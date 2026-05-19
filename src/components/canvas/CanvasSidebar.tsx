import { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Plus, Search, FileText, StickyNote, Trash2, ArrowLeft, RefreshCw, Folder } from 'lucide-react';
import clsx from 'clsx';

interface CanvasSidebarProps {
    activeBoardId: string | null;
    setActiveBoardId: (id: string | null) => void;
    onAddNote: () => void;
    onAutoLayout?: () => void;
}

export default function CanvasSidebar({ 
    activeBoardId, 
    setActiveBoardId, 
    onAddNote,
    onAutoLayout 
}: CanvasSidebarProps) {
    const { boards, addBoard, deleteBoard, partes } = useAppStore();
    const [search, setSearch] = useState('');
    const [newBoardName, setNewBoardName] = useState('');
    const [isCreatingBoard, setIsCreatingBoard] = useState(false);

    // List of partes that can be added (dragged) to the canvas
    const filteredPartes = useMemo(() => {
        if (!search) return partes.slice(0, 15); // limit initial list
        const lower = search.toLowerCase();
        return partes.filter(p => 
            p.title.toLowerCase().includes(lower) || 
            p.id.toString().includes(lower)
        ).slice(0, 30);
    }, [partes, search]);

    const handleCreateBoard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBoardName.trim()) return;
        const newId = await addBoard(newBoardName.trim());
        if (newId) {
            setActiveBoardId(newId);
            setNewBoardName('');
            setIsCreatingBoard(false);
        }
    };

    const handleDragStart = (event: React.DragEvent, parteId: string | number) => {
        event.dataTransfer.setData('application/reactflow/type', 'parte');
        event.dataTransfer.setData('application/reactflow/id', String(parteId));
        event.dataTransfer.effectAllowed = 'move';
    };

    const currentBoard = boards.find(b => b.id === activeBoardId);

    return (
        <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full overflow-hidden select-none">
            {/* Header: Boards Selector / Active Board name */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                {activeBoardId ? (
                    <div className="flex items-center justify-between">
                        <button 
                            onClick={() => setActiveBoardId(null)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1 text-xs cursor-pointer font-bold uppercase tracking-wider"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Pizarras
                        </button>
                        <button 
                            onClick={() => {
                                if (window.confirm('¿Seguro que quieres eliminar esta pizarra?')) {
                                    deleteBoard(activeBoardId);
                                    setActiveBoardId(null);
                                }
                            }}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Eliminar pizarra"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Folder className="w-5 h-5 text-indigo-500" />
                        Tus Pizarras
                    </h2>
                )}

                {activeBoardId && currentBoard ? (
                    <h3 className="text-xl font-black text-slate-900 dark:text-white truncate">
                        {currentBoard.name}
                    </h3>
                ) : null}
            </div>

            {/* Main Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
                {!activeBoardId ? (
                    // Boards Listing
                    <div className="space-y-4">
                        {isCreatingBoard ? (
                            <form onSubmit={handleCreateBoard} className="space-y-2">
                                <input 
                                    type="text"
                                    placeholder="Nombre de la pizarra..."
                                    value={newBoardName}
                                    onChange={(e) => setNewBoardName(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:text-white"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button 
                                        type="submit"
                                        className="flex-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                                    >
                                        Crear
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setIsCreatingBoard(false)}
                                        className="flex-1 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsCreatingBoard(true)}
                                className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                Nueva Pizarra
                            </button>
                        )}

                        <div className="space-y-2">
                            {boards.map(b => (
                                <button
                                    key={b.id}
                                    onClick={() => setActiveBoardId(b.id)}
                                    className="w-full text-left p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-blue-300 dark:hover:border-blue-900 transition-all flex flex-col gap-1 cursor-pointer"
                                >
                                    <span className="font-bold text-slate-800 dark:text-slate-100 truncate">{b.name}</span>
                                    <span className="text-[10px] text-slate-400">
                                        {b.nodes.length} nodos • {b.edges.length} conexiones
                                    </span>
                                </button>
                            ))}
                            {boards.length === 0 && !isCreatingBoard && (
                                <div className="text-center py-8 text-slate-400 text-xs">
                                    No tienes pizarras creadas.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // Canvas Tools & Nodes Panel
                    <div className="space-y-6">
                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={onAddNote}
                                className="p-3 border border-slate-200 dark:border-slate-800 hover:border-amber-400 rounded-xl flex flex-col items-center gap-1.5 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                            >
                                <StickyNote className="w-5 h-5 text-amber-500" />
                                <span className="text-[11px] font-bold">Crear Nota</span>
                            </button>
                            {onAutoLayout && (
                                <button
                                    onClick={onAutoLayout}
                                    className="p-3 border border-slate-200 dark:border-slate-800 hover:border-blue-400 rounded-xl flex flex-col items-center gap-1.5 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                                >
                                    <RefreshCw className="w-5 h-5 text-blue-500" />
                                    <span className="text-[11px] font-bold">Alinear</span>
                                </button>
                            )}
                        </div>

                        {/* Node Drag and Drop Box */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Arrastrar Partes al Lienzo
                            </h4>
                            
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text"
                                    placeholder="Buscar partes..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-xs border-0 bg-slate-100 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-950 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:text-white"
                                />
                            </div>

                            {/* Partes List */}
                            <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar pr-1">
                                {filteredPartes.map(p => (
                                    <div
                                        key={p.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, p.id)}
                                        className="p-3 border border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/20 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:border-blue-400 rounded-xl transition-all cursor-grab active:cursor-grabbing flex gap-2.5 items-start group"
                                    >
                                        <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-500 flex-shrink-0 mt-0.5" />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex justify-between items-center gap-2">
                                                <span className="text-[10px] font-black text-slate-400">#{p.id}</span>
                                                <span className={clsx(
                                                    "px-1.5 py-0.2 rounded-full text-[8px] font-bold uppercase",
                                                    p.status === 'ABIERTO' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                                                    p.status === 'EN TRÁMITE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                                                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                                )}>
                                                    {p.status}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-350 truncate mt-1">
                                                {p.title}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {filteredPartes.length === 0 && (
                                    <div className="text-center py-8 text-slate-400 text-xs">
                                        No se encontraron partes.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}

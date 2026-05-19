import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Plus, StickyNote, Trash2, ArrowLeft, RefreshCw, Folder, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import clsx from 'clsx';

interface CanvasSidebarProps {
    activeBoardId: string | null;
    setActiveBoardId: (id: string | null) => void;
    onAddNote: () => void;
    onAutoLayout?: () => void;
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

export default function CanvasSidebar({ 
    activeBoardId, 
    setActiveBoardId, 
    onAddNote,
    onAutoLayout,
    isCollapsed,
    setIsCollapsed
}: CanvasSidebarProps) {
    const { boards, addBoard, deleteBoard } = useAppStore();
    const [newBoardName, setNewBoardName] = useState('');
    const [isCreatingBoard, setIsCreatingBoard] = useState(false);

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

    const currentBoard = boards.find(b => b.id === activeBoardId);

    if (isCollapsed) {
        return (
            <aside className="w-16 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center py-4 gap-6 h-full select-none transition-all duration-300">
                {/* Expand Toggle */}
                <button 
                    onClick={() => setIsCollapsed(false)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Expandir panel"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>

                <div className="w-8 h-[1px] bg-slate-150 dark:bg-slate-800" />

                {/* Quick Actions (only visible when a board is active) */}
                {activeBoardId && (
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onAddNote}
                            className="p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md transition-all hover:scale-110 cursor-pointer"
                            title="Crear Nota"
                        >
                            <StickyNote className="w-5 h-5" />
                        </button>
                        {onAutoLayout && (
                            <button
                                onClick={onAutoLayout}
                                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all hover:scale-110 cursor-pointer"
                                title="Auto-alinear Notas"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Back button or boards icon */}
                {activeBoardId ? (
                    <button 
                        onClick={() => setActiveBoardId(null)}
                        className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-750 transition-colors mt-auto cursor-pointer"
                        title="Ver todas las pizarras"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                ) : (
                    <div className="p-3 text-slate-400 mt-auto" title="Tus Pizarras">
                        <Folder className="w-5 h-5" />
                    </div>
                )}
            </aside>
        );
    }

    return (
        <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full overflow-hidden select-none transition-all duration-300">
            {/* Header: Boards Selector / Active Board name */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    {activeBoardId ? (
                        <button 
                            onClick={() => setActiveBoardId(null)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-750 transition-colors flex items-center gap-1 text-xs cursor-pointer font-bold uppercase tracking-wider"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Pizarras
                        </button>
                    ) : (
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Folder className="w-5 h-5 text-indigo-500" />
                            Mis Pizarras
                        </h2>
                    )}

                    <div className="flex items-center gap-1">
                        {activeBoardId && (
                            <button 
                                onClick={() => {
                                    if (window.confirm('¿Seguro que quieres eliminar esta pizarra?')) {
                                        deleteBoard(activeBoardId);
                                        setActiveBoardId(null);
                                    }
                                }}
                                className="p-1.5 text-slate-450 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                                title="Eliminar pizarra"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <button 
                            onClick={() => setIsCollapsed(true)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-450 hover:text-slate-700 transition-colors cursor-pointer"
                            title="Colapsar panel"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    </div>
                </div>

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
                                        className="flex-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-750 rounded-lg cursor-pointer"
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
                                className="w-full py-3.5 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
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
                                    className="w-full text-left p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 hover:border-blue-300 dark:hover:border-blue-900 transition-all flex flex-col gap-1 cursor-pointer"
                                >
                                    <span className="font-bold text-slate-800 dark:text-slate-100 truncate">{b.name}</span>
                                    <span className="text-[10px] text-slate-400">
                                        {b.nodes.length} notas • {b.edges.length} conexiones
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
                    // Canvas Tools
                    <div className="space-y-4">
                        <button
                            onClick={onAddNote}
                            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2 text-sm font-bold cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva Nota (Post-it)
                        </button>
                        
                        {onAutoLayout && (
                            <button
                                onClick={onAutoLayout}
                                className="w-full py-2.5 border border-slate-200 dark:border-slate-800 hover:border-blue-400 text-slate-750 dark:text-slate-300 rounded-xl hover:bg-blue-50/20 dark:hover:bg-blue-950/10 transition-colors flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
                            >
                                <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                                Organizar / Alinear Notas
                            </button>
                        )}

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="bg-slate-50 dark:bg-slate-800/20 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                                <h4 className="font-bold text-slate-700 dark:text-slate-300">Pizarra de Notas</h4>
                                <p className="leading-relaxed">
                                    Este lienzo está diseñado para guardar tus notas y recordatorios rápidos. Puedes escribir, moverlas libremente y enlazarlas entre sí arrastrando desde los bordes de cada nota.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}

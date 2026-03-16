import { useState } from 'react';
import type { Parte, ParteStatus } from '../../types';
import { ParteCard } from './ParteCard';
import { useUserStore } from '../../hooks/useUserStore';
import { clsx } from 'clsx';

interface KanbanBoardProps {
    partes: Parte[];
}

export const KanbanBoard = ({ partes }: KanbanBoardProps) => {
    const { updateParteStatus } = useUserStore();
    const [draggedId, setDraggedId] = useState<number | string | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const columns = {
        'ABIERTO': partes.filter(p => p.status === 'ABIERTO'),
        'EN TRÁMITE': partes.filter(p => p.status === 'EN TRÁMITE'),
        'CERRADO': partes.filter(p => p.status === 'CERRADO'),
    };

    const handleDragStart = (e: React.DragEvent, id: number | string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
        // Hide ghost image slightly or customize it if needed
        // e.dataTransfer.setDragImage(img, 0, 0);
    };

    const handleDragOver = (e: React.DragEvent, status: string) => {
        e.preventDefault();
        setDragOverColumn(status);
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = (e: React.DragEvent, status: ParteStatus) => {
        e.preventDefault();
        setDragOverColumn(null);
        if (draggedId) {
            updateParteStatus(draggedId, status);
            setDraggedId(null);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-x-auto pb-4">
            {(Object.entries(columns) as [ParteStatus, Parte[]][]).map(([status, items]) => (
                <div
                    key={status}
                    className={clsx(
                        "flex flex-col gap-4 rounded-[2rem] p-4 transition-colors min-h-[200px] bg-slate-50 dark:bg-dark-surface border border-slate-200 dark:border-dark-border",
                        dragOverColumn === status ? "ring-2 ring-orange-400 ring-inset" : ""
                    )}
                    onDragOver={(e) => handleDragOver(e, status)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, status)}
                >
                    <div className="flex items-center justify-between sticky top-0 py-2 z-10">
                        <h3 className={clsx(
                            "font-semibold",
                            status === 'ABIERTO' ? "text-green-700 dark:text-green-400" :
                                status === 'EN TRÁMITE' ? "text-blue-700 dark:text-blue-400" : "text-red-700 dark:text-red-400"
                        )}>{status}</h3>
                        <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs font-medium">
                            {items.length}
                        </span>
                    </div>
                    <div className="space-y-3 flex-1">
                        {items.map(parte => (
                            <div
                                key={parte.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, parte.id)}
                                className={clsx(
                                    "transition-opacity cursor-grab active:cursor-grabbing",
                                    draggedId === parte.id ? "opacity-30" : "opacity-100"
                                )}
                            >
                                <ParteCard parte={parte} />
                            </div>
                        ))}
                        {items.length === 0 && (
                            <div className="h-24 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                                Arrastrar aquí
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

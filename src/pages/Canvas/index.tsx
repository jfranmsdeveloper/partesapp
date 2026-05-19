import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import CanvasSidebar from '../../components/canvas/CanvasSidebar';
import InfiniteCanvas from '../../components/canvas/InfiniteCanvas';

export default function CanvasPage() {
    const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
    const [addNoteTrigger, setAddNoteTrigger] = useState<(() => void) | null>(null);
    const [autoLayoutTrigger, setAutoLayoutTrigger] = useState<(() => void) | null>(null);

    const onAddNoteTriggerRegister = (trigger: () => void) => {
        setAddNoteTrigger(() => trigger);
    };

    const onAutoLayoutTriggerRegister = (trigger: () => void) => {
        setAutoLayoutTrigger(() => trigger);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-display font-medium text-slate-900 dark:text-white tracking-[-0.03em]">
                    Pizarras
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Organiza y conecta tus partes de trabajo de forma visual en un lienzo infinito.
                </p>
            </div>

            <div className="flex h-[680px] w-full rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300">
                <CanvasSidebar 
                    activeBoardId={activeBoardId} 
                    setActiveBoardId={setActiveBoardId} 
                    onAddNote={() => addNoteTrigger?.()}
                    onAutoLayout={() => autoLayoutTrigger?.()}
                />
                
                {activeBoardId ? (
                    <ReactFlowProvider>
                        <InfiniteCanvas 
                            boardId={activeBoardId} 
                            onAddNoteTrigger={onAddNoteTriggerRegister}
                            onAutoLayoutTrigger={onAutoLayoutTriggerRegister}
                        />
                    </ReactFlowProvider>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/40 text-slate-500 p-8 text-center backdrop-blur-sm">
                        <div className="w-16 h-16 rounded-3xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-md">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                            Lienzo Infinito de Trabajo
                        </h3>
                        <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm">
                            Selecciona una pizarra de la lista lateral o crea una nueva para empezar a organizar tus partes visualmente.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

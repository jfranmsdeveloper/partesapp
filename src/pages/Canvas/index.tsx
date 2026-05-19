import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import CanvasSidebar from '../../components/canvas/CanvasSidebar';
import InfiniteCanvas from '../../components/canvas/InfiniteCanvas';

export default function CanvasPage() {
    const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
    const [addNoteTrigger, setAddNoteTrigger] = useState<(() => void) | null>(null);
    const [autoLayoutTrigger, setAutoLayoutTrigger] = useState<(() => void) | null>(null);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const onAddNoteTriggerRegister = (trigger: () => void) => {
        setAddNoteTrigger(() => trigger);
    };

    const onAutoLayoutTriggerRegister = (trigger: () => void) => {
        setAutoLayoutTrigger(() => trigger);
    };

    return (
        <div className="flex h-screen w-full bg-white dark:bg-slate-900 transition-all duration-300">
            <CanvasSidebar 
                activeBoardId={activeBoardId} 
                setActiveBoardId={setActiveBoardId} 
                onAddNote={() => addNoteTrigger?.()}
                onAutoLayout={() => autoLayoutTrigger?.()}
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
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
                    <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-md">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                        Pizarra de Notas y Recordatorios
                    </h3>
                    <p className="text-sm text-slate-450 dark:text-slate-500 max-w-sm">
                        Selecciona una pizarra de la lista lateral o crea una nueva para empezar a organizar tus ideas de forma visual.
                    </p>
                </div>
            )}
        </div>
    );
}

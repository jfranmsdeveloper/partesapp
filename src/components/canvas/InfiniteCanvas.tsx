import { useCallback, useEffect, useState } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    BackgroundVariant,
    useReactFlow,
    Panel,
    type Connection,
    type Edge,
    type Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useAppStore } from '../../store/useAppStore';
import NoteNode from './nodes/NoteNode';
import { Save, HelpCircle } from 'lucide-react';

const NODE_TYPES = {
    note: NoteNode
};

interface InfiniteCanvasProps {
    boardId: string;
    onAddNoteTrigger: (trigger: () => void) => void;
    onAutoLayoutTrigger: (trigger: () => void) => void;
}

export default function InfiniteCanvas({ boardId, onAddNoteTrigger, onAutoLayoutTrigger }: InfiniteCanvasProps) {
    const { boards, updateBoardState } = useAppStore();
    const board = boards.find(b => b.id === boardId);

    const { getViewport } = useReactFlow();

    // Nodes and Edges State
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Load initial board state
    useEffect(() => {
        if (board) {
            setNodes(board.nodes || []);
            setEdges(board.edges || []);
        }
    }, [boardId]); // Only trigger when boardId changes to prevent infinite sync loops

    // Auto-save logic (Debounced)
    useEffect(() => {
        if (!boardId || nodes.length === 0 && edges.length === 0) return;
        
        setIsSaving(true);
        const timer = setTimeout(async () => {
            await updateBoardState(boardId, nodes, edges);
            setIsSaving(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, [nodes, edges, boardId]);

    // Handle Connection
    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } }, eds)),
        [setEdges]
    );

    // Callbacks for Editable NoteNode
    const onNoteChange = useCallback((id: string, text: string) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return { ...node, data: { ...node.data, noteText: text } };
            }
            return node;
        }));
    }, [setNodes]);

    const onNoteTitleChange = useCallback((id: string, title: string) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return { ...node, data: { ...node.data, title } };
            }
            return node;
        }));
    }, [setNodes]);

    const onNoteColorChange = useCallback((id: string, color: string) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return { ...node, data: { ...node.data, color } };
            }
            return node;
        }));
    }, [setNodes]);

    const onDeleteNode = useCallback((id: string) => {
        if (window.confirm('¿Seguro que quieres eliminar esta nota?')) {
            setNodes((nds) => nds.filter((node) => node.id !== id));
            setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
        }
    }, [setNodes, setEdges]);

    // Enrich nodes with handlers on render
    const enrichedNodes = nodes.map(node => {
        if (node.type === 'note') {
            return {
                ...node,
                data: {
                    ...node.data,
                    onChange: onNoteChange,
                    onTitleChange: onNoteTitleChange,
                    onColorChange: onNoteColorChange,
                    onDeleteNode: onDeleteNode
                }
            };
        }
        return node;
    });

    // Add Note Node at center viewport dynamically
    const handleAddNote = useCallback(() => {
        const id = `note-${Date.now()}`;
        const { x, y, zoom } = getViewport();
        
        // Calculate center based on window viewport and current zoom/pan
        const flowX = -x / zoom + (window.innerWidth - 320) / (2 * zoom) - 120;
        const flowY = -y / zoom + window.innerHeight / (2 * zoom) - 80;

        const newNode = {
            id,
            type: 'note' as const,
            position: { x: flowX, y: flowY },
            data: {
                title: 'Nueva Nota',
                noteText: '',
                color: 'yellow'
            }
        };
        setNodes((nds) => nds.concat(newNode));
    }, [setNodes, getViewport]);

    // Auto-layout / Grid alignment helper
    const handleAutoLayout = useCallback(() => {
        setNodes((nds) => {
            let row = 0;
            let col = 0;
            const nodesPerRow = 4;
            const xOffset = 280;
            const yOffset = 220;
            const startX = 100;
            const startY = 100;

            return nds.map((node) => {
                const newPos = {
                    x: startX + col * xOffset,
                    y: startY + row * yOffset
                };
                col++;
                if (col >= nodesPerRow) {
                    col = 0;
                    row++;
                }
                return { ...node, position: newPos };
            });
        });
    }, [setNodes]);

    // Register sidebar triggers
    useEffect(() => {
        onAddNoteTrigger(handleAddNote);
    }, [handleAddNote, onAddNoteTrigger]);

    useEffect(() => {
        onAutoLayoutTrigger(handleAutoLayout);
    }, [handleAutoLayout, onAutoLayoutTrigger]);

    return (
        <div className="flex-1 h-full relative">
            <ReactFlow
                nodes={enrichedNodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={NODE_TYPES}
                fitView
                className="bg-slate-50 dark:bg-slate-950"
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                <Controls className="!bg-white dark:!bg-slate-900 !border-slate-200 dark:!border-slate-800" />
                
                {/* Floating Indicator Panels */}
                <Panel position="top-right" className="flex items-center gap-2 pointer-events-none">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2 text-xs font-medium text-slate-505 dark:text-slate-400">
                        {isSaving ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                <span>Guardando...</span>
                            </>
                        ) : (
                            <>
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>Guardado</span>
                            </>
                        )}
                    </div>
                </Panel>

                <Panel position="bottom-left" className="pointer-events-none">
                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-lg flex flex-col gap-1 text-[10px] text-slate-500 max-w-[220px]">
                        <p className="font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                            Pizarra de Recordatorios:
                        </p>
                        <ul className="list-disc pl-3.5 space-y-0.5">
                            <li>Crea notas de texto con el botón superior.</li>
                            <li>Enlaza notas arrastrando desde sus bordes.</li>
                            <li>Usa los círculos del post-it para cambiar color.</li>
                            <li>Mueve cualquier nota libremente en el lienzo.</li>
                        </ul>
                    </div>
                </Panel>
            </ReactFlow>
        </div>
    );
}

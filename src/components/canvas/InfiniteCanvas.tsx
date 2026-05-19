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
import { Save, HelpCircle, X } from 'lucide-react';
import { NotionEditor } from '../ui/NotionEditor';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const NODE_TYPES = {
    note: NoteNode
};

const MODAL_GLASS_STYLES: Record<string, {
    bg: string;
    border: string;
    glow: string;
    text: string;
    inputBorder: string;
}> = {
    yellow: {
        bg: "bg-amber-100/75 dark:bg-amber-950/20",
        border: "border-amber-300/40 dark:border-amber-500/10",
        glow: "shadow-[0_0_60px_-15px_rgba(245,158,11,0.3)]",
        text: "text-amber-900 dark:text-amber-200",
        inputBorder: "focus:border-amber-500/20"
    },
    green: {
        bg: "bg-emerald-100/75 dark:bg-emerald-950/20",
        border: "border-emerald-300/40 dark:border-emerald-500/10",
        glow: "shadow-[0_0_60px_-15px_rgba(16,185,129,0.3)]",
        text: "text-emerald-900 dark:text-emerald-200",
        inputBorder: "focus:border-emerald-500/20"
    },
    blue: {
        bg: "bg-sky-100/75 dark:bg-sky-950/20",
        border: "border-sky-300/40 dark:border-sky-500/10",
        glow: "shadow-[0_0_60px_-15px_rgba(14,165,233,0.3)]",
        text: "text-sky-900 dark:text-sky-200",
        inputBorder: "focus:border-sky-500/20"
    },
    pink: {
        bg: "bg-rose-100/75 dark:bg-rose-950/20",
        border: "border-rose-300/40 dark:border-rose-500/10",
        glow: "shadow-[0_0_60px_-15px_rgba(244,63,94,0.3)]",
        text: "text-rose-900 dark:text-rose-200",
        inputBorder: "focus:border-rose-500/20"
    },
    gray: {
        bg: "bg-slate-100/75 dark:bg-slate-900/20",
        border: "border-slate-300/40 dark:border-slate-750/30",
        glow: "shadow-[0_0_60px_-15px_rgba(148,163,184,0.3)]",
        text: "text-slate-900 dark:text-slate-200",
        inputBorder: "focus:border-slate-500/20"
    }
};

interface InfiniteCanvasProps {
    boardId: string;
    onAddNoteTrigger: (trigger: () => void) => void;
    onAutoLayoutTrigger: (trigger: () => void) => void;
}

export default function InfiniteCanvas({ boardId, onAddNoteTrigger, onAutoLayoutTrigger }: InfiniteCanvasProps) {
    const { boards, updateBoardState } = useAppStore();
    const board = boards.find(b => b.id === boardId);

    const { getViewport, screenToFlowPosition } = useReactFlow();

    // Nodes and Edges State
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [editingNode, setEditingNode] = useState<Node | null>(null);
    const [editorInitialContent, setEditorInitialContent] = useState<string>('');

    // Load initial board state
    useEffect(() => {
        if (board) {
            setNodes(board.nodes || []);
            setEdges(board.edges || []);
        }
    }, [boardId]); // Only trigger when boardId changes to prevent infinite sync loops

    // Auto-save logic (Debounced)
    useEffect(() => {
        if (!boardId || !board) return;
        
        // Skip saving if local state matches store state (no changes made or just loaded)
        const isSync = JSON.stringify(nodes) === JSON.stringify(board.nodes || []) && 
                       JSON.stringify(edges) === JSON.stringify(board.edges || []);
        if (isSync) return;

        setIsSaving(true);
        const timer = setTimeout(async () => {
            await updateBoardState(boardId, nodes, edges);
            setIsSaving(false);
        }, 1200);

        return () => clearTimeout(timer);
    }, [nodes, edges, boardId, board]);

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

    const onReminderChange = useCallback((id: string, reminderAt: string | null) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return { 
                    ...node, 
                    data: { 
                        ...node.data, 
                        reminderAt,
                        reminderNotified: false
                    } 
                };
            }
            return node;
        }));
    }, [setNodes]);

    const onExpandNode = useCallback((id: string) => {
        const node = nodes.find(n => n.id === id);
        if (node) {
            setEditingNode(node);
            setEditorInitialContent((node.data as any).noteText || '');
        }
    }, [nodes]);

    const handleNoteContentChange = useCallback((id: string, text: string) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return { ...node, data: { ...node.data, noteText: text } };
            }
            return node;
        }));
    }, [setNodes]);

    const handleNoteTitleChange = useCallback((id: string, title: string) => {
        setEditingNode(prev => prev && prev.id === id ? { ...prev, data: { ...prev.data, title } } : prev);
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return { ...node, data: { ...node.data, title } };
            }
            return node;
        }));
    }, [setNodes]);

    // Handle dragging a connection to create and connect a new node on drop (Scrintal style)
    const onConnectEnd = useCallback(
        (event: MouseEvent | TouchEvent, connectionState: any) => {
            // If connection was dropped on a valid target handle, do nothing
            if (connectionState.isValid) return;

            // Get source node ID
            const fromNodeId = connectionState.fromNode?.id;
            if (!fromNodeId) return;

            // Get client coordinates of the release event
            const clientX = 'clientX' in event ? event.clientX : (event.touches?.[0]?.clientX ?? event.changedTouches?.[0]?.clientX ?? 0);
            const clientY = 'clientY' in event ? event.clientY : (event.touches?.[0]?.clientY ?? event.changedTouches?.[0]?.clientY ?? 0);

            // Convert client coordinates to flow coordinate system
            const flowPosition = screenToFlowPosition({
                x: clientX,
                y: clientY
            });

            // Create new note node at this location
            const newId = `note-${Date.now()}`;
            const newNode = {
                id: newId,
                type: 'note' as const,
                position: flowPosition,
                data: {
                    title: 'Nueva Nota Relacionada',
                    noteText: '',
                    color: 'yellow'
                }
            };

            // Create connection edge
            const newEdge = {
                id: `edge-${fromNodeId}-${newId}`,
                source: fromNodeId,
                target: newId,
                animated: true,
                style: { stroke: '#f59e0b', strokeWidth: 2 }
            };

            // Update nodes and edges states
            setNodes((nds) => nds.concat(newNode));
            setEdges((eds) => eds.concat(newEdge));
        },
        [setNodes, setEdges, screenToFlowPosition]
    );

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
                    onDeleteNode: onDeleteNode,
                    onReminderChange: onReminderChange,
                    onExpandNode: onExpandNode
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

    const activeColorName = (editingNode?.data as any)?.color || 'yellow';
    const modalStyle = MODAL_GLASS_STYLES[activeColorName] || MODAL_GLASS_STYLES.yellow;

    return (
        <div className="flex-1 h-full relative">
            <ReactFlow
                nodes={enrichedNodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onConnectEnd={onConnectEnd}
                nodeTypes={NODE_TYPES}
                fitView
                className="bg-slate-50 dark:bg-slate-950"
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                <Controls className="!bg-white dark:!bg-slate-900 !border-slate-200 dark:!border-slate-800" />
                
                {/* Floating Indicator Panels */}
                <Panel position="top-right" className="flex items-center gap-2">
                    <button
                        onClick={async () => {
                            if (!boardId) return;
                            setIsSaving(true);
                            await updateBoardState(boardId, nodes, edges);
                            setIsSaving(false);
                        }}
                        className="bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all active:scale-95 cursor-pointer pointer-events-auto"
                        title="Guardar pizarra ahora en disco"
                    >
                        {isSaving ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                                <span>Guardando...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Guardar Pizarra</span>
                            </>
                        )}
                    </button>
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
                            <li>Suelte la línea en el lienzo para crear una nota enlazada.</li>
                            <li>Usa los círculos del post-it para cambiar color.</li>
                            <li>Arrastra los bordes de la nota seleccionada para cambiar su tamaño.</li>
                        </ul>
                    </div>
                </Panel>
            </ReactFlow>

            {/* Notion-style Fullscreen Rich Text Editor Modal */}
            <AnimatePresence>
                {editingNode && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 select-none">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setEditingNode(null);
                                setEditorInitialContent('');
                            }}
                            className="absolute inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-md"
                        />

                        {/* Modal Box */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 15 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 260 }}
                            className={clsx(
                                "relative backdrop-blur-[35px] border shadow-2xl rounded-[32px] w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden z-10 transition-all duration-500",
                                modalStyle.bg,
                                modalStyle.border,
                                modalStyle.glow
                            )}
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between gap-4 flex-shrink-0">
                                <input
                                    type="text"
                                    value={(editingNode.data as any).title || ''}
                                    onChange={(e) => handleNoteTitleChange(editingNode.id, e.target.value)}
                                    className={clsx(
                                        "text-2xl font-bold bg-transparent outline-none border-b border-transparent w-full transition-all duration-300",
                                        modalStyle.text,
                                        modalStyle.inputBorder
                                    )}
                                    placeholder="Título de la nota..."
                                />
                                
                                <button
                                    onClick={() => {
                                        setEditingNode(null);
                                        setEditorInitialContent('');
                                    }}
                                    className="p-2.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.08] rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer flex-shrink-0 active:scale-90"
                                    title="Guardar y Cerrar"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body: Block editor */}
                            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                                <NotionEditor
                                    initialContent={editorInitialContent}
                                    onChange={(html) => handleNoteContentChange(editingNode.id, html)}
                                    placeholder="Escribe aquí tu nota... Utiliza '/' para comandos rápidos de formato como títulos, tablas, listas..."
                                    transparent={true}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

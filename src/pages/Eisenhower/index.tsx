import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Plus, Trash2, CheckCircle2, Circle, AlertCircle, Calendar, Sparkles, Check, ArrowRight, LayoutGrid } from 'lucide-react';
import clsx from 'clsx';

export default function EisenhowerPage() {
    const { 
        eisenhowerTasks, 
        addEisenhowerTask, 
        updateEisenhowerTask, 
        deleteEisenhowerTask 
    } = useAppStore();

    // Input state for each quadrant
    const [inputs, setInputs] = useState<Record<string, string>>({
        q1: '',
        q2: '',
        q3: '',
        q4: ''
    });

    // Dragged task state for styling
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

    const handleAddTask = async (quadrant: 'q1' | 'q2' | 'q3' | 'q4') => {
        const text = inputs[quadrant]?.trim();
        if (!text) return;

        await addEisenhowerTask(text, quadrant);
        setInputs(prev => ({ ...prev, [quadrant]: '' }));
    };

    const handleKeyDown = (e: React.KeyboardEvent, quadrant: 'q1' | 'q2' | 'q3' | 'q4') => {
        if (e.key === 'Enter') {
            handleAddTask(quadrant);
        }
    };

    const handleToggleTask = async (id: string, completed: boolean) => {
        await updateEisenhowerTask(id, { completed: !completed });
    };

    const handleDeleteTask = async (id: string) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
            await deleteEisenhowerTask(id);
        }
    };

    // Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('text/plain', taskId);
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setDraggedTaskId(null);
    };

    const handleDrop = async (e: React.DragEvent, targetQuadrant: 'q1' | 'q2' | 'q3' | 'q4') => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        if (taskId) {
            await updateEisenhowerTask(taskId, { quadrant: targetQuadrant });
        }
        setDraggedTaskId(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    // Filter tasks by quadrant
    const getTasksByQuadrant = (quadrant: 'q1' | 'q2' | 'q3' | 'q4') => {
        return eisenhowerTasks.filter(t => t.quadrant === quadrant);
    };

    // Matrix configuration
    const quadrants = [
        {
            id: 'q1' as const,
            title: '1. Hacer Ya',
            subtitle: 'Urgente e Importante',
            colorClass: 'rose',
            badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
            cardBg: 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-200/50 dark:border-rose-900/30',
            glowClass: 'shadow-[0_8px_30px_rgb(244,63,94,0.06)] dark:shadow-none',
            btnBg: 'bg-rose-500 hover:bg-rose-600',
            taskBg: 'bg-white/80 dark:bg-rose-950/20 hover:border-rose-300 dark:hover:border-rose-800/50',
            taskBorder: 'border-rose-100 dark:border-rose-900/20',
            checkColor: 'text-rose-500',
            inputBorder: 'focus:border-rose-400 focus:ring-rose-400/20'
        },
        {
            id: 'q2' as const,
            title: '2. Planificar',
            subtitle: 'Importante, No Urgente',
            colorClass: 'sky',
            badgeBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
            cardBg: 'bg-sky-50/50 dark:bg-sky-950/10 border-sky-200/50 dark:border-sky-900/30',
            glowClass: 'shadow-[0_8px_30px_rgb(14,165,233,0.06)] dark:shadow-none',
            btnBg: 'bg-sky-500 hover:bg-sky-600',
            taskBg: 'bg-white/80 dark:bg-sky-950/20 hover:border-sky-300 dark:hover:border-sky-800/50',
            taskBorder: 'border-sky-100 dark:border-sky-900/20',
            checkColor: 'text-sky-500',
            inputBorder: 'focus:border-sky-400 focus:ring-sky-400/20'
        },
        {
            id: 'q3' as const,
            title: '3. Delegar',
            subtitle: 'Urgente, No Importante',
            colorClass: 'amber',
            badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
            cardBg: 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-900/30',
            glowClass: 'shadow-[0_8px_30px_rgb(245,158,11,0.06)] dark:shadow-none',
            btnBg: 'bg-amber-500 hover:bg-amber-600',
            taskBg: 'bg-white/80 dark:bg-amber-950/20 hover:border-amber-300 dark:hover:border-amber-800/50',
            taskBorder: 'border-amber-100 dark:border-amber-900/20',
            checkColor: 'text-amber-500',
            inputBorder: 'focus:border-amber-400 focus:ring-amber-400/20'
        },
        {
            id: 'q4' as const,
            title: '4. Descartar',
            subtitle: 'No Urgente, No Importante',
            colorClass: 'emerald',
            badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            cardBg: 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200/50 dark:border-emerald-900/30',
            glowClass: 'shadow-[0_8px_30px_rgb(16,185,129,0.06)] dark:shadow-none',
            btnBg: 'bg-emerald-500 hover:bg-emerald-600',
            taskBg: 'bg-white/80 dark:bg-emerald-950/20 hover:border-emerald-300 dark:hover:border-emerald-800/50',
            taskBorder: 'border-emerald-100 dark:border-emerald-900/20',
            checkColor: 'text-emerald-500',
            inputBorder: 'focus:border-emerald-400 focus:ring-emerald-400/20'
        }
    ];

    // Stats calculations
    const totalCount = eisenhowerTasks.length;
    const completedCount = eisenhowerTasks.filter(t => t.completed).length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="flex-1 flex flex-col p-8 overflow-y-auto min-h-screen pb-24 scrollbar-thin">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 dark:text-orange-400">
                            <LayoutGrid className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-orange-500 dark:text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full">
                            Técnica Eisenhower
                        </span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 dark:text-white font-display">
                        Matriz de Eisenhower
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                        Prioriza y reparte tus tareas según su nivel de urgencia e importancia. Arrastra las tareas entre cuadrantes para reorganizarlas.
                    </p>
                </div>

                {/* Progress Card */}
                <div className="flex items-center gap-4 bg-white/40 dark:bg-slate-900/20 border border-white/30 dark:border-white/5 p-4 rounded-3xl backdrop-blur-xl shadow-sm min-w-[240px]">
                    <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Progreso Total</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-white">{completionRate}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-orange-500 to-amber-500 h-1.5 rounded-full transition-all duration-500" 
                                style={{ width: `${completionRate}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                            {completedCount} de {totalCount} tareas completadas
                        </span>
                    </div>
                </div>
            </div>

            {/* Matrix 2x2 Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1">
                {quadrants.map((quad) => {
                    const tasks = getTasksByQuadrant(quad.id);
                    
                    return (
                        <div
                            key={quad.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, quad.id)}
                            className={clsx(
                                "flex flex-col rounded-[32px] border p-6 transition-all duration-300",
                                quad.cardBg,
                                quad.glowClass,
                                draggedTaskId ? "ring-2 ring-dashed ring-slate-300 dark:ring-slate-800 scale-[0.99]" : ""
                            )}
                        >
                            {/* Quadrant Header */}
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-3">
                                    <span className={clsx("text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider", quad.badgeBg)}>
                                        {quad.title}
                                    </span>
                                    <div>
                                        <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                                            {quad.subtitle}
                                        </h3>
                                    </div>
                                </div>
                                <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                                    {tasks.length} {tasks.length === 1 ? 'tarea' : 'tareas'}
                                </span>
                            </div>

                            {/* Task Input */}
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={inputs[quad.id]}
                                    onChange={(e) => setInputs(prev => ({ ...prev, [quad.id]: e.target.value }))}
                                    onKeyDown={(e) => handleKeyDown(e, quad.id)}
                                    placeholder="Agregar nueva tarea pendiente..."
                                    className={clsx(
                                        "flex-1 bg-white/60 dark:bg-slate-950/20 border border-slate-200 dark:border-white/5 rounded-2xl px-4 py-2.5 text-sm outline-none transition-all duration-300 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:bg-white dark:focus:bg-slate-900",
                                        quad.inputBorder
                                    )}
                                />
                                <button
                                    onClick={() => handleAddTask(quad.id)}
                                    className={clsx(
                                        "p-2.5 rounded-2xl text-white shadow-sm transition-transform active:scale-95 cursor-pointer flex items-center justify-center",
                                        quad.btnBg
                                    )}
                                    title="Añadir tarea"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Task List */}
                            <div className="flex-1 overflow-y-auto space-y-2 min-h-[220px] max-h-[350px] pr-1 scrollbar-thin">
                                {tasks.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                        <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                                        <p className="text-xs text-slate-400 dark:text-slate-500">
                                            Sin tareas pendientes
                                        </p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-0.5">
                                            Escribe y pulsa + para agregar una tarea.
                                        </p>
                                    </div>
                                ) : (
                                    tasks.map((task) => (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task.id)}
                                            onDragEnd={handleDragEnd}
                                            className={clsx(
                                                "flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-200 cursor-grab active:cursor-grabbing group",
                                                quad.taskBg,
                                                quad.taskBorder,
                                                task.completed ? "opacity-50 line-through text-slate-400" : "text-slate-700 dark:text-slate-200",
                                                draggedTaskId === task.id ? "opacity-30 border-dashed border-slate-400" : ""
                                            )}
                                        >
                                            <button
                                                onClick={() => handleToggleTask(task.id, task.completed)}
                                                className="focus:outline-none flex-shrink-0 cursor-pointer transition-transform active:scale-90"
                                            >
                                                {task.completed ? (
                                                    <CheckCircle2 className={clsx("w-5 h-5", quad.checkColor)} />
                                                ) : (
                                                    <Circle className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350" />
                                                )}
                                            </button>

                                            <span className="flex-1 text-sm font-medium leading-tight select-none">
                                                {task.text}
                                            </span>

                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer flex-shrink-0"
                                                title="Eliminar tarea"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

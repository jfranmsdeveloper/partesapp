import { useState } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { StickyNote, Trash, Bell, Maximize2 } from 'lucide-react';
import clsx from 'clsx';

const COLORS = [
    { name: 'yellow', bg: 'bg-amber-100/90 border-amber-300 dark:bg-amber-950/40 dark:border-amber-900', text: 'text-amber-800 dark:text-amber-300', dot: 'bg-amber-400' },
    { name: 'green', bg: 'bg-emerald-100/90 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-900', text: 'text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-400' },
    { name: 'blue', bg: 'bg-sky-100/90 border-sky-300 dark:bg-sky-950/40 dark:border-sky-900', text: 'text-sky-800 dark:text-sky-300', dot: 'bg-sky-400' },
    { name: 'pink', bg: 'bg-rose-100/90 border-rose-300 dark:bg-rose-950/40 dark:border-rose-900', text: 'text-rose-800 dark:text-rose-300', dot: 'bg-rose-400' },
    { name: 'gray', bg: 'bg-slate-100/90 border-slate-300 dark:bg-slate-800 dark:border-slate-700', text: 'text-slate-800 dark:text-slate-350', dot: 'bg-slate-500' }
];

export default function NoteNode({ id, data, selected, width, height }: { id: string, data: any, selected?: boolean, width?: number, height?: number }) {
    const selectedColor = COLORS.find(c => c.name === data.color) || COLORS[0];
    const [showReminderPicker, setShowReminderPicker] = useState(false);

    const containerStyle = {
        width: width ? `${width}px` : '240px',
        height: height ? `${height}px` : 'auto',
    };

    const formatReminder = (iso: string) => {
        try {
            const date = new Date(iso);
            return date.toLocaleString('es-ES', { 
                day: '2-digit', 
                month: 'short', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } catch {
            return '';
        }
    };

    return (
        <div 
            style={containerStyle}
            className={clsx(
                "relative group border rounded-2xl p-4 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-200 backdrop-blur-md flex flex-col gap-2 min-h-[120px] select-none",
                selectedColor.bg
            )}
        >
            {/* React Flow Resize Controls */}
            <NodeResizer 
                color="#f59e0b" 
                minWidth={180} 
                minHeight={120} 
                isVisible={selected} 
            />

            {/* Handles for connections */}
            <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-2 h-2" />
            <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-2 h-2" />
            <Handle type="target" position={Position.Left} className="!bg-slate-500 !w-2 h-2" />
            <Handle type="source" position={Position.Right} className="!bg-slate-500 !w-2 h-2" />

            {/* Header: Note Icon & Title & Controls */}
            <div className="flex items-center justify-between gap-2 border-b border-black/10 dark:border-white/10 pb-1.5 flex-shrink-0">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <StickyNote className={clsx("w-4 h-4 flex-shrink-0", selectedColor.text)} />
                    <input 
                        type="text"
                        value={data.title || ''}
                        onChange={(e) => data.onTitleChange?.(id, e.target.value)}
                        placeholder="Título de la nota..."
                        className="bg-transparent font-bold text-xs outline-none w-full placeholder-slate-500/60 dark:placeholder-slate-400/40 text-slate-800 dark:text-slate-200"
                    />
                </div>
                
                {/* Controls toolbar */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Expand button */}
                    <button 
                        onClick={() => data.onExpandNode?.(id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-opacity p-0.5 rounded cursor-pointer"
                        title="Editar en pantalla completa (Doble clic)"
                    >
                        <Maximize2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Bell/Reminder button */}
                    <button 
                        onClick={() => setShowReminderPicker(prev => !prev)}
                        className={clsx(
                            "transition-opacity p-0.5 rounded cursor-pointer",
                            data.reminderAt ? "text-amber-500 opacity-100 animate-pulse" : "opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
                        )}
                        title="Establecer recordatorio"
                    >
                        <Bell className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button 
                        onClick={() => data.onDeleteNode?.(id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-0.5 rounded cursor-pointer"
                        title="Eliminar nota"
                    >
                        <Trash className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Reminder Date Selector Popover */}
            {showReminderPicker && (
                <div className="absolute top-12 left-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl z-20 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150">
                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Bell className="w-3 h-3 text-amber-500" />
                        Recordatorio
                    </p>
                    <input 
                        type="datetime-local" 
                        value={data.reminderAt ? data.reminderAt.substring(0, 16) : ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                                const iso = new Date(val).toISOString();
                                data.onReminderChange?.(id, iso);
                            } else {
                                data.onReminderChange?.(id, null);
                            }
                        }}
                        className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 outline-none text-slate-800 dark:text-white/80 focus:border-amber-500 w-full"
                    />
                    <div className="flex justify-between items-center mt-1">
                        {data.reminderAt && (
                            <button 
                                onClick={() => {
                                    data.onReminderChange?.(id, null);
                                    setShowReminderPicker(false);
                                }}
                                className="text-[9px] text-red-500 hover:underline cursor-pointer font-semibold"
                            >
                                Eliminar
                            </button>
                        )}
                        <button 
                            onClick={() => setShowReminderPicker(false)}
                            className="text-[9px] bg-amber-500 text-white px-2 py-1 rounded shadow hover:bg-amber-600 transition-colors ml-auto cursor-pointer font-semibold"
                        >
                            Listo
                        </button>
                    </div>
                </div>
            )}

            {/* Active Reminder Indicator Badge */}
            {data.reminderAt && (
                <div className="flex-shrink-0">
                    <span className="text-[9px] font-semibold bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1 w-max">
                        <Bell className="w-2.5 h-2.5" />
                        {formatReminder(data.reminderAt)}
                    </span>
                </div>
            )}

            {/* Body: HTML Content Preview (Double click to open rich block editor modal) */}
            <div 
                className="flex-1 min-h-0 overflow-y-auto cursor-text select-text prose prose-xs dark:prose-invert text-[11px] text-slate-700 dark:text-slate-350 leading-relaxed font-sans scrollbar-thin pr-1"
                dangerouslySetInnerHTML={{ __html: data.noteText || '<p class="text-slate-400/80 italic">Haz doble clic o pulsa expandir para escribir...</p>' }}
                onDoubleClick={() => data.onExpandNode?.(id)}
            />

            {/* Footer: Color Picker */}
            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1.5 border-t border-black/5 dark:border-white/5 flex-shrink-0">
                {COLORS.map(c => (
                    <button
                        key={c.name}
                        onClick={() => data.onColorChange?.(id, c.name)}
                        className={clsx(
                            "w-3.5 h-3.5 rounded-full flex-shrink-0 border transition-transform cursor-pointer hover:scale-125",
                            c.dot,
                            data.color === c.name ? "border-black/50 dark:border-white/80 scale-110" : "border-transparent"
                        )}
                        title={`Color ${c.name}`}
                    />
                ))}
            </div>
        </div>
    );
}

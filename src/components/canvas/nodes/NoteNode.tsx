import { Handle, Position } from '@xyflow/react';
import { StickyNote, Trash } from 'lucide-react';
import clsx from 'clsx';

const COLORS = [
    { name: 'yellow', bg: 'bg-amber-100 border-amber-300 dark:bg-amber-950/40 dark:border-amber-900', text: 'text-amber-800 dark:text-amber-300', dot: 'bg-amber-400' },
    { name: 'green', bg: 'bg-emerald-100 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-900', text: 'text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-400' },
    { name: 'blue', bg: 'bg-sky-100 border-sky-300 dark:bg-sky-950/40 dark:border-sky-900', text: 'text-sky-800 dark:text-sky-300', dot: 'bg-sky-400' },
    { name: 'pink', bg: 'bg-rose-100 border-rose-300 dark:bg-rose-950/40 dark:border-rose-900', text: 'text-rose-800 dark:text-rose-300', dot: 'bg-rose-400' },
    { name: 'gray', bg: 'bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-700', text: 'text-slate-850 dark:text-slate-350', dot: 'bg-slate-500' }
];

export default function NoteNode({ id, data }: { id: string, data: any }) {
    const selectedColor = COLORS.find(c => c.name === data.color) || COLORS[0];

    return (
        <div className={clsx(
            "relative group border rounded-2xl p-4 w-60 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 backdrop-blur-md flex flex-col gap-2",
            selectedColor.bg
        )}>
            {/* Handles for connections */}
            <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-2 h-2" />
            <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-2 h-2" />
            <Handle type="target" position={Position.Left} className="!bg-slate-500 !w-2 h-2" />
            <Handle type="source" position={Position.Right} className="!bg-slate-500 !w-2 h-2" />

            {/* Header: Note Icon & Title & Color Options */}
            <div className="flex items-center justify-between gap-2 border-b border-black/10 dark:border-white/10 pb-1.5">
                <div className="flex items-center gap-1.5">
                    <StickyNote className={clsx("w-4 h-4", selectedColor.text)} />
                    <input 
                        type="text"
                        value={data.title || ''}
                        onChange={(e) => data.onTitleChange?.(id, e.target.value)}
                        placeholder="Título de la nota..."
                        className="bg-transparent font-bold text-xs outline-none w-32 placeholder-slate-500/60 dark:placeholder-slate-400/40"
                    />
                </div>
                {/* Delete button */}
                <button 
                    onClick={() => data.onDeleteNode?.(id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-0.5 rounded cursor-pointer"
                    title="Eliminar nota"
                >
                    <Trash className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Body: Editable Textarea */}
            <textarea
                value={data.noteText || ''}
                onChange={(e) => data.onChange?.(id, e.target.value)}
                placeholder="Escribe algo aquí..."
                rows={3}
                className="bg-transparent text-xs resize-none outline-none border-0 w-full focus:ring-0 p-0 text-slate-700 dark:text-slate-300 placeholder-slate-500/50 dark:placeholder-slate-400/40 leading-relaxed font-sans"
            />

            {/* Footer: Color Picker */}
            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1.5 border-t border-black/5 dark:border-white/5">
                {COLORS.map(c => (
                    <button
                        key={c.name}
                        onClick={() => data.onColorChange?.(id, c.name)}
                        className={clsx(
                            "w-3.5 h-3.5 rounded-full flex-shrink-0 border transition-transform cursor-pointer hover:scale-125",
                            c.dot,
                            data.color === c.name ? "border-black/50 dark:border-white/80 scale-110" : "border-transparent"
                        )}
                        title={`Nota ${c.name}`}
                    />
                ))}
            </div>
        </div>
    );
}

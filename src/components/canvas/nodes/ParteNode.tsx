import { Handle, Position } from '@xyflow/react';
import { useAppStore } from '../../../store/useAppStore';
import { FileText, Clock, User, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';

export default function ParteNode({ data }: { data: { parteId: string | number } }) {
    const { partes } = useAppStore();
    const parte = partes.find(p => String(p.id) === String(data.parteId));

    if (!parte) {
        return (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-4 w-64 shadow-md text-center">
                <p className="text-red-600 dark:text-red-400 font-semibold text-sm">Parte no encontrado</p>
                <p className="text-xs text-slate-500">ID: {data.parteId}</p>
                <Handle type="target" position={Position.Top} />
                <Handle type="source" position={Position.Bottom} />
            </div>
        );
    }

    return (
        <div className="relative group bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 w-64 shadow-lg hover:shadow-xl hover:scale-[1.02] hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 backdrop-blur-md">
            {/* Handles for connections */}
            <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-2 h-2" />
            <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-2 h-2" />
            <Handle type="target" position={Position.Left} className="!bg-blue-500 !w-2 h-2" />
            <Handle type="source" position={Position.Right} className="!bg-blue-500 !w-2 h-2" />

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        #{parte.id}
                    </span>
                    <span className={clsx(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                        parte.status === 'ABIERTO' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        parte.status === 'EN TRÁMITE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    )}>
                        {parte.status}
                    </span>
                </div>

                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight">
                    {parte.title}
                </h4>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{parte.totalTime} min</span>
                    </div>
                    <div className="flex items-center gap-1 max-w-[120px] truncate">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{parte.createdBy}</span>
                    </div>
                </div>
            </div>

            {/* Quick action link */}
            <a 
                href={`/parte/${parte.id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute top-2 right-2 p-1 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                title="Abrir parte en pestaña nueva"
            >
                <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
        </div>
    );
}

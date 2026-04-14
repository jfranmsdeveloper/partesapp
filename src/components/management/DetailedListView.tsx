import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, User, Clock, CheckCircle, Activity, Eye, FileDown, MoreVertical } from 'lucide-react';
import type { Parte } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

interface DetailedListViewProps {
    partes: Parte[];
}

export const DetailedListView = ({ partes }: DetailedListViewProps) => {
    const { clients } = useAppStore();
    const navigate = useNavigate();

    return (
        <div className="w-full overflow-hidden glass-card rounded-[2rem] border border-white/40 dark:border-white/10 shadow-xl">
            <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">ID / Estado</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Título / Descripción</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 lg:table-cell hidden">Cliente</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 sm:table-cell hidden">Creador</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Fecha</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-center">Tiempo</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {partes.map((parte) => {
                            const client = clients.find(c => c.id === parte.clientId);
                            const dateObj = new Date(parte.createdAt);
                            
                            return (
                                <tr 
                                    key={parte.id} 
                                    className="group hover:bg-orange-50/30 dark:hover:bg-orange-500/5 transition-all duration-300 cursor-pointer"
                                    onClick={() => navigate(`/parte/${parte.id}`)}
                                >
                                    {/* ID & Status */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={clsx(
                                                "w-8 h-8 rounded-xl flex items-center justify-center shadow-sm shrink-0",
                                                parte.status === 'CERRADO' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                parte.status === 'EN TRÁMITE' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' :
                                                'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                                            )}>
                                                {parte.status === 'CERRADO' ? <CheckCircle className="w-4 h-4" /> :
                                                 parte.status === 'EN TRÁMITE' ? <Activity className="w-4 h-4" /> :
                                                 <Clock className="w-4 h-4" />}
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">#{parte.id}</span>
                                        </div>
                                    </td>

                                    {/* Title */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-800 dark:text-white/90 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate max-w-[200px] lg:max-w-[300px]">
                                                {parte.title}
                                            </span>
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                                                {parte.actuaciones.length} actuaciones registradas
                                            </span>
                                        </div>
                                    </td>

                                    {/* Client */}
                                    <td className="px-6 py-4 lg:table-cell hidden">
                                        {client ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                                                    <User className="w-3 h-3 text-slate-500" />
                                                </div>
                                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{client.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Sin asignar</span>
                                        )}
                                    </td>

                                    {/* Creator */}
                                    <td className="px-6 py-4 sm:table-cell hidden">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-[10px] font-bold text-orange-600">
                                                {parte.createdBy.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[100px]">{parte.createdBy}</span>
                                        </div>
                                    </td>

                                    {/* Date */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                {format(dateObj, 'dd MMM yyyy', { locale: es })}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {format(dateObj, 'HH:mm')}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Time */}
                                    <td className="px-6 py-4 text-center">
                                        <span className={clsx(
                                            "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black",
                                            parte.totalTime > 120 ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" :
                                            parte.totalTime > 60 ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400" :
                                            "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                                        )}>
                                            {parte.totalTime}m
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/parte/${parte.id}`);
                                                }}
                                                className="p-2 rounded-xl hover:bg-white dark:hover:bg-white/10 text-slate-500 shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                                                title="Ver detalle"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {parte.pdfFile && (
                                                <button 
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-2 rounded-xl hover:bg-white dark:hover:bg-white/10 text-blue-500 shadow-sm border border-transparent hover:border-blue-200 dark:hover:border-blue-500/30"
                                                    title="Descargar PDF"
                                                >
                                                    <FileDown className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button 
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-2 rounded-xl hover:bg-white dark:hover:bg-white/10 text-slate-400"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            {partes.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center justify-center animate-in fade-in duration-700">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No hay partes que mostrar con estos filtros</p>
                </div>
            )}
        </div>
    );
};

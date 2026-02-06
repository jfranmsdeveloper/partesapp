import type { Actuacion } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { ACTUACION_CONFIG } from '../../utils/actuacionConfig';
import { Trash2, Clock, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ActuacionesListProps {
    actuaciones: Actuacion[];
    onDelete?: (id: string) => void;
    onEdit?: (actuacion: Actuacion) => void;
    readOnly?: boolean;
}

export const ActuacionesList = ({ actuaciones, onDelete, onEdit, readOnly = false }: ActuacionesListProps) => {
    const { users } = useAppStore();

    if (actuaciones.length === 0) {
        return (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                No hay actuaciones registradas. Añade una para comenzar.
            </div>
        );
    }

    return (
        <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-800">
            {actuaciones.map((actuacion) => {
                const config = ACTUACION_CONFIG[actuacion.type];
                const Icon = config.icon;

                return (
                    <div key={actuacion.id} className="flex items-start gap-4 py-4 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors group">
                        <div className={`p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm ${config.color}`}>
                            <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h4 className="font-medium text-slate-900 dark:text-slate-100">{actuacion.type}</h4>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {format(new Date(actuacion.timestamp), "d MMM HH:mm", { locale: es })}
                                </div>
                            </div>

                            {actuacion.notes && (
                                <div
                                    className="text-sm text-slate-600 dark:text-slate-300 mt-1 prose prose-sm max-w-none dark:prose-invert break-words overflow-hidden"
                                    dangerouslySetInnerHTML={{ __html: actuacion.notes }}
                                />
                            )}

                            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-50 dark:border-white/5 pt-2">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{actuacion.duration} min</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {(() => {
                                        const userObj = users.find(u => (u.user_metadata?.full_name || u.name) === actuacion.user || u.email === actuacion.user);
                                        const hasAvatar = userObj?.avatar_url;

                                        return (
                                            <>
                                                {hasAvatar ? (
                                                    <img
                                                        src={userObj.avatar_url}
                                                        alt={actuacion.user}
                                                        className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                                    />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-[10px] text-orange-700 dark:text-orange-400 font-bold uppercase ring-1 ring-orange-200 dark:ring-orange-800">
                                                        {actuacion.user.charAt(0)}
                                                    </div>
                                                )}
                                                <span className="font-medium">{actuacion.user}</span>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        {!readOnly && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onEdit?.(actuacion)}
                                    className="text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 p-1"
                                    title="Editar actuación"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete?.(actuacion.id)}
                                    className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                    title="Eliminar actuación"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

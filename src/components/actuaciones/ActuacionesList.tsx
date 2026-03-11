import type { Actuacion } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { ACTUACION_CONFIG } from '../../utils/actuacionConfig';
import { Trash2, Clock, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DOMPurify from 'dompurify';

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
        <div className="space-y-4">
            {actuaciones.map((actuacion) => {
                const config = ACTUACION_CONFIG[actuacion.type];
                const Icon = config.icon;

                return (
                    <div key={actuacion.id} className="flex items-start gap-4 p-4 md:p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 hover:border-blue-200 hover:shadow-md rounded-2xl transition-all group relative">
                        <div className={`p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm ${config.color}`}>
                            <Icon className="w-6 h-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">{actuacion.type}</h4>
                                <div className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm">
                                    {format(new Date(actuacion.timestamp), "d MMM HH:mm", { locale: es })}
                                </div>
                            </div>

                            {actuacion.notes && (
                                <div
                                    className="text-base md:text-lg text-slate-700 dark:text-slate-200 mt-3 mb-2 prose max-w-none dark:prose-invert break-words overflow-hidden"
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(actuacion.notes) }}
                                />
                            )}

                            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-white/5 pt-3">
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
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-lg">
                                <button
                                    onClick={() => onEdit?.(actuacion)}
                                    className="text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                    title="Editar actuación"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete?.(actuacion.id)}
                                    className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
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

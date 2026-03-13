import { useState } from 'react';
import type { Actuacion } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { ACTUACION_CONFIG } from '../../utils/actuacionConfig';
import { Trash2, Clock, Edit2, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
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
            {actuaciones.map((actuacion, index) => (
                <ActuacionItem 
                    key={actuacion.id} 
                    actuacion={actuacion} 
                    users={users}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    readOnly={readOnly}
                    isInitiallyExpanded={index === 0} // Primera actuación abierta por defecto
                />
            ))}
        </div>
    );
};

interface ActuacionItemProps {
    actuacion: Actuacion;
    users: any[];
    onEdit?: (actuacion: Actuacion) => void;
    onDelete?: (id: string) => void;
    readOnly?: boolean;
    isInitiallyExpanded?: boolean;
}

const ActuacionItem = ({ actuacion, users, onEdit, onDelete, readOnly, isInitiallyExpanded = false }: ActuacionItemProps) => {
    const [isOpen, setIsOpen] = useState(isInitiallyExpanded);
    const config = ACTUACION_CONFIG[actuacion.type];
    const Icon = config.icon;

    return (
        <div className="flex flex-col bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 hover:border-blue-300 shadow-sm rounded-2xl overflow-hidden transition-all group">
            {/* Cabecera Clickable (Toggle) */}
            <div 
                className="flex items-center gap-4 p-4 md:p-5 cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 transition-colors select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className={`p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm ${config.color}`}>
                    <Icon className="w-6 h-6" />
                </div>
                
                <div className="flex-1 min-w-0 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">{actuacion.type}</h4>
                            {actuacion.priority && (
                                <span className={clsx(
                                    "px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase",
                                    actuacion.priority === 'ALTA' ? "bg-red-500 text-white" :
                                    actuacion.priority === 'MEDIA' ? "bg-orange-500 text-white" :
                                    "bg-slate-400 text-white"
                                )}>
                                    {actuacion.priority}
                                </span>
                            )}
                        </div>
                        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
                            <span className="flex items-center gap-1.5">{format(new Date(actuacion.timestamp), "d MMM HH:mm", { locale: es })}</span>
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {actuacion.duration} min</span>
                            
                            {actuacion.tags && actuacion.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 ml-2">
                                    {actuacion.tags.map(tag => (
                                        <span key={tag} className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 text-[10px] font-medium border border-blue-100 dark:border-blue-800">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 mr-2">
                             {(() => {
                                const userObj = users.find(u => (u.user_metadata?.full_name || u.name) === actuacion.user || u.email === actuacion.user);
                                const hasAvatar = userObj?.avatar_url;

                                return (
                                    <>
                                        {hasAvatar ? (
                                            <img
                                                src={userObj.avatar_url}
                                                alt={actuacion.user}
                                                className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                            />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-xs text-orange-700 dark:text-orange-400 font-bold uppercase ring-1 ring-orange-200 dark:ring-orange-800">
                                                {actuacion.user.charAt(0)}
                                            </div>
                                        )}
                                        <span className="font-medium text-sm text-slate-600 dark:text-slate-300">{actuacion.user}</span>
                                    </>
                                );
                            })()}
                        </div>
                        <div className={`p-1.5 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                            <ChevronDown className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido Desplegable */}
            <div 
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden">
                    <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-900/20 relative">
                        {actuacion.notes ? (
                            <div
                                className="text-base md:text-lg text-slate-700 dark:text-slate-200 prose max-w-none dark:prose-invert break-words"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(actuacion.notes) }}
                            />
                        ) : (
                            <p className="text-slate-400 italic text-sm">Sin notas adicionales.</p>
                        )}
                        
                        {!readOnly && (
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit?.(actuacion); }}
                                    className="text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                    title="Editar actuación"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete?.(actuacion.id); }}
                                    className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                    title="Eliminar actuación"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

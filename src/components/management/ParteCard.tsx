import { useNavigate } from 'react-router-dom';
import type { Parte } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Badge } from '../ui/Badge';
import { Clock, List, Check } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx } from 'clsx';

interface ParteCardProps {
    parte: Parte;
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onSelect?: (id: number | string) => void;
}

export const ParteCard = ({ parte, isSelectionMode, isSelected, onSelect }: ParteCardProps) => {
    const navigate = useNavigate();
    const { users } = useAppStore();

    // Logic to determine which user to display
    const issuerName = parte.createdBy;
    const issuerUser = users.find(u => (u.user_metadata?.full_name || u.name || u.email) === issuerName);
    const ownerUser = users.find(u => u.id === parte.userId || u.email === parte.userId);
    const displayName = issuerName || ownerUser?.user_metadata?.full_name || ownerUser?.name || 'Desconocido';
    const avatarUrl = issuerName ? issuerUser?.avatar_url : ownerUser?.avatar_url;

    const handleCardClick = (e: React.MouseEvent) => {
        if (isSelectionMode && onSelect) {
            e.stopPropagation();
            onSelect(parte.id);
        } else {
            navigate(`/parte/${parte.id}`);
        }
    };

    return (
        <div
            onClick={handleCardClick}
            className={clsx(
                "p-5 rounded-[2rem] bg-white dark:bg-dark-card border shadow-sm transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-md group relative overflow-hidden",
                isSelected ? "border-orange-500 ring-2 ring-orange-500/20" : "border-slate-200 dark:border-dark-border dark:hover:border-slate-700/50"
            )}
        >
            {/* Selection Checkbox Overlay */}
            {isSelectionMode && (
                <div 
                    className="absolute top-4 left-4 z-20"
                    onClick={(e) => { e.stopPropagation(); onSelect?.(parte.id); }}
                >
                    <div className={clsx(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                        isSelected ? "bg-orange-500 border-orange-500 text-white" : "bg-white/80 border-slate-300"
                    )}>
                        {isSelected && <Check className="w-4 h-4" />}
                    </div>
                </div>
            )}

            <div className={clsx("flex justify-between items-start mb-2 relative z-10", isSelectionMode && "pl-8")}>
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">#{parte.id}</span>
                <Badge
                    variant={
                        parte.status === 'ABIERTO' ? 'success' :
                            parte.status === 'EN TRÁMITE' ? 'warning' : 'danger'
                    }
                >
                    {parte.status}
                </Badge>
            </div>

            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2 relative z-10">
                {parte.title}
            </h3>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-4">
                <div className="flex items-center gap-2">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span className="truncate max-w-[150px]">
                        {displayName}
                    </span>
                </div>
                <span className="flex items-center gap-1">
                    {format(new Date(parte.createdAt), "d MMM", { locale: es })}
                </span>
            </div>

            <div className="border-t border-slate-100 dark:border-white/10 mt-3 pt-3 flex gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {parte.totalTime} min
                </div>
                <div className="flex items-center gap-1">
                    <List className="w-3 h-3" />
                    {parte.totalActuaciones}
                </div>
            </div>
        </div>
    );
};

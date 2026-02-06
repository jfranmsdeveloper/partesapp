import { useNavigate } from 'react-router-dom';
import type { Parte } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { Badge } from '../ui/Badge';
import { Clock, List } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ParteCardProps {
    parte: Parte;
}

export const ParteCard = ({ parte }: ParteCardProps) => {
    const navigate = useNavigate();
    const { users } = useAppStore();
    const user = users.find(u => u.id === parte.userId || u.email === parte.userId); // userId might be email in legacy data? Types say string. Schema says userId is owner email or id. Let's match both. Actually store uses ID for new users but maybe email for old? 
    // In server.js registration: id is 'user-' + timestamp. 
    // In types: userId: string; // Owner email. Wait. 
    // server.js /partes: user_id: 'user-...'
    // So it links by ID.
    // Let's safe match.


    return (
        <div
            onClick={() => navigate(`/parte/${parte.id}`)}
            className="glass-card card-hover-glow p-4 rounded-xl transition-all cursor-pointer group hover:-translate-y-1 relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex justify-between items-start mb-2 relative z-10">
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
                    {user?.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt="Avatar"
                            className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {(user?.name || parte.createdBy || '?').charAt(0).toUpperCase()}
                        </div>
                    )}
                    <span className="truncate max-w-[80px]">
                        {user?.user_metadata?.full_name || user?.name || parte.createdBy}
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

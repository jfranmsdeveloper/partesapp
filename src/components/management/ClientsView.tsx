import { useAppStore } from '../../store/useAppStore';
import { Card } from '../ui/Card';
import { User, Phone, Mail, FileText, ChevronRight, UserPlus } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface ClientsViewProps {
    onFilterChange: (key: any, value: string) => void;
    onViewChange: (val: any) => void;
}

export const ClientsView = ({ onFilterChange, onViewChange }: ClientsViewProps) => {
    const { clients, partes } = useAppStore();

    const clientStats = clients.map(client => {
        const clientPartes = partes.filter(p => p.clientId === client.id);
        const activePartes = clientPartes.filter(p => p.status !== 'CERRADO').length;
        return {
            ...client,
            totalPartes: clientPartes.length,
            activePartes
        };
    });

    if (clients.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] border border-dashed border-slate-300 dark:border-slate-800">
                <UserPlus className="w-12 h-12 text-slate-300 mb-4 animate-pulse" />
                <p className="text-slate-500 font-medium">No hay clientes registrados.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
            {clientStats.map((client, idx) => (
                <motion.div
                    key={client.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                >
                    <Card
                        className="group relative overflow-hidden p-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border-white/40 dark:border-white/5 rounded-[2.5rem] hover:scale-[1.03] transition-all duration-500 cursor-pointer shadow-xl hover:shadow-2xl"
                        onClick={() => {
                            onFilterChange('clientId', client.id);
                            onViewChange('list');
                        }}
                    >
                        {/* Status Glow */}
                        <div className={clsx(
                            "absolute -top-12 -right-12 w-24 h-24 blur-[60px] opacity-20 transition-opacity group-hover:opacity-40",
                            client.activePartes > 0 ? "bg-orange-500" : "bg-blue-500"
                        )} />

                        <div className="flex flex-col gap-6">
                            <div className="flex items-start justify-between">
                                <div className="p-4 rounded-[1.5rem] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 shadow-inner group-hover:from-blue-500 group-hover:to-indigo-600 transition-all duration-500">
                                    <User className="w-7 h-7 text-slate-600 dark:text-slate-300 group-hover:text-white" />
                                </div>
                                <div className="text-right">
                                    <span className={clsx(
                                        "text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest bg-white/50 dark:bg-black/20 border border-white/30 dark:border-white/5",
                                        client.activePartes > 0 ? "text-orange-600" : "text-slate-500"
                                    )}>
                                        {client.activePartes} Activos
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-blue-500 transition-colors">
                                    {client.name}
                                </h3>
                                <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5" />
                                    {client.totalPartes} Partes totales
                                </p>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                    <Phone className="w-4 h-4" />
                                    <span className="text-xs font-medium">{client.phone || 'Sin teléfono'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                                    <Mail className="w-4 h-4" />
                                    <span className="text-xs font-medium truncate">{client.email || 'Sin email'}</span>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between group/btn">
                                <span className="text-[10px] font-black text-blue-600 tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                                    Ver historial
                                </span>
                                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            ))}
        </div>
    );
};

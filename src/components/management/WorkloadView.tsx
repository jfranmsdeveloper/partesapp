import { useAppStore } from '../../store/useAppStore';
import { Card } from '../ui/Card';
import { Users, Clock, AlertCircle, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface WorkloadViewProps {
    partes: any[];
}

export const WorkloadView = ({ partes }: WorkloadViewProps) => {
    const { users } = useAppStore();

    const userWorkload = users.map(user => {
        const userName = user.name || user.email;
        const userPartes = partes.filter(p => p.createdBy === userName);
        const open = userPartes.filter(p => p.status === 'ABIERTO').length;
        const inProgress = userPartes.filter(p => p.status === 'EN TRÁMITE').length;
        const closed = userPartes.filter(p => p.status === 'CERRADO').length;
        
        const total = userPartes.length;
        const efficiency = total > 0 ? Math.round((closed / total) * 100) : 0;
        
        return {
            name: userName,
            open,
            inProgress,
            closed,
            total,
            efficiency
        };
    }).sort((a, b) => b.total - a.total);

    return (
        <div className="space-y-8 pb-12">
            {/* High Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Partes', value: partes.length, color: 'blue', icon: BarChart3 },
                    { label: 'Abiertos', value: partes.filter(p => p.status === 'ABIERTO').length, color: 'green', icon: AlertCircle },
                    { label: 'En Trámite', value: partes.filter(p => p.status === 'EN TRÁMITE').length, color: 'orange', icon: Clock },
                    { label: 'Finalizados', value: partes.filter(p => p.status === 'CERRADO').length, color: 'indigo', icon: CheckCircle2 },
                ].map((stat, i) => (
                    <Card key={i} className="p-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/40 dark:border-white/5 rounded-[2rem] shadow-xl relative overflow-hidden group">
                        <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full bg-${stat.color}-500/10 blur-2xl group-hover:scale-150 transition-transform`} />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-600`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">{stat.value}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Individual Workload Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {userWorkload.map((user, idx) => (
                    <motion.div
                        key={user.name}
                        initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <Card className="p-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border-white/40 dark:border-white/5 rounded-[3rem] shadow-2xl group hover:shadow-blue-500/5 transition-all">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl flex items-center justify-center text-white">
                                        <Users className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{user.name}</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{user.total} Partes asignados</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-1.5 text-blue-600 mb-1">
                                        <TrendingUp className="w-4 h-4" />
                                        <span className="text-lg font-black">{user.efficiency}%</span>
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Efectividad</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Visual Progress Bar */}
                                <div className="h-4 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden flex shadow-inner border border-white/40 dark:border-white/5">
                                    <div 
                                        className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" 
                                        style={{ width: `${(user.closed / (user.total || 1)) * 100}%` }} 
                                    />
                                    <div 
                                        className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                                        style={{ width: `${(user.inProgress / (user.total || 1)) * 100}%` }} 
                                    />
                                    <div 
                                        className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" 
                                        style={{ width: `${(user.open / (user.total || 1)) * 100}%` }} 
                                    />
                                </div>

                                {/* Legend with detailed stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { label: 'Abiertos', count: user.open, color: 'orange' },
                                        { label: 'En Trámite', count: user.inProgress, color: 'blue' },
                                        { label: 'Cerrados', count: user.closed, color: 'green' },
                                    ].map((s, i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-2 h-2 rounded-full bg-${s.color}-500 shadow-[0_0_5px_rgba(0,0,0,0.2)]`} />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{s.label}</span>
                                            </div>
                                            <p className="text-xl font-black text-slate-800 dark:text-white pl-3.5">{s.count}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

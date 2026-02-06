import { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Search, Clock, User as UserIcon, ChevronRight, ChevronDown, ArrowLeft, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx } from 'clsx';
import { ActuacionesList } from '../../components/actuaciones/ActuacionesList';

export default function GlobalSearch() {
    const { partes, users } = useAppStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
    const [expandedParteId, setExpandedParteId] = useState<number | null>(null);

    // --- Search Logic ---
    const searchResults = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const term = searchTerm.toLowerCase();

        // Filter by user first if one is selected
        const sourcePartes = selectedWorkerId
            ? partes.filter(p => p.userId === selectedWorkerId)
            : partes;

        return sourcePartes.map(parte => {
            const titleMatch = parte.title.toLowerCase().includes(term);
            const idMatch = parte.id.toString().includes(term);
            const creatorMatch = parte.createdBy.toLowerCase().includes(term);
            const matchingActuaciones = parte.actuaciones.filter(act =>
                (act.notes?.toLowerCase() || '').includes(term) ||
                act.type.toLowerCase().includes(term) ||
                act.user.toLowerCase().includes(term)
            );

            if (titleMatch || idMatch || creatorMatch || matchingActuaciones.length > 0) {
                return { parte, matchingActuaciones };
            }
            return null;
        }).filter(item => item !== null) as { parte: any, matchingActuaciones: any[] }[];
    }, [partes, searchTerm, selectedWorkerId]);

    // --- Worker Aggregation ---
    const workers = useMemo(() => {
        // Map over ALL registered users
        return users.map(user => {
            // Find partes created by this user
            // We use user.email to match userId (legacy data might need handling, but moving forward it's email)
            const userPartes = partes.filter(p => p.userId === user.email);

            const totalTime = userPartes.reduce((acc, p) => acc + p.totalTime, 0);
            const closedPartes = userPartes.filter(p => p.status === 'CERRADO').length;

            return {
                email: user.email,
                // Make sure we have a name to display
                name: user.name || user.email.split('@')[0],
                totalPartes: userPartes.length,
                totalTime,
                closedPartes
            };
        });
    }, [partes, users]);

    // --- Selected Worker Data ---
    const selectedWorkerPartes = useMemo(() => {
        if (!selectedWorkerId) return [];
        return partes.filter(p => p.userId === selectedWorkerId).sort((a, b) => b.id - a.id);
    }, [partes, selectedWorkerId]);

    const activeView = searchTerm ? 'search' : selectedWorkerId ? 'detail' : 'grid';

    return (
        <div className="space-y-8">
            {/* Header & Search */}
            <div className="flex flex-col gap-6 items-center text-center">
                <div className="space-y-2">
                    <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white flex items-center justify-center gap-3">
                        <div className="p-3 bg-brand-gradient rounded-2xl shadow-lg shadow-orange-500/20 text-white">
                            <Search className="w-6 h-6" />
                        </div>
                        Explorador Global
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                        {activeView === 'grid' && "Selecciona un trabajador para ver sus estadísticas y partes."}
                        {activeView === 'detail' && "Visualizando el historial detallado del trabajador."}
                        {activeView === 'search' && "Resultados de búsqueda en tiempo real."}
                    </p>
                </div>

                <div className="relative w-full max-w-2xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por ID, título, notas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm dark:text-slate-100 shadow-xl shadow-slate-200/50 dark:shadow-black/20 text-lg placeholder:text-slate-400 transition-all"
                    />
                </div>

                {/* User Filter Bar - Centered & Grouped */}
                <div className="flex flex-wrap justify-center gap-3 w-full max-w-5xl mx-auto">
                    <button
                        onClick={() => { setSelectedWorkerId(null); setSearchTerm(''); }}
                        className={clsx(
                            "flex items-center gap-2 px-6 py-3 rounded-2xl transition-all duration-300 font-semibold shadow-sm",
                            !selectedWorkerId && !searchTerm
                                ? "bg-brand-gradient text-white scale-105 shadow-orange-500/30"
                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                        )}
                    >
                        <span className="font-medium">Todos</span>
                    </button>

                    {workers.map(worker => (
                        <button
                            key={worker.email}
                            onClick={() => { setSelectedWorkerId(worker.email); setSearchTerm(''); }}
                            className={clsx(
                                "group flex items-center gap-3 pl-2 pr-5 py-2 rounded-2xl transition-all duration-300 shadow-sm border",
                                selectedWorkerId === worker.email
                                    ? "bg-brand-gradient text-white border-transparent scale-105 shadow-orange-500/30"
                                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-500/50 hover:bg-orange-50 dark:hover:bg-slate-700"
                            )}
                        >
                            <div className={clsx(
                                "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shadow-sm transition-transform duration-300",
                                selectedWorkerId === worker.email
                                    ? "bg-white text-orange-600"
                                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-white group-hover:text-orange-500"
                            )}>
                                {worker.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-sm">{worker.name.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* View: SEARCH RESULTS */}
            {activeView === 'search' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {searchResults.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 border-dashed">
                            No se encontraron resultados para "{searchTerm}"
                        </div>
                    )}
                    {searchResults.map(({ parte, matchingActuaciones }) => (
                        <ParteExpandableCard
                            key={parte.id}
                            parte={parte}
                            matches={matchingActuaciones}
                            isExpanded={expandedParteId === parte.id}
                            onToggle={() => setExpandedParteId(expandedParteId === parte.id ? null : parte.id)}
                        />
                    ))}
                </div>
            )}

            {/* View: WORKER GRID */}
            {activeView === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {workers.map(worker => (
                        <Card
                            key={worker.email}
                            className="glass-card cursor-pointer group hover:bg-white dark:hover:bg-slate-800 relative overflow-hidden"
                            onClick={() => setSelectedWorkerId(worker.email)}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative z-10 flex flex-col items-center text-center p-2">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-white dark:from-slate-700 dark:to-slate-800 shadow-inner flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-2xl mb-4 group-hover:scale-110 group-hover:text-orange-500 transition-all duration-300 border border-slate-200 dark:border-slate-600">
                                    {worker.name.charAt(0).toUpperCase()}
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg mb-1">{worker.name.split(' ')[0]}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate w-full mb-4 px-2 py-1 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                                    {worker.email}
                                </p>

                                <div className="grid grid-cols-2 gap-2 w-full text-sm">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                                        <div className="text-slate-400 text-[10px] uppercase font-bold">Partes</div>
                                        <div className="font-bold text-slate-700 dark:text-slate-200">{worker.totalPartes}</div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                                        <div className="text-slate-400 text-[10px] uppercase font-bold">Tiempo</div>
                                        <div className="font-bold text-slate-700 dark:text-slate-200">{worker.totalTime}m</div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* View: WORKER DETAIL (List of Partes) */}
            {activeView === 'detail' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="flex items-center gap-4 p-2 pr-6 bg-white/50 dark:bg-slate-800/50 rounded-full border border-white/60 dark:border-white/10 backdrop-blur-md shadow-sm">
                            <div className="w-14 h-14 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-orange-500/20">
                                {workers.find(w => w.email === selectedWorkerId)?.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
                                    {workers.find(w => w.email === selectedWorkerId)?.name}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {workers.find(w => w.email === selectedWorkerId)?.email}
                                </p>
                            </div>
                        </div>

                        <Button variant="ghost" onClick={() => { setSelectedWorkerId(null); setExpandedParteId(null); }} className="hover:bg-white/50 rounded-full px-6">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver a todos los usuarios
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {selectedWorkerPartes.length === 0 && (
                            <div className="col-span-full text-center py-12 text-slate-400 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                Este trabajador aún no ha creado ningún parte.
                            </div>
                        )}
                        {selectedWorkerPartes.map(parte => (
                            <ParteExpandableCard
                                key={parte.id}
                                parte={parte}
                                isExpanded={expandedParteId === parte.id}
                                onToggle={() => setExpandedParteId(expandedParteId === parte.id ? null : parte.id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Subcomponent for the Expandable Card - Optimized for Grid
function ParteExpandableCard({ parte, matches = [], isExpanded, onToggle }: { parte: any, matches?: any[], isExpanded: boolean, onToggle: () => void }) {
    return (
        <Card className={clsx("transition-all duration-300 relative flex flex-col", isExpanded ? "col-span-full md:col-span-2 lg:col-span-3 ring-2 ring-orange-500 shadow-2xl dark:ring-orange-400 z-10" : "hover:shadow-xl hover:-translate-y-1 h-full")}>
            <div
                className="flex flex-col gap-3 p-1 cursor-pointer flex-1"
                onClick={onToggle}
            >
                <div className="flex justify-between items-start">
                    <Badge variant={parte.status === 'Pendiente' ? 'success' : 'info'} className="text-[10px] px-2 py-0.5">
                        {parte.status}
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-300 bg-slate-100 dark:bg-slate-800 dark:text-slate-600 px-1.5 rounded">
                        #{parte.id}
                    </span>
                </div>

                <div className="flex-1">
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight mb-2 line-clamp-2" title={parte.title}>
                        {parte.title}
                    </h3>
                    <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-orange-400" />
                            {format(new Date(parte.createdAt), 'dd MMM', { locale: es })}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <FileText className="w-3 h-3 text-indigo-400" />
                            {parte.totalActuaciones} act.
                        </span>
                    </div>
                </div>

                {matches.length > 0 && (
                    <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs px-2 py-1 rounded-lg text-center font-medium border border-yellow-100 dark:border-yellow-900/30">
                        {matches.length} coincidencias
                    </div>
                )}
            </div>

            {/* Expanded Details - Rendered nicely inside the expanded card */}
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2 text-sm">
                                <FileText className="w-4 h-4 text-orange-500" /> Actuaciones
                            </h4>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                {parte.actuaciones.length > 0 ? (
                                    <div className="space-y-2">
                                        {parte.actuaciones.map((act: any) => (
                                            <div key={act.id} className="text-sm bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                                    <span>{format(new Date(act.date), 'dd/MM HH:mm')}</span>
                                                    <span className="font-medium text-slate-600 dark:text-slate-300">{act.type}</span>
                                                </div>
                                                <p className="text-slate-700 dark:text-slate-300">{act.notes}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">Sin actuaciones</p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col justify-between">
                            <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl space-y-2 text-sm border border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                    <span className="text-slate-500">Tiempo Total</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{parte.totalTime} min</span>
                                </div>
                                <div className="flex justify-between p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                    <span className="text-slate-500">Estado</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{parte.status}</span>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                                <Link to={`/parte/${parte.id}`} className="w-full">
                                    <Button size="sm" className="w-full bg-brand-gradient hover:opacity-90 transition-opacity">
                                        Ver Completo
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}

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
        <div className="space-y-6">
            {/* Header & Search */}
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Search className="w-6 h-6 text-blue-600" />
                        Explorador Global
                    </h1>
                    <p className="text-slate-500">
                        {activeView === 'grid' && "Selecciona un trabajador para ver sus partes."}
                        {activeView === 'detail' && "Visualizando partes del trabajador."}
                        {activeView === 'search' && (selectedWorkerId ? "Resultados de búsqueda filtrados por usuario." : "Resultados de búsqueda global.")}
                    </p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por ID, título, autor o contenido de notas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 dark:text-slate-100 shadow-sm text-lg placeholder:text-slate-400"
                    />
                </div>

                {/* User Filter Bar */}
                <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar scroll-smooth snap-x">
                    <button
                        onClick={() => { setSelectedWorkerId(null); setSearchTerm(''); }}
                        className={clsx(
                            "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all whitespace-nowrap snap-start",
                            !selectedWorkerId && !searchTerm
                                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30 scale-105"
                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                        )}
                    >
                        <div className={clsx("w-2 h-2 rounded-full", !selectedWorkerId && !searchTerm ? "bg-white" : "bg-slate-300")} />
                        <span className="font-medium">Todos</span>
                    </button>

                    {workers.map(worker => (
                        <button
                            key={worker.email}
                            onClick={() => { setSelectedWorkerId(worker.email); setSearchTerm(''); }}
                            className={clsx(
                                "flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full border transition-all whitespace-nowrap snap-start group",
                                selectedWorkerId === worker.email
                                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30 scale-105"
                                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                            )}
                        >
                            <div className={clsx(
                                "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-transform",
                                selectedWorkerId === worker.email
                                    ? "bg-white text-blue-600"
                                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110"
                            )}>
                                {worker.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col items-start leading-tight">
                                <span className="font-bold text-sm">{worker.name}</span>
                                <span className={clsx("text-[10px]", selectedWorkerId === worker.email ? "text-blue-100" : "text-slate-400")}>
                                    {worker.totalPartes} partes
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* View: SEARCH RESULTS */}
            {activeView === 'search' && (
                <div className="space-y-4">
                    {searchResults.length === 0 && (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 border-dashed">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {workers.map(worker => (
                        <Card
                            key={worker.email}
                            className="glass-card cursor-pointer hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all group"
                            onClick={() => setSelectedWorkerId(worker.email)}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    {worker.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate uppercase">{worker.name}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{worker.email}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><FileText className="w-3 h-3" /> Total Partes</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{worker.totalPartes}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Tiempo Total</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{worker.totalTime} min</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                    <div
                                        className="bg-green-500 h-full rounded-full"
                                        style={{ width: worker.totalPartes > 0 ? `${(worker.closedPartes / worker.totalPartes) * 100}%` : '0%' }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 mt-1">
                                    <span>{worker.closedPartes} cerrados</span>
                                    <span>{worker.totalPartes > 0 ? Math.round((worker.closedPartes / worker.totalPartes) * 100) : 0}% comp.</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {workers.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-400">
                            No hay trabajadores registrados.
                        </div>
                    )}
                </div>
            )}

            {/* View: WORKER DETAIL (List of Partes) */}
            {activeView === 'detail' && (
                <div className="space-y-6">
                    <Button variant="ghost" onClick={() => { setSelectedWorkerId(null); setExpandedParteId(null); }} className="pl-0 hover:bg-transparent hover:text-blue-600 dark:hover:text-blue-400 dark:text-slate-300">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Volver al listado de trabajadores
                    </Button>

                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-sm">
                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                            {workers.find(w => w.email === selectedWorkerId)?.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase">
                                {workers.find(w => w.email === selectedWorkerId)?.name}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {workers.find(w => w.email === selectedWorkerId)?.email}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {selectedWorkerPartes.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
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

// Subcomponent for the Expandable Card
function ParteExpandableCard({ parte, matches = [], isExpanded, onToggle }: { parte: any, matches?: any[], isExpanded: boolean, onToggle: () => void }) {
    return (
        <Card className={clsx("transition-all duration-300 overflow-hidden", isExpanded ? "ring-2 ring-blue-500 shadow-lg dark:ring-blue-400" : "hover:shadow-md")}>
            <div
                className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center cursor-pointer"
                onClick={onToggle}
            >
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                            #{parte.id}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {parte.title}
                        </h3>
                        <Badge variant={parte.status === 'Pendiente' ? 'success' : 'info'}>
                            {parte.status}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(parte.createdAt), 'dd MMM yyyy HH:mm', { locale: es })}
                        </span>
                        <span className="flex items-center gap-1">
                            {parte.totalActuaciones} actuaciones
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {matches.length > 0 && (
                        <Badge variant="warning" className="animate-pulse">
                            {matches.length} coincidencias
                        </Badge>
                    )}
                    <div className={clsx("p-2 rounded-full bg-slate-50 dark:bg-slate-800 transition-transform duration-300", isExpanded ? "rotate-180 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "text-slate-400")}>
                        <ChevronDown className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Matches Preview (if searching) */}
            {!isExpanded && matches.length > 0 && (
                <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg p-3 space-y-2 border border-yellow-100 dark:border-yellow-900/30">
                    <h4 className="text-xs font-semibold text-yellow-700 dark:text-yellow-500 uppercase tracking-wider mb-2">
                        Coincidencias encontradas:
                    </h4>
                    {matches.map((act: any) => (
                        <div key={act.id} className="text-sm border-l-2 border-yellow-400 dark:border-yellow-600 pl-3 py-1">
                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                                <span className="font-medium text-slate-700 dark:text-slate-200">{act.type}</span>
                            </div>
                            <p className="text-slate-800 dark:text-slate-100 line-clamp-1 italic">
                                "{act.notes}"
                            </p>
                        </div>
                    ))}
                    <p className="text-xs text-center text-blue-600 dark:text-blue-400 font-medium mt-2">Pulsa para ver detalles completos</p>
                </div>
            )}

            {/* Expanded Details */}
            {isExpanded && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 animate-in slide-in-from-top-4 duration-300">
                    <div className="mb-4 flex flex-wrap gap-4 text-sm bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            <span>Creado por: <strong>{parte.createdBy}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Tiempo Total: <strong>{parte.totalTime} min</strong></span>
                        </div>
                    </div>

                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Actuaciones Registradas
                    </h4>

                    {parte.actuaciones.length > 0 ? (
                        <ActuacionesList
                            actuaciones={parte.actuaciones}
                            // Read-only view
                            onEdit={() => { }}
                            onDelete={() => { }}
                            readOnly={true}
                        />
                    ) : (
                        <p className="text-slate-500 dark:text-slate-400 italic py-4 text-center">No hay actuaciones registradas en este parte.</p>
                    )}

                    <div className="mt-6 flex justify-end">
                        <Link to={`/parte/${parte.id}`}>
                            <Button size="sm" variant="outline">
                                Abrir Editor Completo
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </Card>
    );
}

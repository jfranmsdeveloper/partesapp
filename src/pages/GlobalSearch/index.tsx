import { useState, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Search, Clock, ChevronRight, ArrowLeft, FileText, Calendar, User, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx } from 'clsx';

export default function GlobalSearch() {
    const { partes, users } = useAppStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);


    // --- Search Logic ---
    const searchResults = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const term = searchTerm.toLowerCase();

        // Filter by issuer (createdBy) first if one is selected
        // Note: selectedWorkerId here refers to the user.id or user.name depending on how we map it. 
        // Let's assume selectedWorkerId is the User Name for filtering partes directly.

        let sourcePartes = partes;

        if (selectedWorkerId) {
            const workerName = users.find(u => u.id === selectedWorkerId)?.user_metadata?.full_name
                || users.find(u => u.id === selectedWorkerId)?.name
                || users.find(u => u.id === selectedWorkerId)?.email;

            if (workerName) {
                sourcePartes = partes.filter(p => p.createdBy === workerName);
            }
        }

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
    }, [partes, searchTerm, selectedWorkerId, users]);

    // --- Issuer Aggregation (Strictly Registered Users) ---
    const workers = useMemo(() => {
        // Map from the REGISTERED USERS list
        return users.map(user => {
            const userName = user.user_metadata?.full_name || user.name || user.email;

            // Find partes created by this user
            const userPartes = partes.filter(p => p.createdBy === userName);

            const totalTime = userPartes.reduce((acc, p) => acc + p.totalTime, 0);
            const closedPartes = userPartes.filter(p => p.status === 'CERRADO').length;

            return {
                id: user.id, // Use the real User ID for selection state
                filterName: userName,
                email: user.email,
                name: userName, // Display name
                avatar: user.avatar_url,
                totalPartes: userPartes.length,
                totalTime,
                closedPartes
            };
        }).sort((a, b) => b.totalPartes - a.totalPartes); // Sort by activity
    }, [partes, users]);

    // --- Selected Issuer Data ---
    const selectedWorkerPartes = useMemo(() => {
        if (!selectedWorkerId) return [];

        const workerName = workers.find(w => w.id === selectedWorkerId)?.name;
        if (!workerName) return [];

        return partes.filter(p => p.createdBy === workerName).sort((a, b) => b.id - a.id);
    }, [partes, selectedWorkerId, workers]);

    const activeView = searchTerm ? 'search' : selectedWorkerId ? 'detail' : 'grid';

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto">
            {/* Header & Search */}
            <div className="flex flex-col gap-8 items-center text-center pb-8 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-4">
                    <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white flex items-center justify-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-slate-800 dark:to-slate-700/50 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700 text-orange-500">
                            <Search className="w-8 h-8" />
                        </div>
                        Explorador Global
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        {activeView === 'grid' && "Selecciona un técnico para auditar su actividad y gestionar sus partes de trabajo."}
                        {activeView === 'detail' && "Visualizando el historial completo y detallado."}
                        {activeView === 'search' && "Búsqueda global en todos los registros."}
                    </p>
                </div>

                <div className="relative w-full max-w-3xl transform transition-all focus-within:scale-105 duration-300">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por ID, título, contenido o técnico..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-16 pr-6 py-5 rounded-full border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 bg-white dark:bg-slate-900/80 shadow-2xl shadow-slate-200/50 dark:shadow-black/40 text-xl placeholder:text-slate-400 transition-all font-medium"
                    />
                </div>

                {/* Issuer Filter Bar */}
                <div className="flex flex-wrap justify-center gap-4 w-full px-4">
                    <button
                        onClick={() => { setSelectedWorkerId(null); setSearchTerm(''); }}
                        className={clsx(
                            "flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 font-semibold shadow-sm border",
                            !selectedWorkerId && !searchTerm
                                ? "bg-orange-500 text-white border-orange-600 shadow-orange-500/20 scale-105"
                                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                        )}
                    >
                        <span>Todos</span>
                    </button>

                    {workers.map(worker => (
                        <button
                            key={worker.id}
                            onClick={() => { setSelectedWorkerId(worker.id || ''); setSearchTerm(''); }}
                            className={clsx(
                                "group flex items-center gap-3 pl-2 pr-4 py-2 rounded-full transition-all duration-300 shadow-sm border",
                                selectedWorkerId === worker.id
                                    ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-500/30 ring-2 ring-orange-500/20"
                                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-orange-300 hover:bg-orange-50/30"
                            )}
                        >
                            <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white dark:ring-slate-700 shadow-sm">
                                {worker.avatar ? (
                                    <img src={worker.avatar} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">
                                        {worker.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <span className="font-semibold text-sm">{worker.name.split(' ')[0]}</span>
                            {worker.totalPartes > 0 && (
                                <span className={clsx("text-xs px-2 py-0.5 rounded-full font-bold ml-1",
                                    selectedWorkerId === worker.id ? "bg-orange-200 text-orange-800" : "bg-slate-100 text-slate-500")}>
                                    {worker.totalPartes}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* View: SEARCH RESULTS (List Mode) */}
            {activeView === 'search' && (
                <div className="space-y-4">
                    {searchResults.length === 0 && (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 mx-auto rounded-full flex items-center justify-center">
                                <Search className="w-10 h-10 text-slate-300" />
                            </div>
                            <p className="text-xl text-slate-500 font-medium">No se encontraron resultados para "{searchTerm}"</p>
                        </div>
                    )}
                    {searchResults.map(({ parte, matchingActuaciones }) => (
                        <ParteRow
                            key={parte.id}
                            parte={parte}
                            matches={matchingActuaciones}
                        />
                    ))}
                </div>
            )}

            {/* View: WORKER LIST (Formerly Grid) */}
            {activeView === 'grid' && (
                <div className="space-y-4 max-w-5xl mx-auto">
                    {workers.map(worker => (
                        <Card
                            key={worker.id}
                            className="group relative cursor-pointer hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-800 overflow-visible hover:border-orange-500/50"
                            onClick={() => setSelectedWorkerId(worker.id || '')}
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 dark:bg-slate-700 group-hover:bg-orange-500 transition-colors rounded-l-2xl" />

                            <div className="flex flex-col md:flex-row items-center p-6 gap-6">
                                {/* Avatar Section */}
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-2xl p-1 bg-white dark:bg-slate-800 shadow-md ring-1 ring-slate-100 dark:ring-slate-700 overflow-hidden">
                                        {worker.avatar ? (
                                            <img src={worker.avatar} className="w-full h-full object-cover rounded-xl" alt="" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-400">
                                                {worker.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-500">
                                        ID: {worker.id?.slice(0, 4)}...
                                    </div>
                                </div>

                                {/* Main Info */}
                                <div className="flex-1 text-center md:text-left space-y-2">
                                    <div>
                                        <h3 className="font-bold text-2xl text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors">
                                            {worker.name}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2">
                                            <User className="w-4 h-4" />
                                            {worker.email}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                        <Badge variant="neutral" className="bg-slate-100 dark:bg-slate-800 text-slate-600 font-normal">
                                            Técnico Certificado
                                        </Badge>
                                        <Badge variant="neutral" className="bg-slate-100 dark:bg-slate-800 text-slate-600 font-normal">
                                            Activo
                                        </Badge>
                                    </div>
                                </div>

                                {/* Stats Grid - Detailed Information */}
                                <div className="grid grid-cols-3 gap-6 w-full md:w-auto bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="text-center space-y-1">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Partes</div>
                                        <div className="text-2xl font-black text-slate-800 dark:text-white space-grotesk">{worker.totalPartes}</div>
                                        <div className="text-[10px] text-green-600 font-bold bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full inline-block">
                                            +100%
                                        </div>
                                    </div>
                                    <div className="text-center space-y-1 border-x border-slate-200 dark:border-slate-700 px-6">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiempo</div>
                                        <div className="text-2xl font-black text-slate-800 dark:text-white space-grotesk">{worker.totalTime}<span className="text-xs ml-0.5 font-bold text-slate-400">m</span></div>
                                        <div className="text-[10px] text-slate-400 font-medium">
                                            Total
                                        </div>
                                    </div>
                                    <div className="text-center space-y-1">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cerrados</div>
                                        <div className="text-2xl font-black text-slate-800 dark:text-white space-grotesk">{worker.closedPartes}</div>
                                        <div className="text-[10px] text-orange-600 font-bold bg-orange-100 dark:bg-orange-900/30 px-1.5 py-0.5 rounded-full inline-block">
                                            {worker.totalPartes > 0 ? Math.round((worker.closedPartes / worker.totalPartes) * 100) : 0}%
                                        </div>
                                    </div>
                                </div>

                                {/* Arrow Indicator */}
                                <div className="hidden md:flex items-center justify-center w-12 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all">
                                    <ChevronRight className="w-8 h-8" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* View: ISSUER DETAIL (New List Logic) */}
            {activeView === 'detail' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-8 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg ring-4 ring-orange-50 dark:ring-slate-700">
                                {workers.find(w => w.id === selectedWorkerId)?.avatar ? (
                                    <img src={workers.find(w => w.id === selectedWorkerId)?.avatar} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full bg-slate-200 grid place-items-center text-2xl font-bold text-slate-500">
                                        {workers.find(w => w.id === selectedWorkerId)?.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                    {workers.find(w => w.id === selectedWorkerId)?.name}
                                </h2>
                                <div className="flex gap-4 text-sm font-medium">
                                    <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                        {workers.find(w => w.id === selectedWorkerId)?.email}
                                    </span>
                                    <span className="px-3 py-1 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                                        {selectedWorkerPartes.length} partes totales
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Button variant="outline" onClick={() => { setSelectedWorkerId(null); }} className="rounded-xl border-slate-300">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {selectedWorkerPartes.length === 0 && (
                            <div className="text-center py-20 text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                                <p className="text-lg">Este técnico no tiene actividad registrada.</p>
                            </div>
                        )}
                        {selectedWorkerPartes.map(parte => (
                            <ParteRow
                                key={parte.id}
                                parte={parte}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Rewritten ParteRow Component for List View
function ParteRow({ parte, matches = [] }: { parte: any, matches?: any[] }) {
    return (
        <Link to={`/parte/${parte.id}`} className="block">
            <Card className="transition-all duration-300 overflow-hidden border border-white/50 dark:border-white/5 hover:border-orange-300 dark:hover:border-slate-600 hover:shadow-lg group">
                {/* Top Row: Summary View */}
                <div
                    className="p-5 grid grid-cols-12 gap-4 items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                    {/* 1. ID & Status (Col 1-2) */}
                    <div className="col-span-12 md:col-span-2 flex items-center md:flex-col md:items-start gap-2">
                        <span className="font-mono font-bold text-slate-500 text-xs">#{parte.id}</span>
                        <Badge variant={parte.status === 'CERRADO' ? 'success' : parte.status === 'EN TRÁMITE' ? 'info' : 'warning'} className="text-[10px] px-2.5 py-1 shadow-sm">
                            {parte.status}
                        </Badge>
                    </div>

                    {/* 2. Main content (Title & Description) (Col 3-7) */}
                    <div className="col-span-12 md:col-span-10 lg:col-span-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 leading-snug group-hover:text-orange-600 transition-colors">
                            {parte.title}
                        </h3>
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700">
                                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                                {format(new Date(parte.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                            </span>
                            <span className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700">
                                <Clock className="w-3.5 h-3.5 text-blue-400" />
                                {format(new Date(parte.createdAt), "HH:mm")}
                            </span>
                            {matches.length > 0 && (
                                <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded-md animate-pulse">
                                    {matches.length} coincidencias encontradas
                                </span>
                            )}
                        </div>
                    </div>

                    {/* 3. Stats & User (Col 8-11) */}
                    <div className="col-span-6 lg:col-span-3 flex items-center gap-6 justify-end border-l border-slate-100 dark:border-slate-700/50 pl-4">
                        <div className="text-center">
                            <div className="text-xs font-bold text-slate-400 uppercase">Actuaciones</div>
                            <div className="text-xl font-bold text-slate-700 dark:text-slate-200">{parte.totalActuaciones}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs font-bold text-slate-400 uppercase">Tiempo</div>
                            <div className="text-xl font-bold text-slate-700 dark:text-slate-200">{parte.totalTime}'</div>
                        </div>
                    </div>

                    {/* 4. Navigate Icon (Col 12) */}
                    <div className="col-span-6 lg:col-span-1 flex justify-end">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 text-slate-400 shadow-sm border border-slate-100 group-hover:bg-orange-500 group-hover:text-white transition-all">
                            <ArrowUpRight className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
}

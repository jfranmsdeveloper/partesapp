import { LayoutDashboard, FileText, PlusCircle, LogOut, Search, Moon, Sun, Users, TrendingUp, Calendar } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import clsx from 'clsx';
import logoUrl from '../../assets/logo.png';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';

const API_NAV_ITEMS = [
    { label: 'Indicadores', icon: LayoutDashboard, to: '/', adminOnly: false },
    { label: 'Analíticas', icon: TrendingUp, to: '/analytics', adminOnly: false },
    { label: 'Calendario', icon: Calendar, to: '/calendar', adminOnly: false },
    { label: 'Gestión de Partes', icon: FileText, to: '/management', adminOnly: false },
    { label: 'Generar Parte', icon: PlusCircle, to: '/new', adminOnly: false },
    { label: 'Explorador Global', icon: Search, to: '/global', adminOnly: false },
    { label: 'Usuarios', icon: Users, to: '/users', adminOnly: true },
];

export const Sidebar = () => {
    const { currentUser, logoutUser } = useAppStore();
    const { theme, toggleTheme } = useTheme();

    return (
        <aside
            className="fixed top-6 bottom-6 left-6 w-64 max-lg:w-56 bg-white/50 dark:bg-slate-950/40 backdrop-blur-3xl border border-white/30 dark:border-white/5 rounded-[2.5rem] z-40 flex flex-col overflow-hidden shadow-[0_24px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_32px_64px_-15px_rgba(0,0,0,0.6)]"
        >
            <div className="flex h-24 items-center px-8 max-lg:px-6 border-b border-white/20 dark:border-white/5 bg-transparent">
                <Link to="/" className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                        <img
                            src={logoUrl}
                            alt="PartesApp Logo"
                            className="relative h-10 w-auto object-contain drop-shadow-sm"
                        />
                    </div>
                    <span className="font-display font-extrabold text-xl tracking-tight text-slate-800 dark:text-slate-100 truncate">
                        App<span className="text-orange-550">Gest</span>
                    </span>
                </Link>
            </div>

            <nav className="p-4 max-lg:p-3 space-y-1 mt-2 flex-1 overflow-y-auto no-scrollbar">
                {API_NAV_ITEMS.filter(item => !item.adminOnly || true).map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            clsx(
                                'flex items-center gap-3 rounded-2xl px-5 py-3.5 max-lg:px-4 max-lg:py-3 text-sm font-medium transition-all duration-200 group relative',
                                {
                                    'text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-500/20 backdrop-blur-md': isActive,
                                    'text-slate-700 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100': !isActive,
                                }
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={clsx("h-5 w-5 shrink-0 transition-transform duration-300", { "text-orange-500": isActive, "text-slate-500 group-hover:scale-110 group-hover:text-orange-400": !isActive })} />
                                <span className="relative z-10">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 max-lg:p-3 bg-transparent border-t border-white/20 dark:border-white/5 mt-auto">
                <div className="flex justify-center mb-6 w-full px-4 max-lg:px-2">
                    <button
                        onClick={toggleTheme}
                        className={clsx(
                            "relative flex h-10 w-full items-center justify-between rounded-full bg-white/30 dark:bg-slate-950/20 p-1 ring-1 ring-white/20 dark:ring-white/5 transition-colors duration-200",
                        )}
                    >
                        <div className="absolute inset-0 flex w-full items-center justify-between px-4 pointer-events-none">
                            <span className={clsx("transition-opacity duration-300", theme === 'light' ? 'opacity-0' : 'opacity-100')}>
                                <Sun className="h-4 w-4 text-slate-500" />
                            </span>
                            <span className={clsx("transition-opacity duration-300", theme === 'dark' ? 'opacity-0' : 'opacity-100')}>
                                <Moon className="h-4 w-4 text-slate-450" />
                            </span>
                        </div>

                        <div
                            className={clsx(
                                "relative z-10 flex h-8 w-1/2 items-center justify-center rounded-full bg-white/80 dark:bg-slate-900/60 shadow-sm ring-1 ring-black/5 dark:ring-white/5 transition-transform duration-300 ease-out",
                                theme === 'dark' ? "translate-x-[95%]" : "translate-x-0"
                            )}
                        >
                            {theme === 'light' ? (
                                <Sun className="h-4 w-4 text-orange-500" />
                            ) : (
                                <Moon className="h-4 w-4 text-orange-400" />
                            )}
                        </div>
                    </button>
                </div>

                <div
                    onClick={() => {
                        window.location.href = '/profile';
                    }}
                    className="group flex items-center gap-3 p-3 rounded-2xl bg-white/40 dark:bg-slate-900/15 border border-white/20 dark:border-white/5 hover:border-orange-400/50 dark:hover:border-orange-500/30 transition-colors duration-200 cursor-pointer mb-3 shadow-sm"
                >
                    {currentUser?.avatar_url ? (
                        <img
                            src={currentUser.avatar_url}
                            alt="Profile"
                            className="w-10 h-10 rounded-[0.8rem] object-cover shrink-0"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-[0.8rem] bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 text-sm font-semibold shrink-0">
                            {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white/90 truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                            {currentUser?.name || 'Usuario'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate opacity-80">
                            {currentUser?.email}
                        </p>
                    </div>
                </div>

                <button
                    onClick={logoutUser}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-500/10 dark:hover:bg-red-950/20 transition-all duration-300"
                >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};

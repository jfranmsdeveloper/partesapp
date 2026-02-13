import { LayoutDashboard, FileText, PlusCircle, LogOut, Search, Moon, Sun, X, Users } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import clsx from 'clsx';
import logoUrl from '../../assets/logo.png';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../hooks/useTheme';

const API_NAV_ITEMS = [
    { label: 'Panel de Control', icon: LayoutDashboard, to: '/', adminOnly: false },
    { label: 'Gestión de Partes', icon: FileText, to: '/management', adminOnly: false },
    { label: 'Nuevo Parte', icon: PlusCircle, to: '/new', adminOnly: false },
    { label: 'Explorador Global', icon: Search, to: '/global', adminOnly: false },
    { label: 'Usuarios', icon: Users, to: '/users', adminOnly: true },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const { currentUser, logoutUser } = useAppStore();
    const { theme, toggleTheme } = useTheme();

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden transition-opacity"
                    onClick={onClose}
                />
            )}

            <aside
                className={clsx(
                    "fixed top-4 bottom-4 left-4 w-64 glass-panel rounded-[2rem] border border-white/40 dark:border-white/5 z-40 transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) flex flex-col overflow-hidden",
                    {
                        "translate-x-0": isOpen,
                        "-translate-x-[110%]": !isOpen,
                        "md:translate-x-0": true // Always visible on desktop
                    }
                )}
            >
                <div className="flex h-24 items-center justify-between px-8 border-b border-white/10 dark:border-white/5 bg-white/20 dark:bg-white/5">
                    <Link to="/" className="flex items-center gap-3" onClick={onClose}>
                        <div className="relative">
                            <img
                                src={logoUrl}
                                alt="PartesApp Logo"
                                className="relative h-10 w-auto object-contain drop-shadow-sm"
                            />
                        </div>
                        <span className="font-display font-extrabold text-xl tracking-tight text-slate-800 dark:text-slate-100">
                            App<span className="text-orange-500">Gest</span>
                        </span>
                    </Link>
                    <button onClick={onClose} className="md:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <nav className="p-4 space-y-1 mt-2 flex-1 overflow-y-auto no-scrollbar">
                    {API_NAV_ITEMS.filter(item => !item.adminOnly || true).map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={onClose}
                            className={({ isActive }) =>
                                clsx(
                                    'flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all duration-300 group relative',
                                    {
                                        'text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-500/10 ring-1 ring-orange-200 dark:ring-orange-500/20 shadow-sm': isActive,
                                        'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200': !isActive,
                                    }
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={clsx("h-5 w-5 transition-transform duration-300", { "text-orange-500": isActive, "text-slate-400 group-hover:scale-110 group-hover:text-orange-400": !isActive })} />
                                    <span className="relative z-10">{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 bg-gradient-to-t from-white/40 to-transparent dark:from-black/20">
                    <div className="flex justify-center mb-6 w-full px-4">
                        <button
                            onClick={toggleTheme}
                            className={clsx(
                                "relative flex h-10 w-full items-center justify-between rounded-full bg-slate-200/50 dark:bg-slate-800/50 p-1 shadow-inner ring-1 ring-black/5 dark:ring-white/5 transition-all duration-300 hover:bg-slate-200 dark:hover:bg-slate-800",
                            )}
                        >
                            <div className="absolute inset-0 flex w-full items-center justify-between px-4 pointer-events-none">
                                <span className={clsx("transition-opacity duration-300", theme === 'light' ? 'opacity-0' : 'opacity-100')}>
                                    <Sun className="h-4 w-4 text-slate-500" />
                                </span>
                                <span className={clsx("transition-opacity duration-300", theme === 'dark' ? 'opacity-0' : 'opacity-100')}>
                                    <Moon className="h-4 w-4 text-slate-400" />
                                </span>
                            </div>

                            <div
                                className={clsx(
                                    "relative z-10 flex h-8 w-1/2 items-center justify-center rounded-full bg-white dark:bg-slate-600 shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-transform duration-500 ease-out",
                                    theme === 'dark' ? "translate-x-[95%]" : "translate-x-0"
                                )}
                            >
                                {theme === 'light' ? (
                                    <Sun className="h-4 w-4 text-orange-500 fill-orange-500/20" />
                                ) : (
                                    <Moon className="h-4 w-4 text-orange-300 fill-orange-300/20" />
                                )}
                            </div>
                        </button>
                    </div>

                    <div
                        onClick={() => {
                            window.location.href = '/profile';
                            onClose();
                        }}
                        className="group flex items-center gap-3 p-3 rounded-[1.2rem] bg-white/60 dark:bg-slate-800/40 border border-white/50 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer mb-3"
                    >
                        {currentUser?.avatar_url ? (
                            <img
                                src={currentUser.avatar_url}
                                alt="Profile"
                                className="w-10 h-10 rounded-xl object-cover shadow-sm ring-2 ring-white dark:ring-slate-700 group-hover:scale-105 transition-transform"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 text-sm font-bold shadow-sm ring-2 ring-white dark:ring-slate-700 group-hover:scale-105 transition-transform">
                                {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                {currentUser?.name || 'Usuario'}
                            </p>
                            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                                {currentUser?.email}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={logoutUser}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

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
                    "fixed top-0 bottom-0 left-0 w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-white/20 shadow-2xl z-40 transition-transform duration-300 ease-in-out flex flex-col",
                    {
                        "translate-x-0": isOpen,
                        "-translate-x-full": !isOpen,
                        "md:translate-x-0": true // Always visible on desktop
                    }
                )}
            >
                <div className="flex h-20 items-center justify-between px-6 border-b border-white/10 dark:border-white/5 bg-white/40 dark:bg-slate-900/40">
                    <Link to="/" className="flex items-center gap-2" onClick={onClose}>
                        <img
                            src={logoUrl}
                            alt="PartesApp Logo"
                            className="h-10 w-auto object-contain mix-blend-multiply dark:mix-blend-screen"
                        />
                        <span className="font-display font-bold text-lg tracking-tight text-slate-800 dark:text-slate-100">PartesApp</span>
                    </Link>
                    <button onClick={onClose} className="md:hidden p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <nav className="p-4 space-y-2 mt-2 flex-1 overflow-y-auto custom-scrollbar">
                    {API_NAV_ITEMS.filter(item => !item.adminOnly || true).map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={onClose}
                            className={({ isActive }) =>
                                clsx(
                                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group relative',
                                    {
                                        'bg-orange-600/10 text-orange-700 dark:text-orange-300': isActive,
                                        'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200': !isActive,
                                    }
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={clsx("h-5 w-5 transition-transform duration-200", { "text-orange-600 dark:text-orange-400": isActive, "group-hover:scale-110": !isActive })} />
                                    <span>{item.label}</span>
                                    {isActive && <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-orange-500" />}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
                    <button
                        onClick={toggleTheme}
                        className="flex w-full items-center justify-between px-4 py-2.5 mb-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-medium text-slate-600 dark:text-slate-300"
                    >
                        <span className="flex items-center gap-2">
                            {theme === 'light' ? <Sun className="h-4 w-4 text-orange-500" /> : <Moon className="h-4 w-4 text-purple-400" />}
                            Tema {theme === 'light' ? 'Claro' : 'Oscuro'}
                        </span>
                    </button>

                    <div
                        onClick={() => {
                            window.location.href = '/profile';
                            onClose();
                        }}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/60 dark:hover:bg-white/5 cursor-pointer transition-colors mb-2"
                    >
                        {currentUser?.avatar_url ? (
                            <img
                                src={currentUser.avatar_url}
                                alt="Profile"
                                className="w-8 h-8 rounded-full object-cover shadow-md ring-2 ring-white dark:ring-slate-800"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-white dark:ring-slate-800">
                                {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {currentUser?.name || 'Usuario'}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {currentUser?.email}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={logoutUser}
                        className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 transition-colors"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        Salir
                    </button>
                </div>
            </aside>
        </>
    );
};

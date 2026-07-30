/* UI Version: 12:30 Baseline */
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { CommandPalette } from '../ui/CommandPalette';
import { ToastContainer } from '../ui/Toast';
import { useAppStore } from '../../store/useAppStore';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import clsx from 'clsx';

export const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { isCommandPaletteOpen, setCommandPaletteOpen } = useAppStore();

    // From 1280px the sidebar stays pinned; below that it behaves as a drawer.
    const isPinned = useMediaQuery('(min-width: 1280px)');
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === '1');

    const toggleCollapse = () => {
        setIsCollapsed(prev => {
            localStorage.setItem('sidebarCollapsed', prev ? '0' : '1');
            return !prev;
        });
    };

    // Auto-check AI availability deleted

    // Global shortcut for Command Palette
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(!isCommandPaletteOpen);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCommandPaletteOpen, setCommandPaletteOpen]);

    return (
        <div className="min-h-screen transition-colors duration-300 bg-transparent">
            {/* Floating Apple-like Menu Trigger (only when the sidebar is hidden) */}
            {!isPinned && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="fixed top-6 left-6 z-30 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] hover:scale-105 active:scale-95 text-slate-700 dark:text-slate-200 transition-all duration-300 ease-out cursor-pointer flex items-center justify-center group"
                    title="Abrir menú"
                >
                    <Menu className="w-5 h-5 group-hover:rotate-6 transition-transform" />
                </button>
            )}

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isPinned={isPinned}
                isCollapsed={isCollapsed}
                onToggleCollapse={toggleCollapse}
            />

            <CommandPalette 
                isOpen={isCommandPaletteOpen} 
                onClose={() => setCommandPaletteOpen(false)} 
            />

            <main className="transition-all duration-300 ease-in-out">
                {/* Leave room for the pinned sidebar, or for the floating menu button */}
                <div className={clsx(
                    "mx-auto w-full max-w-[1600px] pt-10 pb-20 md:pb-8 pr-4 sm:pr-6 md:pr-8 transition-all duration-500",
                    isPinned
                        ? (isCollapsed ? "pl-[8.5rem]" : "pl-[19rem]")
                        : "pt-24 pl-20 sm:pl-24 md:pl-28"
                )}>
                    <Outlet />
                </div>
            </main>
            
            <ToastContainer />
        </div>
    );
};

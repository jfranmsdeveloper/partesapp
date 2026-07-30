/* UI Version: 12:30 Baseline */
import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { CommandPalette } from '../ui/CommandPalette';
import { ToastContainer } from '../ui/Toast';
import { useAppStore } from '../../store/useAppStore';
import clsx from 'clsx';

export const Layout = () => {
    const location = useLocation();
    const isCanvas = location.pathname.startsWith('/canvas');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { isCommandPaletteOpen, setCommandPaletteOpen } = useAppStore();

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
            {/* Floating Apple-like Menu Trigger */}
            <button
                onClick={() => setIsSidebarOpen(true)}
                className="fixed top-6 left-6 z-30 p-3 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-slate-800/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] hover:scale-105 active:scale-95 text-slate-700 dark:text-slate-200 transition-all duration-300 ease-out cursor-pointer flex items-center justify-center group"
                title="Abrir menú"
            >
                <Menu className="w-5 h-5 group-hover:rotate-6 transition-transform" />
            </button>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <CommandPalette 
                isOpen={isCommandPaletteOpen} 
                onClose={() => setCommandPaletteOpen(false)} 
            />

            <main className="transition-all duration-300 ease-in-out">
                {/* Adjust layout padding to make space for the floating menu button */}
                <div className={clsx(
                    "mx-auto w-full transition-all duration-300",
                    isCanvas 
                        ? "max-w-none p-0 h-screen overflow-hidden" 
                        : "max-w-[1400px] pt-24 pb-20 md:pb-8 px-4 sm:px-6 md:px-8 pl-20 sm:pl-24 md:pl-28"
                )}>
                    <Outlet />
                </div>
            </main>
            
            <ToastContainer />
        </div>
    );
};

import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { CommandPalette } from '../ui/CommandPalette';

export const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

    // Global shortcut for Command Palette
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="min-h-screen transition-colors duration-300 bg-[#F4F4F5] dark:bg-dark-bg">
            {/* Mobile Header */}
            <div className="md:hidden sticky top-0 z-20 bg-white/90 dark:bg-dark-card/90 backdrop-blur-md border-b border-slate-200 dark:border-dark-border px-4 py-3 flex items-center justify-between">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-surface text-slate-600 dark:text-slate-300 transition-colors"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <span className="font-display font-bold text-lg text-slate-800 dark:text-slate-100">PartesApp</span>
                <div className="w-8" /> {/* Spacer for balance */}
            </div>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <CommandPalette 
                isOpen={isCommandPaletteOpen} 
                onClose={() => setIsCommandPaletteOpen(false)} 
            />

            <main className="md:pl-64 transition-all duration-300 ease-in-out">
                {/* On mobile, remove huge padding to max-width to use full screen real estate */}
                <div className="mx-auto w-full max-w-[1400px] p-4 md:p-6 pb-24 md:pb-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

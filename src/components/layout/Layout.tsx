import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { CommandPalette } from '../ui/CommandPalette';
import { ToastContainer } from '../ui/Toast';
import { useAppStore } from '../../store/useAppStore';
import { useNotesStore } from '../../store/useNotesStore';
import { DailyNotesPanel } from './DailyNotesPanel';
import { StickyNote } from 'lucide-react';

export const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { isCommandPaletteOpen, setCommandPaletteOpen } = useAppStore();
    const { toggleNotes } = useNotesStore();

    // Auto-check AI availability deleted

    // Global shortcut for Command Palette
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(!isCommandPaletteOpen);
            }
            if (e.altKey && e.key.toLowerCase() === 's') {
                e.preventDefault();
                toggleNotes();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCommandPaletteOpen, setCommandPaletteOpen]);

    return (
        <div className="min-h-screen transition-colors duration-300 bg-[#F4F4F5] dark:bg-dark-bg">
            {/* Mobile Header */}
            <div className="md:hidden sticky top-0 z-20 glass rounded-none border-x-0 border-t-0 border-b border-white/30 dark:border-white/10 px-4 py-3 flex items-center justify-between shadow-sm">
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
                onClose={() => setCommandPaletteOpen(false)} 
            />


            <main className="md:pl-64 transition-all duration-300 ease-in-out">
                {/* On mobile, optimize padding for 4-7 inch screens (more thumb-friendly, using screen edges better) */}
                <div className="mx-auto w-full max-w-[1400px] p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
                    <Outlet />
                </div>
            </main>
            
            <DailyNotesPanel />
            
            {/* Notes Floating Button */}
            <button
                onClick={toggleNotes}
                className="fixed bottom-6 right-6 z-[90] p-4 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all outline-none md:bottom-8 md:right-8 group"
                title="Nota Rápida del Día"
            >
                <StickyNote className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            </button>

            <ToastContainer />
        </div>
    );
};

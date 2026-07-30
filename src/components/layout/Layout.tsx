/* UI Version: 12:30 Baseline */
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { CommandPalette } from '../ui/CommandPalette';
import { ToastContainer } from '../ui/Toast';
import { useAppStore } from '../../store/useAppStore';

export const Layout = () => {
    const { isCommandPaletteOpen, setCommandPaletteOpen } = useAppStore();

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
            <Sidebar />

            <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => setCommandPaletteOpen(false)}
            />

            <main className="transition-all duration-300 ease-in-out min-h-screen pl-[19rem] max-lg:pl-[17rem]">
                <div className="mx-auto w-full max-w-[1400px] pt-8 pb-20 md:pb-8 px-4 sm:px-6 md:px-8">
                    <Outlet />
                </div>
            </main>

            <ToastContainer />
        </div>
    );
};

import { useEffect, useState, useRef } from 'react';
import { useTimerStore } from '../../store/useTimerStore';
import { Play, Pause, Square, Clock, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useLocation, useNavigate } from 'react-router-dom';

export const FloatingTimer = () => {
    const { isRunning, elapsedSeconds, startTimer, pauseTimer, stopTimer, resetTimer, syncTick } = useTimerStore();
    const [isVisible, setIsVisible] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Auto-sync timer every second if running
    useEffect(() => {
        let interval: any;
        if (isRunning) {
            interval = setInterval(() => {
                syncTick();
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, syncTick]);

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleStop = () => {
        stopTimer();
        // If we have time recorded, prompt or leave it available for the form
        if (elapsedSeconds > 60) {
           const mins = Math.floor(elapsedSeconds / 60);
           if (!location.pathname.startsWith('/parte/')) {
                // If not in a parte, give option to go to management to pick one or create new
                if(window.confirm(`Has registrado ${mins} minutos. ¿Ir a partes para añadir esta actuación?`)) {
                    navigate('/management');
                }
           }
        }
    };

    if (!isVisible && elapsedSeconds === 0 && !isRunning) {
        return (
             <button
                onClick={() => setIsVisible(true)}
                className="fixed bottom-24 right-6 md:bottom-28 md:right-8 z-[80] p-3 rounded-full bg-slate-800 hover:bg-slate-900 text-white shadow-lg hover:shadow-xl transition-all group outline-none"
                title="Magic Timer"
            >
                <Clock className="w-5 h-5 group-hover:animate-pulse" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-24 right-6 md:bottom-28 md:right-8 z-[80] bg-white dark:bg-slate-900 rounded-full shadow-2xl border border-slate-200 dark:border-slate-800 flex items-center pr-2 pl-4 py-2 gap-3 transition-all">
            
            <div className={clsx(
                "font-mono text-xl font-black w-[80px] text-center transition-colors",
                isRunning ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"
            )}>
                {formatTime(elapsedSeconds)}
            </div>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>

            <div className="flex gap-1">
                {isRunning ? (
                    <button onClick={pauseTimer} className="p-2 rounded-full hover:bg-amber-100 text-amber-600 transition-colors" title="Pausar">
                        <Pause className="w-4 h-4 fill-current" />
                    </button>
                ) : (
                    <button onClick={startTimer} className="p-2 rounded-full hover:bg-green-100 text-green-600 transition-colors" title="Iniciar">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                )}
                
                <button 
                    onClick={handleStop} 
                    disabled={elapsedSeconds === 0}
                    className="p-2 rounded-full hover:bg-red-100 text-red-500 disabled:opacity-30 transition-colors" 
                    title="Detener"
                >
                    <Square className="w-4 h-4 fill-current" />
                </button>
            </div>

            <button 
                onClick={() => setIsVisible(false)}
                className="absolute -top-2 -right-2 p-1 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    );
};

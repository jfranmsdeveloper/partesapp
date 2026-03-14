import React, { useEffect, useState } from 'react';
import { useAIStore, aiService } from '../../services/aiService';
import { useAppStore } from '../../store/useAppStore';
import { Sparkles, X, ChevronRight } from 'lucide-react';
import type { Parte } from '../../types';
import { useNavigate } from 'react-router-dom';

export const AIAssistantOverlay: React.FC = () => {
    const { engine, isLoaded } = useAIStore();
    const { partes } = useAppStore();
    const navigate = useNavigate();
    const [targetParteId, setTargetParteId] = useState<number | null>(null);
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (engine !== 'webllm' || !isLoaded) return;

        // Proactive analysis every 30 seconds
        const analyzePeriodically = setInterval(async () => {
            const openPartes = (partes as Parte[]).filter(p => p.status === 'ABIERTO');
            if (openPartes.length === 0) return;

            // Simple proactivity logic
            const oldestParte = [...openPartes].sort((a, b) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )[0];

            const daysOpen = Math.floor((new Date().getTime() - new Date(oldestParte.createdAt).getTime()) / (1000 * 60 * 60 * 24));

            if (daysOpen >= 3 && !isVisible) {
                const prompt = `Analiza este parte que lleva ${daysOpen} días abierto: "${oldestParte.title}". Sugiere una acción rápida para cerrarlo. Máximo 15 palabras.`;
                const advice = await aiService.generate(prompt);
                setSuggestion(advice);
                setTargetParteId(oldestParte.id);
                setIsVisible(true);
            }
        }, 30000);

        return () => clearInterval(analyzePeriodically);
    }, [engine, isLoaded, partes, isVisible]);

    const handleViewParte = () => {
        if (targetParteId) {
            navigate(`/parte/${targetParteId}`);
            setIsVisible(false);
        }
    };

    if (!isVisible || !suggestion) return null;

    return (
        <div className="fixed bottom-6 left-6 z-[100] animate-in fade-in slide-in-from-left-6 duration-500">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-indigo-500/20 shadow-2xl shadow-indigo-500/10 rounded-2xl p-4 max-w-sm group">
                <button 
                    onClick={() => setIsVisible(false)}
                    className="absolute -top-2 -right-2 p-1 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-white/10 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <X className="w-3 h-3 text-slate-400" />
                </button>
                
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-xl mt-1">
                        <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
                    </div>
                    
                    <div className="flex-1">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1 select-none">Sugerencia Proactiva</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                            {suggestion}
                        </p>
                        
                        <div className="mt-3 flex items-center gap-2">
                            <button 
                                onClick={handleViewParte}
                                className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                            >
                                Ver Parte <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

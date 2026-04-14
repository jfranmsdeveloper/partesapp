/* UI Version: 12:30 Baseline */
import { useState, useRef } from 'react';
import { Sparkles, Loader2, Bot, Check, Copy } from 'lucide-react';
import { CreateMLCEngine } from '@mlc-ai/web-llm';
import { Button } from '../ui/Button';
import { clsx } from 'clsx';
import type { ActuacionType, Actuacion } from '../../types';

interface AIGuideGeneratorProps {
    actuaciones: Actuacion[];
    parteTitle: string;
}

export const AIGuideGenerator = ({ actuaciones, parteTitle }: AIGuideGeneratorProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState('');
    const [guide, setGuide] = useState('');
    const [copied, setCopied] = useState(false);

    // Using a lightweight model suitable for summaries
    const MODEL_ID = 'Llama-3.2-1B-Instruct-q4f16_1-MLC'; 

    const generateGuide = async () => {
        if (actuaciones.length === 0) {
            alert('Añade al menos una actuación para generar la guía.');
            return;
        }

        setIsLoading(true);
        setGuide('');
        setProgress(0);
        setProgressText('Iniciando motor de IA local (Privado)...');

        try {
            // Strip HTML from notes for the prompt
            const cleanHtml = (html: string) => {
                const doc = new DOMParser().parseFromString(html, 'text/html');
                return doc.body.textContent || "";
            };

            const dataDump = actuaciones.map(act => 
                `- ${act.type} (${act.duration}min) por ${act.user}: ${cleanHtml(act.notes || "")}`
            ).join('\n');

            const initProgressCallback = (report: { progress: number, text: string }) => {
                setProgress(Math.round(report.progress * 100));
                setProgressText(report.text);
            };

            // Warning: Model download can take time on first run, it is cached in IndexedDB
            const engine = await CreateMLCEngine(
                MODEL_ID,
                { initProgressCallback }
            );

            setProgressText('Generando la guía paso a paso...');

            const prompt = `
            Eres un asistente técnico experto redactando guías de trabajo para clientes. 
            A continuación hay un registro de las actuaciones técnicas realizadas para el parte titulado "${parteTitle}".
            Por favor, genera una "Guía Rápida de Procedimiento" secuencial (paso a paso) que explique de forma clara y profesional qué se ha hecho en el equipo/instalación.
            Ignora los nombres de los usuarios en la redacción final, enfócate en la acción técnica realizada.
            Usa un tono impecable, técnico y directo.
            
            Registro de actuaciones:
            ${dataDump}
            
            Formato: 
            - Título: GUÍA RÁPIDA DE PROCEDIMIENTO
            - Lista numerada de pasos secuenciales.
            - Breve conclusión sobre el estado actual del servicio.
            - NO menciones que eres una IA.
            `;

            const reply = await engine.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3, // keep it deterministic
            });

            setGuide(reply.choices[0].message.content || '');
            
        } catch (error) {
            console.error(error);
            // Fallback to older model if Llama 3.2 is not in registry
            setGuide('Error al cargar la IA local. Es posible que tu dispositivo o navegador no soporte WebGPU, o el modelo seleccionado no esté disponible.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (guide) {
            navigator.clipboard.writeText(guide);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl p-6 relative overflow-hidden group">
            
            {/* Background elements */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-all duration-700"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-10">
                <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        Guía Ejecutiva IA
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mt-1">
                        Genera un resumen profesional de todas tus actuaciones usando inteligencia artificial <strong>100% local y privada</strong>. Ningún dato sale de tu navegador.
                    </p>
                </div>
                
                <Button 
                    onClick={generateGuide} 
                    disabled={isLoading || actuaciones.length === 0}
                    className="whitespace-nowrap bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30 border-0"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Procesando...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generar Guía
                        </>
                    )}
                </Button>
            </div>

            {isLoading && (
                <div className="mt-4 p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-indigo-100 dark:border-indigo-800">
                    <div className="flex justify-between text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
                        <span>{progressText}</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div 
                            className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    {progress < 100 && (
                        <p className="text-[10px] text-slate-400 mt-2 text-center italic">
                            * La primera vez puede tardar unos minutos en descargar el modelo (aprox 1GB)
                        </p>
                    )}
                </div>
            )}

            {guide && !isLoading && (
                <div className="mt-4 relative animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                        {guide}
                    </div>
                    
                    <button 
                         onClick={handleCopy}
                         className={clsx(
                             "absolute top-3 right-3 p-2 rounded-lg transition-all shadow-sm border",
                             copied 
                                ? "bg-green-100 border-green-200 text-green-700 dark:bg-green-900 dark:border-green-800 dark:text-green-300"
                                : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
                         )}
                         title="Copiar guía"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            )}
        </div>
    );
};

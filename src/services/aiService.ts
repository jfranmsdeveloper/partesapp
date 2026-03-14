import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../utils/supabase';

export type AIEngine = 'ollama' | 'webllm';
export const DEFAULT_WEBLLM_MODEL = "Llama-3-8B-Instruct-q4f32_1-MLC";
export const LIGHT_WEBLLM_MODEL = "TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC";

interface AIState {
    engine: AIEngine;
    endpoint: string;
    model: string;
    isAvailable: boolean;
    loadProgress: number; // For WebLLM loading status
    isLoaded: boolean;
    setEngine: (engine: AIEngine) => void;
    setEndpoint: (endpoint: string) => void;
    setModel: (model: string) => void;
    checkAvailability: () => Promise<boolean>;
    setLoadProgress: (progress: number) => void;
    setIsLoaded: (isLoaded: boolean) => void;
}

export const useAIStore = create<AIState>()(
    persist(
        (set, get) => ({
            engine: 'ollama',
            endpoint: 'http://localhost:11434/api/generate',
            model: 'llama3:latest',
            isAvailable: false,
            loadProgress: 0,
            isLoaded: false,

            setEngine: (engine: AIEngine) => set({ engine, isAvailable: engine === 'webllm' ? get().isLoaded : get().isAvailable }),
            setEndpoint: (endpoint: string) => set({ endpoint }),
            setModel: (model: string) => set({ model }),
            setLoadProgress: (loadProgress: number) => set({ loadProgress }),
            setIsLoaded: (isLoaded: boolean) => set({ isLoaded, isAvailable: isLoaded || get().engine === 'ollama' }),

            checkAvailability: async () => {
                const { engine, endpoint, isLoaded } = get();
                if (engine === 'webllm') return isLoaded;

                try {
                    const response = await fetch(endpoint.replace('/generate', '/tags'), {
                        method: 'GET',
                    });
                    const available = response.ok;
                    set({ isAvailable: available });
                    return available;
                } catch (error) {
                    set({ isAvailable: false });
                    return false;
                }
            },
        }),
        {
            name: 'ai-storage',
            partialize: (state) => ({ 
                engine: state.engine, 
                endpoint: state.endpoint, 
                model: state.model 
            }),
        }
    )
);

import * as webLLM from "@mlc-ai/web-llm";

let engineInstance: webLLM.MLCEngine | null = null;

export const aiService = {
    async initWebLLM(): Promise<void> {
        const { model, setLoadProgress, setIsLoaded } = useAIStore.getState();
        if (engineInstance) return;

        const adapter = (supabase as any);
        const webModelId = model && model.includes(':') ? DEFAULT_WEBLLM_MODEL : (model || DEFAULT_WEBLLM_MODEL);

        // 1. Prepare Fetch Wrapper to intercept and save/load from local folder
        const originalFetch = window.fetch;
        window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
            
            // Only intercept model-related files from MLC CDN
            if (url.includes('mlc-ai') || url.includes('huggingface.co')) {
                const fileName = url.split('/').pop() || 'file';
                
                // Try to load from local folder first
                const localFile = await adapter.getModelFile(webModelId, fileName);
                if (localFile) {
                    console.log(`FSA IA: Usando archivo local ${fileName}`);
                    return new Response(localFile);
                }

                // If not local, fetch from network and save
                console.log(`FSA IA: Descargando y guardando ${fileName}...`);
                const response = await originalFetch(input, init);
                if (response.ok) {
                    const blob = await response.clone().blob();
                    // Save in background
                    adapter.saveModelFile(webModelId, fileName, blob);
                }
                return response;
            }

            return originalFetch(input, init);
        };

        try {
            engineInstance = new webLLM.MLCEngine();
            engineInstance.setInitProgressCallback((report) => {
                setLoadProgress(Math.round(report.progress * 100));
            });

            await engineInstance.reload(webModelId);
            setIsLoaded(true);
            console.log("FSA IA: Motor listo con persistencia local.");
        } catch (error) {
            console.error("WebLLM Init Error:", error);
            setIsLoaded(false);
            engineInstance = null;
            throw error;
        } finally {
            // Restore fetch
            window.fetch = originalFetch;
        }
    },

    async generate(prompt: string, context?: string): Promise<string> {
        const { engine, endpoint, model } = useAIStore.getState();
        const fullPrompt = context ? `Contexto de la aplicación: ${context}\n\nPregunta/Tarea: ${prompt}` : prompt;
        
        if (engine === 'webllm') {
            if (!engineInstance) await this.initWebLLM();
            if (!engineInstance) throw new Error("Motor nativo no inicializado");
            
            const messages: webLLM.ChatCompletionMessageParam[] = [
                { role: "system", content: "Eres un asistente inteligente para una aplicación de gestión de partes de trabajo. Responde de forma concisa y profesional en Español." },
                { role: "user", content: fullPrompt }
            ];

            const reply = await engineInstance.chat.completions.create({
                messages,
            });
            return reply.choices[0].message.content || "";
        }

        // Ollama Implementation
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model,
                    prompt: fullPrompt,
                    stream: false,
                }),
            });

            if (!response.ok) throw new Error('Ollama connection failed');
            const data = await response.json();
            return data.response || '';
        } catch (error) {
            console.error('AI Generation Error:', error);
            throw error;
        }
    },

    getAppSnapshot(partes: any[], clients: any[]): string {
        // Build a super concise view of the app state for the AI
        const stats = {
            totalPartes: partes.length,
            open: partes.filter(p => p.status === 'ABIERTO').length,
            closed: partes.filter(p => p.status === 'CERRADO').length,
            topClients: clients.slice(0, 3).map(c => c.name).join(', ')
        };

        const activePartes = partes.slice(0, 5).map(p => `#${p.id} ${p.title} (${p.status})`).join('; ');
        
        return `Resumen APP: ${stats.totalPartes} partes (${stats.open} abiertos, ${stats.closed} cerrados). ` +
               `Clientes principales: ${stats.topClients}. ` +
               `Partes recientes: ${activePartes}.`;
    },

    async summarizePartes(partesText: string): Promise<string> {
        const prompt = `Resume estas actuaciones de trabajo de forma profesional. Máximo 3 párrafos.`;
        return this.generate(prompt, partesText);
    },

    async parseVoiceCommand(transcript: string): Promise<{ type?: string, duration?: number, notes?: string, user?: string }> {
        const prompt = `Analiza este comando de voz y extrae JSON con claves: type (LLAMADA, REUNIÓN, INVESTIGACIÓN, DESARROLLO, DOCUMENTACIÓN, SOPORTE), duration (número), notes, user.
        Comando: "${transcript}"`;
        
        const response = await this.generate(prompt);
        try {
            const jsonMatch = response.match(/\{.*\}/s);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response);
        } catch (e) {
            return {};
        }
    }
};

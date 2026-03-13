import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AIState {
    endpoint: string;
    model: string;
    isAvailable: boolean;
    setEndpoint: (endpoint: string) => void;
    setModel: (model: string) => void;
    checkAvailability: () => Promise<boolean>;
}

export const useAIStore = create<AIState>()(
    persist(
        (set, get) => ({
            endpoint: 'http://localhost:11434/api/generate',
            model: 'llama3:latest',
            isAvailable: false,

            setEndpoint: (endpoint: string) => set({ endpoint }),
            setModel: (model: string) => set({ model }),

            checkAvailability: async () => {
                const { endpoint } = get();
                try {
                    // Simple ping to see if Ollama or similar is responsive
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
        }
    )
);

export const aiService = {
    async generate(prompt: string, context?: string): Promise<string> {
        const { endpoint, model } = useAIStore.getState();
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model,
                    prompt: context ? `Context: ${context}\n\nTask: ${prompt}` : prompt,
                    stream: false,
                }),
            });

            if (!response.ok) {
                throw new Error('AI service responded with an error');
            }

            const data = await response.json();
            return data.response || '';
        } catch (error) {
            console.error('AI Generation Error:', error);
            throw error;
        }
    },

    async summarizePartes(partesText: string): Promise<string> {
        const prompt = `Resume de forma profesional y concisa las siguientes actuaciones de trabajo. Enfócate en los logros y el estado actual. No uses más de 3 párrafos. Idioma: Español.`;
        return this.generate(prompt, partesText);
    },

    async parseVoiceCommand(transcript: string): Promise<{ type?: string, duration?: number, notes?: string, user?: string }> {
        const prompt = `Analiza el siguiente comando de voz y extrae la información estructurada para una actuación de trabajo. 
        Tipos válidos: LLAMADA, REUNIÓN, INVESTIGACIÓN, DESARROLLO, DOCUMENTACIÓN, SOPORTE, OTRO.
        
        Comando: "${transcript}"
        
        Responde SOLO con un objeto JSON válido con estas claves: type, duration (en minutos, solo número), notes, user. Si no encuentras algo, omítelo.`;
        
        const response = await this.generate(prompt);
        try {
            // Find JSON in response if AI wrap it in markdown
            const jsonMatch = response.match(/\{.*\}/s);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return JSON.parse(response);
        } catch (e) {
            console.error('Failed to parse AI command response:', response);
            return {};
        }
    }
};

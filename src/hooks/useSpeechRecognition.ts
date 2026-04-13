import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechRecognitionReturn {
    isListening: boolean;
    transcript: string;
    error: string | null;
    start: () => void;
    stop: () => void;
    reset: () => void;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            setError('Tu navegador no soporta reconocimiento de voz. Usa Chrome, Safari o Edge.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'es-ES';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setError(`Error: ${event.error}`);
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript;
            }
            setTranscript(currentTranscript);
        };

        recognitionRef.current = recognition;
    }, []);

    const start = useCallback(() => {
        if (!recognitionRef.current) return;
        setTranscript('');
        setError(null);
        try {
            recognitionRef.current.start();
        } catch (e) {
            console.error('Start recognition error:', e);
        }
    }, []);

    const stop = useCallback(() => {
        if (!recognitionRef.current) return;
        recognitionRef.current.stop();
    }, []);

    const reset = useCallback(() => {
        setTranscript('');
    }, []);

    return {
        isListening,
        transcript,
        error,
        start,
        stop,
        reset
    };
};

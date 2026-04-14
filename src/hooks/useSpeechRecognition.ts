import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechRecognitionReturn {
    isListening: boolean;
    transcript: string; // The full current session transcript
    interimTranscript: string; // Just what is currently being processed
    finalSegment: string; // The last confirmed segment
    error: string | null;
    start: () => void;
    stop: () => void;
    reset: () => void;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [finalSegment, setFinalSegment] = useState('');
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
        recognition.onend = () => {
            setIsListening(false);
            setInterimTranscript('');
        };
        
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setError(`Error: ${event.error}`);
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            let interimText = '';
            let lastFinalText = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    lastFinalText = result[0].transcript;
                    setFinalSegment(lastFinalText);
                    setTranscript(prev => prev + lastFinalText + ' ');
                } else {
                    interimText += result[0].transcript;
                }
            }
            setInterimTranscript(interimText);
        };

        recognitionRef.current = recognition;
    }, []);

    const start = useCallback(() => {
        if (!recognitionRef.current) return;
        setTranscript('');
        setInterimTranscript('');
        setFinalSegment('');
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
        setInterimTranscript('');
        setFinalSegment('');
    }, []);

    return {
        isListening,
        transcript,
        interimTranscript,
        finalSegment,
        error,
        start,
        stop,
        reset
    };
};

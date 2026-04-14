/* UI Version: 12:30 Baseline */
import { useRef, useEffect } from 'react';
import { useNotesStore } from '../../store/useNotesStore';
import { X, StickyNote, Copy, Trash2, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { clsx } from 'clsx';
import { useState } from 'react';

export const DailyNotesPanel = () => {
    const { isNotesOpen, setNotesOpen, noteContent, setNoteContent, clearNotes } = useNotesStore();
    const [copied, setCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto focus when opened if empty
    useEffect(() => {
        if (isNotesOpen && !noteContent && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isNotesOpen, noteContent]);

    const handleCopy = () => {
        if (noteContent) {
            navigator.clipboard.writeText(noteContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isNotesOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 z-[100] w-full sm:w-[400px] bg-amber-50 dark:bg-amber-950/90 border-l border-amber-200 dark:border-amber-800 shadow-2xl flex flex-col transform transition-transform duration-300 backdrop-blur-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200/50 dark:border-amber-800/50 bg-amber-100/50 dark:bg-amber-900/50">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-500 font-bold">
                    <StickyNote className="w-5 h-5" />
                    <span>Nota Rápida del Día</span>
                </div>
                <button 
                    onClick={() => setNotesOpen(false)}
                    className="p-1 rounded-md text-amber-600 hover:bg-amber-200 dark:text-amber-400 dark:hover:bg-amber-800 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 p-4 flex flex-col overflow-hidden relative">
                {/* Lined paper effect background */}
                <div className="absolute inset-x-4 inset-y-4 pointer-events-none opacity-30 dark:opacity-10 z-0 select-none bg-[linear-gradient(transparent_95%,#fbbf24_95%)] bg-[length:100%_2rem] mt-2"></div>
                
                <textarea
                    ref={textareaRef}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Anota aquí detalles de llamadas, recordatorios rápidos, IDs parciales... Todo se guarda automáticamente para cuando lo necesites."
                    className="flex-1 w-full relative z-10 bg-transparent border-0 outline-none resize-none pt-2 px-1 text-amber-900 dark:text-amber-100 placeholder-amber-700/50 dark:placeholder-amber-400/50 leading-8 text-[15px] font-medium font-sans"
                    spellCheck="false"
                />
            </div>

            <div className="p-4 border-t border-amber-200/50 dark:border-amber-800/50 bg-amber-100/30 dark:bg-amber-900/30 flex justify-between gap-2">
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                        if (window.confirm('¿Borrar todas las notas?')) clearNotes();
                    }}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 px-2"
                    title="Borrar todo"
                   disabled={!noteContent}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>

                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCopy}
                        className={clsx(
                            "border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-800/50",
                            copied && "bg-green-100 border-green-300 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-300"
                        )}
                        disabled={!noteContent}
                    >
                        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? 'Copiado!' : 'Copiar todo'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

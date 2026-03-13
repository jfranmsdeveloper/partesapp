import { useState, useEffect, useRef } from 'react';
import { Brain, X, Send, Sparkles, Bot, User as UserIcon, MessageSquareQuote } from 'lucide-react';
import { clsx } from 'clsx';
import { aiService, useAIStore } from '../../services/aiService';
import { useUserStore } from '../../hooks/useUserStore';
import { useAppStore } from '../../store/useAppStore';
import { useLocation } from 'react-router-dom';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface AIChatSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AIChatSidebar = ({ isOpen, onClose }: AIChatSidebarProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { isAvailable } = useAIStore();
    const { partes } = useUserStore();
    const location = useLocation();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const getAppStatusContext = () => {
        const path = location.pathname;
        let context = `El usuario está actualmente en la página: ${path}. `;

        // Add Global Snapshot (RAG)
        const { clients } = useAppStore.getState(); // Need to import or use props
        const snapshot = aiService.getAppSnapshot(partes, clients);
        context += `Resumen global de la app: ${snapshot}. `;

        if (path.includes('/parte/')) {
            const id = path.split('/').pop();
            const parte = partes.find(p => p.id === parseInt(id || ''));
            if (parte) {
                context += `Específicamente, está viendo el Parte #${parte.id} con actuaciones: ${JSON.stringify(parte.actuaciones)}. `;
            }
        }
        
        return context;
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isTyping || !isAvailable) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const context = getAppStatusContext();
            const response = await aiService.generate(userMsg.content, context);
            
            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (error) {
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Lo siento, he tenido un problema conectando con mi cerebro local. ¿Está Ollama ejecutándose?',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "fixed top-0 right-0 h-full w-80 md:w-96 bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl border-l border-slate-200 dark:border-dark-border z-50 transition-transform duration-500 ease-in-out flex flex-col shadow-2xl shadow-blue-500/10",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">Asistente IA</h2>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className={clsx("w-1.5 h-1.5 rounded-full", isAvailable ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {isAvailable ? 'Cerebro Activo' : 'Desconectado'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white dark:hover:bg-dark-surface rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all active:scale-95"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Area */}
                <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
                >
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                            <div className="relative">
                                <Bot className="w-16 h-16 text-slate-200 dark:text-slate-800" />
                                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-blue-400 animate-bounce" />
                            </div>
                            <div>
                                <h3 className="text-slate-800 dark:text-slate-200 font-bold mb-1">¿En qué puedo ayudarte?</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Puedo resumir partes, buscar actuaciones o responder dudas sobre la aplicación.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 gap-2 w-full pt-4">
                                {[
                                    "¿Qué partes tengo abiertos?",
                                    "¿Quién trabajó ayer?",
                                    "Resumen de la semana"
                                ].map((hint) => (
                                    <button 
                                        key={hint}
                                        onClick={() => setInput(hint)}
                                        className="py-2 px-3 text-[11px] text-left border border-slate-100 dark:border-dark-border text-slate-500 dark:text-slate-400 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 transition-all"
                                    >
                                        "{hint}"
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div 
                                key={msg.id}
                                className={clsx(
                                    "flex flex-col max-w-[85%]",
                                    msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                                )}
                            >
                                <div className={clsx(
                                    "flex items-center gap-2 mb-1.5",
                                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                )}>
                                    <div className={clsx(
                                        "p-1 rounded-lg",
                                        msg.role === 'user' ? "bg-slate-100 dark:bg-dark-surface" : "bg-blue-50 dark:bg-blue-900/30"
                                    )}>
                                        {msg.role === 'user' ? <UserIcon className="w-3 h-3 text-slate-500" /> : <Bot className="w-3 h-3 text-blue-500" />}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">{msg.role === 'user' ? 'Tú' : 'Cerebro IA'}</span>
                                </div>
                                <div className={clsx(
                                    "p-3.5 rounded-2xl text-sm shadow-sm border",
                                    msg.role === 'user' 
                                        ? "bg-slate-800 text-white border-slate-700 rounded-tr-none" 
                                        : "bg-white dark:bg-dark-surface border-slate-100 dark:border-dark-border text-slate-700 dark:text-slate-200 rounded-tl-none"
                                )}>
                                    {msg.content}
                                </div>
                                <span className="text-[9px] text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))
                    )}
                    {isTyping && (
                        <div className="flex flex-col max-w-[85%] items-start">
                             <div className="flex items-center gap-2 mb-1.5">
                                <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                                    <Bot className="w-3 h-3 text-blue-500" />
                                </div>
                                <span className="text-[10px] font-bold text-blue-500">Escribiendo...</span>
                            </div>
                            <div className="bg-white dark:bg-dark-surface border border-slate-100 dark:border-dark-border p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-dark-card border-t border-slate-100 dark:border-dark-border">
                    <form 
                        onSubmit={handleSendMessage}
                        className="relative"
                    >
                        <input 
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isAvailable ? "Pregunta algo..." : "Configura la IA en el Perfil"}
                            disabled={!isAvailable || isTyping}
                            className="w-full bg-slate-100 dark:bg-dark-surface border-none rounded-2xl pl-4 pr-12 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none transition-all"
                        />
                        <button 
                            type="submit"
                            disabled={!input.trim() || isTyping || !isAvailable}
                            className="absolute right-2 top-1.5 p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none transition-all active:scale-90"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                    <div className="flex items-center justify-between mt-3 px-1">
                         <div className="flex items-center gap-1">
                             <MessageSquareQuote className="w-3 h-3 text-slate-300" />
                             <span className="text-[10px] text-slate-400">Contexto inteligente activo</span>
                         </div>
                         <p className="text-[10px] text-slate-300 font-medium">Apple Liquid Glass v1</p>
                    </div>
                </div>
            </aside>
        </>
    );
};

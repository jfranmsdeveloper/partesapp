import { create } from 'zustand';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, AlertCircle, X, Info } from 'lucide-react';
import { useId, useMemo } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastStore {
    toasts: Toast[];
    addToast: (message: string, type: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (message, type, duration = 5000) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({ toasts: [...state.toasts, { id, message, type, duration }] }));
        setTimeout(() => {
            set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
        }, duration);
    },
    removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const useToast = () => {
    const addToast = useToastStore((state) => state.addToast);
    return useMemo(() => ({
        success: (msg: string) => addToast(msg, 'success'),
        error: (msg: string) => addToast(msg, 'error'),
        info: (msg: string) => addToast(msg, 'info'),
        warn: (msg: string) => addToast(msg, 'warning'),
    }), [addToast]);
};

export const ToastContainer = () => {
    const { toasts, removeToast } = useToastStore();

    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        className="pointer-events-auto"
                    >
                        <div className={`
                            flex items-center gap-4 px-5 py-4 rounded-[1.5rem] shadow-2xl border backdrop-blur-xl min-w-[320px]
                            ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 
                              toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' :
                              toast.type === 'warning' ? 'bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400' :
                              'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'}
                            bg-white dark:bg-black/40
                        `}>
                            <div className={`p-2 rounded-xl ${
                                toast.type === 'success' ? 'bg-emerald-500/20' :
                                toast.type === 'error' ? 'bg-red-500/20' :
                                toast.type === 'warning' ? 'bg-orange-500/20' :
                                'bg-blue-500/20'
                            }`}>
                                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                                {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                                {toast.type === 'warning' && <Bell className="w-5 h-5" />}
                                {toast.type === 'info' && <Info className="w-5 h-5" />}
                            </div>
                            
                            <div className="flex-1">
                                <p className="text-sm font-bold tracking-tight">{toast.message}</p>
                            </div>

                            <button 
                                onClick={() => removeToast(toast.id)}
                                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 opacity-50" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

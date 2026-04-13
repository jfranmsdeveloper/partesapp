import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../utils/supabase';
import logo from '../../assets/logo.png';

export default function Login() {
    const navigate = useNavigate();
    const { loginUser, reconnectSession, hasPendingHandle, error: storeError } = useAppStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);

    // Email of user whose session.json was found (shown in reconnect banner)
    const pendingEmail = (supabase as any).pendingSessionEmail as string | null;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        setIsLoggingIn(true);

        const success = await loginUser(email, password);

        if (success) {
            navigate('/dashboard');
        }

        setIsLoggingIn(false);
    };

    // Called from the reconnect banner — needs user gesture, restores session from file
    const handleReconnect = async () => {
        setLocalError('');
        setIsReconnecting(true);

        const ok = await reconnectSession();

        if (ok) {
            navigate('/dashboard');
        } else {
            setLocalError('No se pudo restaurar la sesión. Por favor inicia sesión con tus credenciales.');
        }

        setIsReconnecting(false);
    };

    const displayError = localError || storeError;

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-400/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="w-full max-w-md glass-liquid p-8 rounded-3xl animate-fade-in-up">
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="w-24 h-24 mb-4 relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
                        <img
                            src={logo}
                            alt="Logo Corporativo"
                            className="w-full h-full object-contain relative z-10 drop-shadow-md transform hover:scale-105 transition-transform duration-300"
                        />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 font-heading tracking-tight">
                        Bienvenido
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 font-medium">
                        Accede a tu panel de gestión
                    </p>
                </div>

                {displayError && (
                    <div className="mb-6 bg-red-50/80 backdrop-blur-sm text-red-700 p-4 rounded-xl text-sm border border-red-200 shadow-sm flex items-center gap-2 animate-shake">
                        <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {displayError}
                    </div>
                )}

                {/* Reconnect banner — shown when the handle is stored in IndexedDB but the browser
                    needs a user gesture to re-grant access (e.g. after a browser restart). */}
                {hasPendingHandle && !displayError && (
                    <div className="mb-6 space-y-3 animate-fade-in">
                        <div className="bg-orange-50/80 backdrop-blur-sm p-4 rounded-xl border border-orange-200 shadow-sm text-center">
                            <p className="text-slate-700 text-sm font-medium mb-1">
                                {pendingEmail
                                    ? `Sesión guardada para ${pendingEmail}`
                                    : 'Sesión guardada detectada'}
                            </p>
                            <p className="text-xs text-orange-600">
                                El navegador necesita que confirmes el acceso a tu carpeta de datos.
                            </p>
                        </div>
                        <Button
                            onClick={handleReconnect}
                            disabled={isReconnecting}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-500/30 border-none transform hover:-translate-y-0.5 transition-all duration-200 text-base font-medium rounded-xl disabled:opacity-60"
                        >
                            {isReconnecting ? 'Conectando...' : 'Continuar sesión →'}
                        </Button>
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => useAppStore.setState({ hasPendingHandle: false })}
                                className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline"
                            >
                                Iniciar sesión con otra cuenta
                            </button>
                        </div>
                    </div>
                )}

                {/* Standard login form — always shown when no pending handle */}
                {!hasPendingHandle && (
                    <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
                        <div className="space-y-1">
                            <Input
                                label="Correo Electrónico"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-white/50 border-orange-200 focus:border-orange-500 focus:ring-orange-500/20"
                            />
                        </div>
                        <div className="space-y-1">
                            <Input
                                label="Contraseña"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-white/50 border-orange-200 focus:border-orange-500 focus:ring-orange-500/20"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full py-3 mt-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-500/30 border-none transform hover:-translate-y-0.5 transition-all duration-200 text-lg font-medium rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isLoggingIn ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </Button>

                        {!hasPendingHandle && !(supabase as any).isInitialized && (
                            <div className="pt-4 border-t border-slate-100 mt-4 text-center">
                                <p className="text-[10px] text-slate-400 mb-3 uppercase tracking-wider font-bold">
                                    {'showDirectoryPicker' in window ? 'O vincula tu carpeta primero' : 'O vincula tu base de datos de iCloud'}
                                </p>
                                <button
                                    type="button"
                                    onClick={handleReconnect}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-orange-300 hover:text-orange-600 transition-all text-sm font-semibold bg-slate-50/50"
                                >
                                    {'showDirectoryPicker' in window ? (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                            </svg>
                                            Conectar Carpeta de Datos
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Vincular database.json
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        <p className="text-center text-[10px] text-slate-400 pt-2 px-6 leading-relaxed">
                            {'showDirectoryPicker' in window 
                                ? 'Al iniciar, se te pedirá elegir la carpeta donde guardas tus partes de trabajo.' 
                                : 'Selecciona el archivo database.json de tu carpeta de iCloud para sincronizar.'}
                        </p>
                    </form>
                )}

                {!hasPendingHandle && (
                    <div className="mt-8 text-center text-sm text-slate-600 flex flex-col items-center gap-2">
                        <button 
                            type="button"
                            onClick={async () => {
                                if(window.confirm('¿Estás seguro de que quieres borrar todos los datos de sesión, caché y configuración inicial local? Se te pedirá volver a seleccionar tu carpeta.')) {
                                    localStorage.clear();
                                    sessionStorage.clear();
                                    
                                    // Clear IndexedDB handle if possible by using the adapter or directly
                                    try {
                                        const req = indexedDB.open('PartesAppDB', 1);
                                        req.onsuccess = () => {
                                            const db = req.result;
                                            if (db.objectStoreNames.contains('PartesAppStore')) {
                                                const tx = db.transaction('PartesAppStore', 'readwrite');
                                                tx.objectStore('PartesAppStore').clear();
                                            }
                                        };
                                    } catch (e) {
                                        console.error('Error clearing IDB', e);
                                    }

                                    // Clear cookies
                                    document.cookie.split(";").forEach((c) => {
                                      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                                    });

                                    alert('Datos borrados correctamente. Recargando la aplicación...');
                                    window.location.reload();
                                }
                            }}
                            className="font-medium text-red-500 hover:text-red-700 transition-colors hover:underline flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Borrar datos de sesión y caché local
                        </button>
                    </div>
                )}
            </div>

            <div className="fixed bottom-4 text-slate-400 text-xs text-center w-full opacity-60">
                &copy; {new Date().getFullYear()} PartesApp. Todos los derechos reservados.
            </div>
        </div>
    );
}

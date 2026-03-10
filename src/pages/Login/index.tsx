import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAppStore } from '../../store/useAppStore';
import logo from '../../assets/logo.png';

export default function Login() {
    const navigate = useNavigate();
    const { loginUser } = useAppStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const success = await loginUser(email, password);

        if (success) {
            navigate('/dashboard');
        } else {
            setError('Credenciales inválidas');
        }
    };

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

                {error && (
                    <div className="mb-6 bg-red-50/80 backdrop-blur-sm text-red-700 p-4 rounded-xl text-sm border border-red-200 shadow-sm flex items-center gap-2 animate-shake">
                        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
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
                        className="w-full py-3 mt-6 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-500/30 border-none transform hover:-translate-y-0.5 transition-all duration-200 text-lg font-medium rounded-xl"
                    >
                        Seleccionar Carpeta e Iniciar Sesión
                    </Button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-600">
                    ¿No tienes cuenta?{' '}
                    <Link to="/signup" className="font-semibold text-orange-600 hover:text-orange-500 transition-colors hover:underline">
                        Regístrate aquí
                    </Link>
                </div>
            </div>

            <div className="fixed bottom-4 text-slate-400 text-xs text-center w-full opacity-60">
                &copy; {new Date().getFullYear()} PartesApp. Todos los derechos reservados.
            </div>
        </div>
    );
}

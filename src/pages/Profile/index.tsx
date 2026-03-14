import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { User, Lock, Save, Upload, Plus, Trash2, Edit2, FileText } from 'lucide-react';
import type { Snippet } from '../../types';

export default function Profile() {
    const { currentUser, updateUserProfile, changePassword, uploadAvatar, snippets, addSnippet, updateSnippet, deleteSnippet } = useAppStore();

    // Personal Info State
    const [name, setName] = useState(currentUser?.name || '');
    const [successMsg, setSuccessMsg] = useState('');

    // Password State
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [passError, setPassError] = useState('');
    const [passSuccess, setPassSuccess] = useState('');

    // Snippet Management State
    const [isAddingSnippet, setIsAddingSnippet] = useState(false);
    const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);
    const [snipTitle, setSnipTitle] = useState('');
    const [snipContent, setSnipContent] = useState('');


    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name || '');
        }
    }, [currentUser]);

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        updateUserProfile(currentUser.email, { name });
        setSuccessMsg('Perfil actualizado correctamente');
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassError('');
        setPassSuccess('');

        if (!currentUser) return;
        if (newPass !== confirmPass) {
            setPassError('Las contraseñas nuevas no coinciden');
            return;
        }

        if (newPass.length < 4) {
            setPassError('La contraseña debe tener al menos 4 caracteres');
            return;
        }

        const result = await changePassword(currentUser.email, currentPass, newPass);

        if (result) {
            setPassSuccess('Contraseña cambiada con éxito');
            setCurrentPass('');
            setNewPass('');
            setConfirmPass('');
            setTimeout(() => setPassSuccess(''), 3000);
        } else {
            setPassError('La contraseña actual es incorrecta');
        }
    };

    const handleSaveSnippet = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!snipTitle.trim() || !snipContent.trim()) return;

        if (editingSnippetId) {
            await updateSnippet(editingSnippetId, { title: snipTitle, content: snipContent });
        } else {
            await addSnippet({ title: snipTitle, content: snipContent });
        }

        resetSnippetForm();
    };

    const resetSnippetForm = () => {
        setIsAddingSnippet(false);
        setEditingSnippetId(null);
        setSnipTitle('');
        setSnipContent('');
    };

    const startEditSnippet = (snippet: Snippet) => {
        setEditingSnippetId(snippet.id);
        setSnipTitle(snippet.title);
        setSnipContent(snippet.content);
        setIsAddingSnippet(true);
    };

    if (!currentUser) return <div>Inicia sesión para ver tu perfil</div>;

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <User className="w-6 h-6 text-blue-600" />
                Mi Perfil
            </h1>

            {/* Avatar Card */}
            <Card>
                <h2 className="text-lg font-semibold mb-6 text-slate-800 border-b border-slate-100 pb-2">
                    Foto de Perfil
                </h2>
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group">
                        {currentUser?.avatar_url ? (
                            <img
                                src={currentUser.avatar_url}
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover shadow-md ring-4 ring-white dark:ring-slate-700"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-md ring-4 ring-white dark:ring-slate-700">
                                {currentUser?.name?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 cursor-pointer transition-transform hover:scale-110">
                            <Upload className="w-4 h-4" />
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                    if (e.target.files?.[0]) {
                                        const url = await uploadAvatar(e.target.files[0]);
                                        if (url) {
                                            setSuccessMsg('Foto actualizada');
                                            setTimeout(() => setSuccessMsg(''), 3000);
                                        }
                                    }
                                }}
                            />
                        </label>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="font-medium text-slate-900 dark:text-white">Cambiar foto de perfil</h3>
                        <p className="text-sm text-slate-500 mt-1 mb-3">
                            Sube una imagen (JPG, PNG) para que tus compañeros puedan reconocerte fácilmente en los partes.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Personal Info Card */}
            <Card>
                <h2 className="text-lg font-semibold mb-4 text-slate-800 border-b border-slate-100 pb-2">
                    Información Personal
                </h2>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                            <div className="px-4 py-2.5 bg-slate-100 text-slate-500 rounded-xl border border-slate-200">
                                {currentUser.email}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">El email no se puede cambiar.</p>
                        </div>
                        <Input
                            label="Nombre y Apellidos"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Tu nombre completo"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <span className="text-green-600 text-sm font-medium">{successMsg}</span>
                        <Button type="submit">
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Security Card */}
            <Card>
                <h2 className="text-lg font-semibold mb-4 text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-slate-500" />
                    Seguridad
                </h2>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <Input
                        label="Contraseña Actual"
                        type="password"
                        value={currentPass}
                        onChange={(e) => setCurrentPass(e.target.value)}
                        required
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nueva Contraseña"
                            type="password"
                            value={newPass}
                            onChange={(e) => setNewPass(e.target.value)}
                            required
                        />
                        <Input
                            label="Confirmar Nueva Contraseña"
                            type="password"
                            value={confirmPass}
                            onChange={(e) => setConfirmPass(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex flex-col">
                            {passError && <span className="text-red-500 text-sm font-medium">{passError}</span>}
                            {passSuccess && <span className="text-green-600 text-sm font-medium">{passSuccess}</span>}
                        </div>
                        <Button type="submit" variant="outline">
                            Cambiar Contraseña
                        </Button>
                    </div>
                </form>
            </Card>


            {/* Snippets Management Card */}
            <Card>
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-2">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-500" />
                        Mis Plantillas (Snippets)
                    </h2>
                    {!isAddingSnippet && (
                        <Button variant="outline" size="sm" onClick={() => setIsAddingSnippet(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Nueva Plantilla
                        </Button>
                    )}
                </div>

                {isAddingSnippet ? (
                    <form onSubmit={handleSaveSnippet} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Input
                            label="Título de la Plantilla"
                            value={snipTitle}
                            onChange={(e) => setSnipTitle(e.target.value)}
                            placeholder="ej: Informe de errores semanal"
                            required
                        />
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">Contenido</label>
                            <textarea
                                value={snipContent}
                                onChange={(e) => setSnipContent(e.target.value)}
                                className="w-full min-h-[150px] p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-800 text-sm font-mono transition-all"
                                placeholder="Escribe el contenido de la plantilla aquí..."
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" type="button" onClick={resetSnippetForm}>
                                Cancelar
                            </Button>
                            <Button type="submit">
                                {editingSnippetId ? 'Actualizar Plantilla' : 'Guardar Plantilla'}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-3">
                        {snippets.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                <p className="text-slate-500 text-sm italic">No tienes plantillas guardadas aún.</p>
                            </div>
                        ) : (
                            snippets.map((snippet) => (
                                <div 
                                    key={snippet.id}
                                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-blue-300 dark:hover:border-blue-900 transition-colors group"
                                >
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{snippet.title}</h4>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">{snippet.content}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => startEditSnippet(snippet)}
                                            className="p-2 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => deleteSnippet(snippet.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
}

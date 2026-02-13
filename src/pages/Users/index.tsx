import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Search, User as UserIcon, Mail, Calendar, Loader2, Trash2, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function Users() {
    const { currentUser, users, fetchData, updateUserRole, deleteUser, adminCreateUser } = useAppStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Create User State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUserStart, setNewUserStart] = useState({ name: '', email: '', password: '' });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        // Refresh data on mount
        const load = async () => {
            setIsLoading(true);
            await fetchData();
            setIsLoading(false);
        };
        load();
    }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        const success = await adminCreateUser({
            ...newUserStart,
            id: '',
            role: 'user',
            user_metadata: { full_name: newUserStart.name }
        });
        setIsCreating(false);
        if (success) {
            setShowCreateModal(false);
            setNewUserStart({ name: '', email: '', password: '' });
            alert('Usuario creado correctamente');
        } else {
            alert('Error al crear usuario. El email podría estar en uso.');
        }
    };

    // Filter
    const filteredUsers = (users || []).filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.user_metadata?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRoleToggle = async (userId: string, currentRole: string) => {
        if (userId === currentUser?.id) return;
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        await updateUserRole(userId, newRole);
    };

    if (currentUser?.role !== 'admin' && currentUser?.email !== 'admin@admin.com') { // Assuming restrictions are handled in UI but we kept read-only for others?
        // Actually the previous code REMOVED restrictions for visibility. 
        // But "adminCreateUser" button should definitely be restricted.
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10 relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <UserIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        Gestión de Usuarios
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Administra los usuarios y sus roles.
                    </p>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800 text-sm font-medium text-blue-700 dark:text-blue-300">
                        Total: {users.length}
                    </div>
                    {/* Create User Button for Super Admin */}
                    {currentUser?.email === 'fran.molina@serglobin.es' && (
                        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Nuevo Usuario
                        </Button>
                    )}
                </div>
            </div>

            {/* Rest of UI ... Search Bar */}
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 flex items-center gap-3">
                <Search className="w-5 h-5 text-neutral-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-neutral-800 dark:text-neutral-200 placeholder-neutral-400"
                />
            </div>

            {/* Users List */}
            {isLoading && users.length === 0 ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredUsers.map((user) => (
                        <div
                            key={user.id}
                            className="group bg-white dark:bg-neutral-800 p-5 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 flex flex-col md:flex-row items-center gap-6"
                        >
                            {/* Avatar */}
                            {user.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt="Avatar"
                                    className="w-12 h-12 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-neutral-700"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold text-lg shadow-inner">
                                    {user.email?.charAt(0).toUpperCase()}
                                </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 w-full text-center md:text-left">
                                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-1">
                                    <h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-100">
                                        {user.user_metadata?.full_name || 'Sin Nombre'}
                                    </h3>

                                    {/* SUPER ADMIN CRUD Actions */}
                                    {currentUser?.email === 'fran.molina@serglobin.es' && (
                                        <div className="flex items-center gap-2">
                                            {/* Admin Toggle */}
                                            <button
                                                onClick={() => user.id && handleRoleToggle(user.id, user.role || 'user')}
                                                disabled={user.id === currentUser?.id}
                                                className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide transition-all border ${(user.role === 'admin' || user.email === 'admin@admin.com')
                                                    ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800 hover:bg-orange-200 cursor-pointer'
                                                    : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-200 cursor-pointer'
                                                    }`}
                                                title={user.id === currentUser?.id ? "No puedes cambiar tu propio rol" : "Click para cambiar rol"}
                                            >
                                                {(user.role === 'admin' || user.email === 'admin@admin.com') ? 'Administrador' : 'Usuario'}
                                            </button>

                                            {/* Delete Button */}
                                            <button
                                                onClick={() => {
                                                    if (user.id && window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
                                                        deleteUser(user.id);
                                                    }
                                                }}
                                                disabled={user.id === currentUser?.id}
                                                className="p-1.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Eliminar usuario"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                    {/* Read-Only Role Badge for others */}
                                    {currentUser?.email !== 'fran.molina@serglobin.es' && (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide ${(user.role === 'admin' || user.email === 'admin@admin.com')
                                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400'
                                            }`}>
                                            {(user.role === 'admin' || user.email === 'admin@admin.com') ? 'Administrador' : 'Usuario'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col md:flex-row gap-4 text-sm text-neutral-500 dark:text-neutral-400 justify-center md:justify-start">
                                    <span className="flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5" />
                                        {user.email}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Registrado: {user.created_at ? format(new Date(user.created_at), "d MMM yyyy", { locale: es }) : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700">
                            No se encontraron usuarios
                        </div>
                    )}
                </div>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Nuevo Usuario</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            <Input
                                label="Nombre Completo"
                                value={newUserStart.name}
                                onChange={(e) => setNewUserStart({ ...newUserStart, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Correo Electrónico"
                                type="email"
                                value={newUserStart.email}
                                onChange={(e) => setNewUserStart({ ...newUserStart, email: e.target.value })}
                                required
                            />
                            <Input
                                label="Contraseña"
                                type="password"
                                value={newUserStart.password}
                                onChange={(e) => setNewUserStart({ ...newUserStart, password: e.target.value })}
                                required
                                minLength={6}
                            />

                            <div className="pt-2 flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isCreating}>
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Usuario'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

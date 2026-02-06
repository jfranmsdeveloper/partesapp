import { create } from 'zustand';
import { supabase } from '../utils/supabase';
import type { Parte, Actuacion, ParteStatus, Client, User } from '../types';

interface AppState {
    // UI State
    activeView: 'list' | 'kanban' | 'calendar';
    setActiveView: (view: 'list' | 'kanban' | 'calendar') => void;
    isLoading: boolean;
    error: string | null;

    // Auth State
    currentUser: User | null;
    checkSession: () => Promise<void>;
    loginUser: (email: string, pass: string) => Promise<boolean>;
    registerUser: (user: User) => Promise<boolean>;
    logoutUser: () => Promise<void>;

    // Data State
    partes: Parte[];
    clients: Client[];
    users: User[];

    // Data Actions
    fetchData: () => Promise<void>;

    addParte: (parte: Omit<Parte, 'id' | 'actuaciones' | 'totalTime' | 'totalActuaciones' | 'userId' | 'pdfFile' | 'pdfFileSigned'> & { id?: number; pdfFile?: string }) => Promise<void>;
    updateParteStatus: (id: number, status: ParteStatus) => Promise<void>;
    updateParte: (id: number, data: Partial<Parte>) => Promise<void>;
    deleteParte: (id: number) => Promise<void>;

    addActuacion: (parteId: number, actuacion: Omit<Actuacion, 'id' | 'parteId'>) => Promise<void>;
    updateActuacion: (parteId: number, actuacionId: string, data: Partial<Actuacion>) => Promise<void>;
    deleteActuacion: (parteId: number, actuacionId: string) => Promise<void>;

    addClient: (client: Omit<Client, 'id' | 'userId'>) => Promise<void>;
    updateClient: (id: string, data: Partial<Client>) => Promise<void>;

    getParte: (id: number) => Parte | undefined;
    updateUserProfile: (email: string, data: Partial<User>) => Promise<void>;
    changePassword: (email: string, oldPass: string, newPass: string) => Promise<boolean>;

    // New Actions
    uploadAvatar: (file: File) => Promise<string | null>;
    updateUserRole: (userId: string, role: string) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    adminCreateUser: (user: User) => Promise<boolean>;
}

export const useAppStore = create<AppState>((set, get) => ({
    // ... (rest)

    activeView: 'list',
    setActiveView: (view) => set({ activeView: view }),
    isLoading: true, // Start true to prevent redirect before check
    error: null,

    currentUser: null,
    partes: [],
    clients: [],
    users: [],

    checkSession: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                set({
                    currentUser: {
                        id: session.user.id,
                        email: session.user.email!,
                        name: session.user.user_metadata.full_name || '',
                        password: '', // Not needed/available
                        role: session.user.user_metadata?.role || 'user'
                    }
                });
                // Load data when session exists
                await get().fetchData();
            } else {
                set({ currentUser: null, partes: [], clients: [] });
            }
        } catch (error) {
            console.error('Session check failed:', error);
            set({ currentUser: null });
        } finally {
            set({ isLoading: false });
        }
    },

    // ... (keep loginUser, registerUser, etc. unchanged if possible, or just replace the block if needed. 
    // To match the ReplaceFileContent strictness, I should target specific blocks or the whole file if scattered.
    // It's safer to target checkSession independently if I can, but I want to fix fetchData too.)

    // Let's do checkSession first.


    loginUser: async (email, password) => {
        set({ isLoading: true, error: null });
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            set({ isLoading: false, error: error.message });
            return false;
        }

        if (data.user) {
            set({
                currentUser: {
                    id: data.user.id,
                    email: data.user.email!,
                    name: data.user.user_metadata.full_name || '',
                    password: '',
                    role: 'user'
                }
            });
            await get().fetchData();
        }
        set({ isLoading: false });
        return true;
    },

    registerUser: async (user) => {
        set({ isLoading: true, error: null });
        const { error } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
            options: {
                data: { full_name: user.name }
            }
        });

        if (error) {
            set({ isLoading: false, error: error.message });
            return false;
        }
        set({ isLoading: false });
        return true;
    },

    logoutUser: async () => {
        await supabase.auth.signOut();
        set({ currentUser: null, partes: [], clients: [] });
    },

    fetchData: async () => {
        // Do not set isLoading=true here, as it triggers AuthGuard unmount loop.
        // Loading local state should be handled by components if needed.

        try {
            // 1. Fetch Clients (Pre-fetch to map accordingly)
            const { data: clientsData, error: clientsError } = await supabase
                .from('clients')
                .select('*')
                .order('full_name', { ascending: true });

            if (clientsError && clientsError.code !== 'PGRST116') console.error('Error fetching clients:', clientsError);

            const mappedClients: Client[] = (clientsData || []).map((c: any) => ({
                id: c.id,
                name: c.full_name,
                userId: '' // Not strictly used yet
            }));

            set({ clients: mappedClients });

            // 2. Fetch Partes
            const { data: partesData, error: partesError } = await supabase
                .from('partes')
                .select('*')
                .order('created_at', { ascending: false });

            if (partesError) throw partesError;

            // 3. Fetch Actuaciones
            const { data: actData, error: actError } = await supabase
                .from('actuaciones')
                .select('*');

            if (actError) console.error('Error fetching actuaciones:', actError);

            // 4. Fetch Users (for avatars and roles)
            const { data: usersData } = await supabase.from('users').select('*');
            if (usersData) {
                set({ users: usersData });

                // Sync currentUser with latest data from DB
                const { currentUser } = get();
                if (currentUser) {
                    const freshUser = usersData.find((u: any) => u.id === currentUser.id);
                    if (freshUser) {
                        set(state => ({
                            currentUser: state.currentUser ? {
                                ...state.currentUser,
                                avatar_url: freshUser.avatar_url,
                                name: freshUser.user_metadata?.full_name || state.currentUser.name,
                                role: freshUser.role || state.currentUser.role // Sync role
                            } : null
                        }));
                    }
                }
            }

            // Map to internal types
            const mappedPartes: Parte[] = (partesData || []).map((p: any) => {
                const pActs = (actData || []).filter((a: any) => a.parte_id === p.id);
                const client = mappedClients.find(c => c.id === p.client_id);

                return {
                    id: p.id,
                    title: p.description || 'Sin título',
                    type: p.type as any,
                    status: p.status as any,
                    createdAt: p.start_date || p.created_at,
                    createdBy: p.created_by || 'Sistema',
                    userId: p.user_id || '',
                    clientId: p.client_id,
                    clientName: client?.name,
                    pdfFile: p.pdf_file,
                    pdfFileSigned: p.pdf_file_signed,
                    actuaciones: pActs.map((a: any) => ({
                        id: a.id,
                        parteId: a.parte_id,
                        type: a.type as any,
                        timestamp: a.date,
                        duration: a.duration,
                        notes: a.description,
                        user: a.user || 'Sistema'
                    })),
                    totalTime: p.total_time || pActs.reduce((acc: number, act: any) => acc + (act.duration || 0), 0),
                    totalActuaciones: pActs.length
                };
            });

            set({ partes: mappedPartes });
        } catch (error) {
            console.error('Error in fetchData:', error);
        }
    },

    // ... (Existing actions)

    addParte: async (parteData) => {
        const { currentUser } = get();
        if (!currentUser) return;

        const payload: any = {
            type: 'INCIDENCIA',
            description: parteData.title,
            status: parteData.status,
            start_date: parteData.createdAt,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            created_by: parteData.createdBy, // Save the manual name
            pdf_file: parteData.pdfFile,
            client_id: parteData.clientId
        };

        // Respect custom ID if provided
        if (parteData.id) {
            payload.id = parteData.id;
        }

        const { error } = await supabase
            .from('partes')
            .insert(payload);

        if (error) {
            console.error('Error adding parte:', error);
            set({ error: error.message });
            return;
        }
        await get().fetchData();
    },

    updateParteStatus: async (id, status) => {
        const { error } = await supabase
            .from('partes')
            .update({ status, closed_at: status === 'CERRADO' ? new Date().toISOString() : null })
            .eq('id', id);

        if (!error) await get().fetchData();
    },

    updateParte: async (id, data) => {
        const updatePayload: any = {};
        if (data.title) updatePayload.description = data.title;
        if (data.status) updatePayload.status = data.status;
        if (data.createdAt) updatePayload.start_date = data.createdAt;
        if (data.pdfFile) updatePayload.pdf_file = data.pdfFile; // Assuming col exists or need to create

        if (Object.keys(updatePayload).length > 0) {
            await supabase.from('partes').update(updatePayload).eq('id', id);
            await get().fetchData();
        }
    },

    deleteParte: async (id) => {
        // Delete related actuaciones first to ensure definitive deletion
        await supabase.from('actuaciones').delete().eq('parte_id', id);
        // Then delete the parte
        await supabase.from('partes').delete().eq('id', id);
        await get().fetchData();
    },

    addActuacion: async (parteId, actuacion) => {
        const { error } = await supabase
            .from('actuaciones')
            .insert({
                parte_id: parteId,
                type: actuacion.type,
                description: actuacion.notes,
                date: actuacion.timestamp || new Date().toISOString(),
                duration: actuacion.duration,
                user: actuacion.user // Save the technician name
            });

        if (!error) await get().fetchData();
    },

    updateActuacion: async (_parteId, actuacionId, data) => {
        const payload: any = {};
        if (data.notes) payload.description = data.notes;
        if (data.duration) payload.duration = data.duration;
        if (data.type) payload.type = data.type;
        if (data.timestamp) payload.date = data.timestamp;
        if (data.user) payload.user = data.user;

        await supabase.from('actuaciones').update(payload).eq('id', actuacionId);
        await get().fetchData();
    },

    deleteActuacion: async (_parteId, actuacionId) => {
        await supabase.from('actuaciones').delete().eq('id', actuacionId);
        await get().fetchData();
    },

    addClient: async (client) => {
        const { error } = await supabase
            .from('clients')
            .insert({
                full_name: client.name
            });

        if (error) {
            console.error('Error adding client:', error);
        } else {
            await get().fetchData();
        }
    },
    updateClient: async () => { console.warn('Update Client placeholder'); },

    getParte: (id: number) => get().partes.find(p => p.id === id),

    updateUserProfile: async (_email, data) => {
        await supabase.auth.updateUser({ data: { full_name: data.name } });
        get().checkSession();
    },

    changePassword: async (_email, _oldPass, newPass) => {
        const { error } = await supabase.auth.updateUser({ password: newPass });
        return !error;
    },

    uploadAvatar: async (file) => {
        const { currentUser } = get();
        if (!currentUser?.id) return null;

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;
                // Custom endpoint fetch
                try {
                    const res = await fetch('/api/upload/avatar', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: base64, userId: currentUser.id })
                    });
                    const data = await res.json();
                    if (data.success) {
                        // Update local user state immediately
                        set(state => ({
                            currentUser: state.currentUser ? { ...state.currentUser, avatar_url: data.avatarUrl } : null
                        }));
                        // Also refresh all data to propagate to cards/users list
                        await get().fetchData();
                        resolve(data.avatarUrl);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    console.error("Upload error", e);
                    resolve(null);
                }
            };
        });
    },

    updateUserRole: async (userId, role) => {
        await supabase.from('users').update({ role }).eq('id', userId);
        await get().fetchData();
    },

    deleteUser: async (userId) => {
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (!error) {
            await get().fetchData();
        }
    },

    adminCreateUser: async (user) => {
        // Use direct fetch to avoid clearing local session via supabase/localClient wrapper
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    password: user.password,
                    options: { data: { full_name: user.name, role: 'user' } }
                })
            });
            const data = await res.json();
            if (data.error) {
                console.error('Admin create user error:', data.error);
                return false;
            }
            // Success
            await get().fetchData();
            return true;
        } catch (e) {
            console.error('Admin create user exception:', e);
            return false;
        }
    }
}));

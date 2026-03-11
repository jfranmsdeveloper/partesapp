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
    hasPendingHandle: boolean;
    checkSession: () => Promise<void>;
    loginUser: (email: string, pass: string) => Promise<boolean>;
    registerUser: (user: User) => Promise<boolean>;
    logoutUser: () => Promise<void>;
    reconnectSession: () => Promise<boolean>;

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

    addClient: (client: Omit<Client, 'id' | 'userId'>) => Promise<string | null>; // Returns the new client ID
    updateClient: (id: string, data: Partial<Client>) => Promise<void>;
    deleteClient: (id: string) => Promise<void>;

    getParte: (id: number) => Parte | undefined;
    updateUserProfile: (email: string, data: Partial<User>) => Promise<void>;
    changePassword: (email: string, oldPass: string, newPass: string) => Promise<boolean>;

    // New Actions
    uploadAvatar: (file: File) => Promise<string | null>;
    updateUserRole: (userId: string, role: string) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    adminCreateUser: (user: User) => Promise<boolean>;
    fixLegacyAuthorship: (correctName: string) => Promise<void>;
    /**
     * Auto-create a CLIENT from the PDF 'Emitido por el usuario' field if not already present.
     * Returns the client ID so it can be set in the 'Solicitado por' field.
     * Does NOT touch the 'Emitido por' field (which is only for the 5 internal app users).
     */
    upsertClientFromPDF: (fullName: string, code?: string) => Promise<string | null>;
}

export const useAppStore = create<AppState>((set, get) => ({
    // ... (rest)

    activeView: 'list',
    setActiveView: (view) => set({ activeView: view }),
    isLoading: true, // Start true to prevent redirect before check
    error: null,

    currentUser: null,
    hasPendingHandle: false,
    partes: [],
    clients: [],
    users: [],

    checkSession: async () => {
        try {
            // Try to silently restore the root-folder handle from IndexedDB.
            // init(false) = do NOT prompt the user for a new folder selection.
            // If the handle exists and we can get permission (or it is already granted)
            // the adapter will also load the database AND restore the session from file.
            const isReady = await supabase.init(false);

            const { data: { session } } = await supabase.auth.getSession();
            if (isReady && session?.user) {
                set({
                    currentUser: {
                        id: session.user.id,
                        email: session.user.email!,
                        name: session.user.user_metadata?.full_name || session.user.name || '',
                        password: '',
                        role: session.user.role || session.user.user_metadata?.role || 'user'
                    }
                });
                await get().fetchData();
            } else {
                set({ currentUser: null, partes: [], clients: [], hasPendingHandle: (supabase as any).hasPendingHandle || false });
            }
        } catch (error) {
            console.error('Session check failed:', error);
            set({ currentUser: null });
        } finally {
            set({ isLoading: false });
        }
    },

    loginUser: async (email, password) => {
        set({ isLoading: true, error: null });

        // signInWithPassword now handles:
        //  1. Credential validation
        //  2. Folder selection (only first time via showDirectoryPicker)
        //  3. Session persistence in <username>/session.json
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
                    name: data.user.user_metadata?.full_name || data.user.name || '',
                    password: '',
                    role: data.user.role || data.user.user_metadata?.role || 'user'
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
        set({ currentUser: null, partes: [], clients: [], hasPendingHandle: false });
    },

    reconnectSession: async () => {
        // Called from the Login page reconnect button (requires user gesture)
        const ok = await (supabase as any).requestPermissionAndRestore();
        if (ok) {
            await get().checkSession();
        }
        return ok;
    },

    fetchData: async () => {
        // Do not set isLoading=true here, as it triggers AuthGuard unmount loop.
        // Loading local state should be handled by components if needed.

        try {
            // 0. Cleanup accidental users (one-time migration check)
            // Remove any user that was imported from PDF by mistake in previous versions
            try {
                const { data: allUsers } = await supabase.from('users').select('email');
                const usersToPurge = (allUsers || []).filter((u: any) => 
                    u.email?.includes('@imported.pdf') || u.name === 'COBO ROMAN, FERNANDO'
                );
                
                for (const u of usersToPurge) {
                    await supabase.from('users').delete().eq('email', u.email);
                }
            } catch (e) {
                console.warn('Cleanup migration error (non-critical):', e);
            }

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
            user_id: currentUser.id,
            created_by: parteData.createdBy,
            pdf_file: parteData.pdfFile,
            pdf_file_signed: (parteData as any).pdfFileSigned,
            client_id: parteData.clientId
        };

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
        console.log('Updating Parte Status:', id, status);
        const closedAt = status === 'CERRADO' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;

        const { error } = await supabase
            .from('partes')
            .update({ status, closed_at: closedAt })
            .eq('id', id);

        if (error) {
            console.error('Error updating status:', error);
            alert(`Error al actualizar estado: ${error.message}`);
        } else {
            await get().fetchData();
        }
    },

    updateParte: async (id, data) => {
        const updatePayload: any = {};
        if (data.title) updatePayload.description = data.title;
        if (data.status) updatePayload.status = data.status;
        if (data.createdAt) updatePayload.start_date = data.createdAt;
        if (data.createdBy) updatePayload.created_by = data.createdBy;
        if (data.pdfFile) updatePayload.pdf_file = data.pdfFile;
        if (data.pdfFileSigned) updatePayload.pdf_file_signed = data.pdfFileSigned;
        if (data.clientId) updatePayload.client_id = data.clientId;

        if (Object.keys(updatePayload).length > 0) {
            await supabase.from('partes').update(updatePayload).eq('id', id);
            await get().fetchData();
        }
    },

    fixLegacyAuthorship: async (correctName) => {
        const { error } = await supabase
            .from('partes')
            .update({ created_by: correctName })
            .eq('created_by', 'Usuario Actual');

        if (error) {
            console.error('Error fixing authorship:', error);
            alert('Error al corregir autoría: ' + error.message);
        } else {
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
        const newId = `client-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
        const { error } = await supabase
            .from('clients')
            .insert({
                id: newId,
                full_name: client.name
            });

        if (error) {
            console.error('Error adding client:', error);
            return null;
        }
        await get().fetchData();
        return newId;
    },
    updateClient: async (id, data) => { 
        if(data.name) {
            await supabase.from('clients').update({ full_name: data.name }).eq('id', id);
            await get().fetchData();
        }
    },
    deleteClient: async (id) => {
        await supabase.from('clients').delete().eq('id', id);
        await get().fetchData();
    },

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
    },


    upsertClientFromPDF: async (fullName: string, code?: string) => {
        const cleanName = fullName.trim();
        if (!cleanName) return null;

        try {
            const { data: existingClients } = await supabase.from('clients').select('*');
            const clients: any[] = existingClients || [];

            // Check if a client with this name already exists (case-insensitive)
            const existing = clients.find((c: any) =>
                (c.name || c.full_name || '').trim().toUpperCase() === cleanName.toUpperCase()
            );

            if (existing) {
                console.log(`FSA: cliente "${cleanName}" ya existe en la BD (ID: ${existing.id}), no se crea de nuevo.`);
                return existing.id as string;
            }

            // Auto-create the client from the PDF data
            const newId = `client-pdf-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
            await supabase.from('clients').insert({
                id: newId,
                full_name: cleanName,
                pdf_code: code || null
            });

            console.log(`FSA: cliente "${cleanName}" (código: ${code || 'N/A'}) creado automáticamente desde PDF.`);

            // Reload clients list in store
            await get().fetchData();

            return newId;
        } catch (e) {
            console.error('Error in upsertClientFromPDF:', e);
            return null;
        }
    }
}));


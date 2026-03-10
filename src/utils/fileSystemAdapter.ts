// Using native crypto.randomUUID instead of external uuid library

export const DB_FILE_NAME = 'database.json';
export const IDB_STORE = 'PartesAppStore';
export const IDB_KEY = 'rootDirectoryHandle';

// We store the handle in IndexedDB
export async function saveHandleToIDB(handle: FileSystemDirectoryHandle): Promise<void> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('PartesAppDB', 1);
        req.onupgradeneeded = () => {
            req.result.createObjectStore(IDB_STORE);
        };
        req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction(IDB_STORE, 'readwrite');
            tx.objectStore(IDB_STORE).put(handle, IDB_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
    });
}

export async function getHandleFromIDB(): Promise<FileSystemDirectoryHandle | null> {
    return new Promise((resolve) => {
        const req = indexedDB.open('PartesAppDB', 1);
        req.onupgradeneeded = () => {
            req.result.createObjectStore(IDB_STORE);
        };
        req.onsuccess = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(IDB_STORE)) {
                resolve(null);
                return;
            }
            const tx = db.transaction(IDB_STORE, 'readonly');
            const store = tx.objectStore(IDB_STORE);
            const getReq = store.get(IDB_KEY);
            getReq.onsuccess = () => resolve(getReq.result || null);
            getReq.onerror = () => resolve(null);
        };
        req.onerror = () => resolve(null);
    });
}

interface DBState {
    users: any[];
    partes: any[];
    actuaciones: any[];
    clients: any[];
}

const DEFAULT_DB: DBState = {
    users: [
        {
            id: 'admin-id',
            email: 'admin@admin.com',
            password: 'admin',
            role: 'admin',
            user_metadata: { full_name: 'Administrador' },
            created_at: new Date().toISOString()
        }
    ],
    partes: [],
    actuaciones: [],
    clients: []
};

class FileSystemAdapter {
    private handle: FileSystemDirectoryHandle | null = null;
    private state: DBState = JSON.parse(JSON.stringify(DEFAULT_DB));
    public isInitialized = false;
    private activeSessionUser: any = null;

    async init(promptUserIfNeeded = false): Promise<boolean> {
        if (!('showDirectoryPicker' in window)) {
            alert('Tu navegador no soporta File System Access API. Usa Chrome o Edge en PC/Mac.');
            return false;
        }

        try {
            let dirHandle = await getHandleFromIDB();

            if (dirHandle) {
                // Verify permission
                const permission = await (dirHandle as any).queryPermission({ mode: 'readwrite' });
                if (permission !== 'granted') {
                    if (promptUserIfNeeded) {
                        const newPerm = await (dirHandle as any).requestPermission({ mode: 'readwrite' });
                        if (newPerm !== 'granted') dirHandle = null;
                    } else {
                        dirHandle = null;
                    }
                }
            }

            if (!dirHandle && promptUserIfNeeded) {
                dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
                await saveHandleToIDB(dirHandle as any);
            }

            if (dirHandle) {
                this.handle = dirHandle;
                await this.loadDatabase();
                this.isInitialized = true;

                // Try restore session from localStorage
                const savedSession = localStorage.getItem('local-session');
                if (savedSession) {
                    const sessionData = JSON.parse(savedSession);
                    const userEx = this.state.users.find(u => u.id === sessionData.user.id);
                    if (userEx) {
                        this.activeSessionUser = userEx;
                    } else {
                        localStorage.removeItem('local-session');
                    }
                }

                return true;
            }
            return false;
        } catch (e) {
            console.error('Error init filesystem:', e);
            return false;
        }
    }

    private async loadDatabase() {
        if (!this.handle) return;
        try {
            const fileHandle = await this.handle.getFileHandle(DB_FILE_NAME, { create: true });
            const file = await fileHandle.getFile();
            const text = await file.text();
            if (text) {
                this.state = JSON.parse(text);
                // Migrate missing tables
                if (!this.state.actuaciones) this.state.actuaciones = [];
                if (!this.state.clients) this.state.clients = [];
            } else {
                // First time setup
                await this.saveDatabase();
            }
        } catch (e) {
            console.error('Error loading DB:', e);
            // Fallback to default
            this.state = JSON.parse(JSON.stringify(DEFAULT_DB));
            await this.saveDatabase();
        }
    }

    private async saveDatabase() {
        if (!this.handle) return;
        try {
            const fileHandle = await this.handle.getFileHandle(DB_FILE_NAME, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(this.state, null, 2));
            await writable.close();
        } catch (e) {
            console.error('Error saving DB:', e);
        }
    }

    // Storage: Save files per user
    async saveFile(base64: string, folderName: string, prefix: string = 'file'): Promise<string | null> {
        if (!this.handle) return null;
        try {
            const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) return null;

            const mime = matches[1];
            const dataBase64 = matches[2];
            const extMap: any = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' };
            const ext = extMap[mime] || 'bin';

            // Convert base64 to Blob
            const byteCharacters = atob(dataBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mime });

            const safeFolderName = folderName.replace(/[^a-z0-9]/gi, '_');

            // Get or create Archives folder
            let archivesHandle;
            try { archivesHandle = await this.handle.getDirectoryHandle('Archivos', { create: true }); }
            catch { archivesHandle = this.handle; }

            // Get or create User folder
            let userHandle;
            try { userHandle = await archivesHandle.getDirectoryHandle(safeFolderName, { create: true }); }
            catch { userHandle = archivesHandle; }

            const fileName = `${prefix}_${Date.now()}.${ext}`;
            const fileHandle = await userHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();

            // We must return a way to read it back. We can return an internal URI, 
            // but browsers can't serve local files by paths. We have to read and serve as ObjectURL or keep Base64.
            // Actuallly, for PDFs/Avatars in a PWA without an internal server, we need to load them as ObjectURLs directly.
            // For now, let's just return a placeholder or the base64 itself so UI doesn't break.
            // Vercel apps cannot serve from C:/...
            return base64; // Storing the base64 in JSON guarantees it reads back, but writes large JSON.
            // However, we just DID save it to the local physical folder so the user has the actual PDF!
        } catch (e) {
            console.error('Error saving physical file:', e);
            return base64; // Fallback
        }
    }

    // -------- SUPABASE API MIRROR --------

    from(table: keyof DBState) {
        let queryParams: any = {};
        let pendingAction: any = null;

        const execute = async () => {
            if (!this.isInitialized) {
                return { data: null, error: { message: "Carpeta no inicializada. Por favor, selecciona una carpeta raíz primero." } };
            }

            let collection = this.state[table] || [];

            if (pendingAction) {
                if (pendingAction.type === 'update') {
                    if (pendingAction.id) {
                        const index = collection.findIndex(item => item.id == pendingAction.id || item.id === pendingAction.id);
                        if (index > -1) {
                            collection[index] = { ...collection[index], ...pendingAction.body };
                            await this.saveDatabase();
                        }
                    } else if (pendingAction.column && pendingAction.val) {
                        // Update by other eq
                        let updated = false;
                        collection.forEach((item, i) => {
                            if (item[pendingAction.column] === pendingAction.val) {
                                collection[i] = { ...collection[i], ...pendingAction.body };
                                updated = true;
                            }
                        });
                        if (updated) await this.saveDatabase();
                    }
                    return { data: collection, error: null };
                } else if (pendingAction.type === 'delete') {
                    if (pendingAction.id) {
                        this.state[table] = collection.filter(item => item.id != pendingAction.id);
                    } else if (pendingAction.column && pendingAction.val) {
                        this.state[table] = collection.filter(item => item[pendingAction.column] != pendingAction.val);
                    }
                    await this.saveDatabase();
                    return { data: null, error: null };
                } else if (pendingAction.type === 'insert') {
                    let newItem = { ...pendingAction.body };

                    // If it's a "parte", physically save the PDF and Avatar
                    if (table === 'partes' && newItem.pdf_file) {
                        // Find user to use as folder name
                        const userNameStr = newItem.created_by || 'Sistema';
                        const saved = await this.saveFile(newItem.pdf_file, userNameStr, 'parte');
                        newItem.pdf_file = saved;
                    }

                    this.state[table].push(newItem);
                    await this.saveDatabase();
                    return { data: [newItem], error: null };
                }
            }

            // SELECT
            let results = [...collection];

            // apply eq filters
            for (const key of Object.keys(queryParams)) {
                if (key === 'order' || key === 'select') continue;
                results = results.filter(item => item[key] == queryParams[key]);
            }

            // apply order (simple mock)
            if (queryParams.order) {
                const { column, asc } = queryParams.order;
                results.sort((a, b) => {
                    if (a[column] < b[column]) return asc ? -1 : 1;
                    if (a[column] > b[column]) return asc ? 1 : -1;
                    return 0;
                });
            }

            return { data: results, error: null };
        };

        const builder = {
            select: () => builder,
            order: (col: string, opts: any) => {
                queryParams.order = { column: col, asc: opts?.ascending !== false };
                return builder;
            },
            eq: (col: string, val: any) => {
                if (pendingAction && (pendingAction.type === 'update' || pendingAction.type === 'delete') && col === 'id') {
                    pendingAction.id = val;
                } else if (pendingAction && (pendingAction.type === 'update' || pendingAction.type === 'delete')) {
                    pendingAction.column = col;
                    pendingAction.val = val;
                } else {
                    queryParams[col] = val;
                }
                return builder;
            },
            insert: (row: any) => {
                pendingAction = { type: 'insert', body: row };
                return execute();
            },
            update: (updates: any) => {
                pendingAction = { type: 'update', body: updates };
                return builder;
            },
            delete: () => {
                pendingAction = { type: 'delete' };
                return builder;
            },
            then: (resolve: any) => {
                execute().then(resolve);
            }
        };

        return builder;
    }

    auth = {
        getSession: async () => {
            if (!this.activeSessionUser) {
                return { data: { session: null }, error: null };
            }
            return { data: { session: { user: this.activeSessionUser } }, error: null };
        },
        getUser: async () => {
            return { data: { user: this.activeSessionUser }, error: null };
        },
        signInWithPassword: async ({ email, password }: any) => {
            if (!this.isInitialized) {
                return { data: { user: null }, error: { message: "Carpeta de datos local no seleccionada." } };
            }
            const user = this.state.users.find(u => u.email === email && u.password === password);
            if (user) {
                this.activeSessionUser = user;
                localStorage.setItem('local-session', JSON.stringify({ user }));
                return { data: { user }, error: null };
            }
            return { data: { user: null }, error: { message: "Credenciales incorrectas" } };
        },
        signUp: async ({ email, password, options }: any) => {
            if (this.state.users.find(u => u.email === email)) {
                return { data: null, error: { message: "User already exists" } };
            }
            const newUser = {
                id: crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`,
                email,
                password,
                role: options?.data?.role || 'user',
                user_metadata: options?.data || {},
                created_at: new Date().toISOString()
            };
            this.state.users.push(newUser);
            await this.saveDatabase();
            return { data: { user: newUser }, error: null };
        },
        signOut: async () => {
            this.activeSessionUser = null;
            localStorage.removeItem('local-session');
            return { error: null };
        },
        updateUser: async ({ data, password }: any) => {
            if (!this.activeSessionUser) return { error: { message: "No session" } };

            const index = this.state.users.findIndex(u => u.id === this.activeSessionUser.id);
            if (index > -1) {
                if (data) {
                    this.state.users[index].user_metadata = { ...this.state.users[index].user_metadata, ...data };
                }
                if (password) {
                    this.state.users[index].password = password;
                }
                this.activeSessionUser = this.state.users[index];
                localStorage.setItem('local-session', JSON.stringify({ user: this.activeSessionUser }));
                await this.saveDatabase();
                return { data: { user: this.activeSessionUser }, error: null };
            }
            return { error: { message: "User not found" } };
        }
    };
}

export const localDb = new FileSystemAdapter();

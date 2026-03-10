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

const dateIso = new Date().toISOString();

const DEFAULT_DB: DBState = {
    users: [
        {
            id: 'usr-jmolin01',
            email: 'jmolin01@melilla.es',
            password: 'admin',
            role: 'admin',
            user_metadata: { full_name: 'J. Molin' },
            created_at: dateIso
        },
        {
            id: 'usr-mferna04',
            email: 'mferna04@melilla.es',
            password: 'user',
            role: 'user',
            user_metadata: { full_name: 'M. Ferna' },
            created_at: dateIso
        },
        {
            id: 'usr-rlopez02',
            email: 'rlopez02@melilla.es',
            password: 'user',
            role: 'user',
            user_metadata: { full_name: 'R. Lopez' },
            created_at: dateIso
        },
        {
            id: 'usr-mflore01',
            email: 'mflore01@melilla.es',
            password: 'user',
            role: 'user',
            user_metadata: { full_name: 'M. Flore' },
            created_at: dateIso
        },
        {
            id: 'usr-mcobo01',
            email: 'mcobo01@melilla.es',
            password: 'user',
            role: 'user',
            user_metadata: { full_name: 'M. Cobo' },
            created_at: dateIso
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
            // Try restore session from localStorage immediately so getSession works
            const savedSession = localStorage.getItem('local-session');
            if (savedSession) {
                try {
                    const sessionData = JSON.parse(savedSession);
                    if (sessionData && sessionData.user) {
                        this.activeSessionUser = sessionData.user;
                    }
                } catch (e) { console.warn("Error parsing session:", e); }
            }

            let dirHandle = await getHandleFromIDB();

            if (dirHandle) {
                // Verify permission
                const permission = await (dirHandle as any).queryPermission({ mode: 'readwrite' });
                if (permission !== 'granted') {
                    if (promptUserIfNeeded) {
                        try {
                            const newPerm = await (dirHandle as any).requestPermission({ mode: 'readwrite' });
                            if (newPerm !== 'granted') dirHandle = null;
                        } catch (err) {
                            console.warn('Browser denied requestPermission or missing user gesture:', err);
                            dirHandle = null;
                        }
                    } else {
                        // Keep handle to request permission later
                        this.handle = dirHandle;
                        return false;
                    }
                }
            }

            if (!dirHandle && promptUserIfNeeded) {
                try {
                    dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
                    await saveHandleToIDB(dirHandle as any);
                } catch (err) {
                    console.warn('User cancelled folder selection:', err);
                    return false;
                }
            }

            if (dirHandle) {
                this.handle = dirHandle;
                await this.loadDatabase();
                this.isInitialized = true;

                // Validate session against real DB
                if (this.activeSessionUser) {
                    const userEx = this.state.users.find(u => u.id === this.activeSessionUser.id);
                    if (userEx) {
                        this.activeSessionUser = userEx;
                    } else {
                        this.activeSessionUser = null;
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

            let loadedState: DBState;
            if (text && text.trim().startsWith('{')) {
                try {
                    loadedState = JSON.parse(text);
                    // Migrate missing tables
                    if (!loadedState.users) loadedState.users = [];
                    if (!loadedState.partes) loadedState.partes = [];
                    if (!loadedState.actuaciones) loadedState.actuaciones = [];
                    if (!loadedState.clients) loadedState.clients = [];
                } catch (e) {
                    console.error("Malformed JSON in database.json, resetting to default.", e);
                    loadedState = JSON.parse(JSON.stringify(DEFAULT_DB));
                }
            } else {
                loadedState = JSON.parse(JSON.stringify(DEFAULT_DB));
            }

            console.log('FSA: Base de datos cargada. Usuarios actuales:', loadedState.users.map(u => u.email));

            // Sync predefined users (Upsert)
            let modified = !text;

            DEFAULT_DB.users.forEach(defUser => {
                const existingIndex = loadedState.users.findIndex(u => u.email === defUser.email);
                if (existingIndex === -1) {
                    loadedState.users.push(defUser);
                    modified = true;
                }
            });

            // Remove old default admin if it's there and not in the new list
            const oldAdmin = loadedState.users.findIndex(u => u.id === 'admin-id' || u.email === 'admin@admin.com');
            if (oldAdmin > -1) {
                loadedState.users.splice(oldAdmin, 1);
                modified = true;
            }

            this.state = loadedState;

            // Run migration for existing base64 data
            const migrationCount = await this.migrateBase64ToFiles();
            if (migrationCount > 0) {
                console.log(`FSA: Migrados ${migrationCount} archivos base64 a archivos físicos.`);
                modified = true;
            }

            if (modified) {
                await this.saveDatabase();
            }
        } catch (e) {
            console.error('Error loading DB:', e);
            // Fallback to default
            this.state = JSON.parse(JSON.stringify(DEFAULT_DB));
            await this.saveDatabase();
        }
    }

    /**
     * Scans through partes and users to find any base64 strings and migrate them to physical files.
     */
    private async migrateBase64ToFiles(): Promise<number> {
        let count = 0;
        if (!this.state) return 0;

        // 1. Migrate Partes PDFs
        for (const parte of this.state.partes) {
            if (parte.pdf_file && parte.pdf_file.startsWith('data:')) {
                const userName = parte.created_by || 'Sistema';
                const path = await this.saveFile(parte.pdf_file, userName, 'parte');
                if (path && path.startsWith('local://')) {
                    parte.pdf_file = path;
                    count++;
                }
            }
            if (parte.pdf_file_signed && parte.pdf_file_signed.startsWith('data:')) {
                const userName = parte.created_by || 'Sistema';
                const path = await this.saveFile(parte.pdf_file_signed, userName, 'parte_signed');
                if (path && path.startsWith('local://')) {
                    parte.pdf_file_signed = path;
                    count++;
                }
            }
        }

        // 2. Migrate User Avatars
        for (const user of this.state.users) {
            if (user.avatar_url && user.avatar_url.startsWith('data:')) {
                const userName = user.user_metadata?.full_name || user.name || 'Avatar';
                const path = await this.saveFile(user.avatar_url, userName, 'avatar');
                if (path && path.startsWith('local://')) {
                    user.avatar_url = path;
                    count++;
                }
            }
        }

        return count;
    }

    private async saveDatabase() {
        if (!this.handle) return;
        try {
            console.log("FSA: Guardando base de datos...");
            const fileHandle = await this.handle.getFileHandle(DB_FILE_NAME, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(this.state, null, 2));
            await writable.close();
            console.log("FSA: Base de datos guardada con éxito.");
        } catch (e) {
            console.error('Error saving DB:', e);
        }
    }

    /**
     * getFileUrl retrieves a physical file from the handle and returns a temporary URL (Blob URL)
     * This is used to preview PDFs or images without storing base64 in the JSON.
     */
    async getFileUrl(path: string): Promise<string | null> {
        if (!this.handle || !path) return null;
        if (!path.startsWith('local://')) return path; // Already a URL or base64

        try {
            const relativePath = path.replace('local://', '');
            const parts = relativePath.split('/');

            let currentHandle: any = this.handle;
            for (let i = 0; i < parts.length - 1; i++) {
                currentHandle = await currentHandle.getDirectoryHandle(parts[i]);
            }

            const fileName = parts[parts.length - 1];
            const fileHandle = await currentHandle.getFileHandle(fileName);
            const file = await fileHandle.getFile();
            return URL.createObjectURL(file);
        } catch (e) {
            console.error("Error retrieving file for preview:", e);
            return null;
        }
    }

    // Storage: Save files per user physically
    async saveFile(base64: string, folderName: string, prefix: string = 'file'): Promise<string | null> {
        if (!this.handle) return null;
        if (!base64 || !base64.startsWith('data:')) return base64; // Not base64 or already a path

        try {
            const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) return base64;

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

            // Return a "virtual" relative path to store in JSON
            return `local://Archivos/${safeFolderName}/${fileName}`;
        } catch (e) {
            console.error('Error saving physical file:', e);
            // If failed, return null to avoid bloating JSON with base64 if it's too large
            // or return base64 if it's small (avatar), but for PDF we prefer relative paths.
            return base64.length > 50000 ? null : base64;
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
                            // If updating file paths
                            const userName = this.activeSessionUser?.user_metadata?.full_name || 'Sistema';

                            if (pendingAction.body.pdf_file && pendingAction.body.pdf_file.startsWith('data:')) {
                                pendingAction.body.pdf_file = await this.saveFile(pendingAction.body.pdf_file, userName, 'parte');
                            }
                            if (pendingAction.body.pdf_file_signed && pendingAction.body.pdf_file_signed.startsWith('data:')) {
                                pendingAction.body.pdf_file_signed = await this.saveFile(pendingAction.body.pdf_file_signed, userName, 'parte_signed');
                            }

                            collection[index] = { ...collection[index], ...pendingAction.body };
                            await this.saveDatabase();
                        }
                    } else if (pendingAction.column && pendingAction.val) {
                        // Update by other eq
                        let updated = false;
                        for (let i = 0; i < collection.length; i++) {
                            if (collection[i][pendingAction.column] === pendingAction.val) {
                                collection[i] = { ...collection[i], ...pendingAction.body };
                                updated = true;
                            }
                        }
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

                    // Physically save the PDF/Avatar if present
                    if (newItem.pdf_file && newItem.pdf_file.startsWith('data:')) {
                        const userName = newItem.created_by || this.activeSessionUser?.user_metadata?.full_name || 'Sistema';
                        newItem.pdf_file = await this.saveFile(newItem.pdf_file, userName, 'parte');
                    }
                    if (newItem.pdf_file_signed && newItem.pdf_file_signed.startsWith('data:')) {
                        const userName = newItem.created_by || this.activeSessionUser?.user_metadata?.full_name || 'Sistema';
                        newItem.pdf_file_signed = await this.saveFile(newItem.pdf_file_signed, userName, 'parte_signed');
                    }
                    if (newItem.avatar_url && newItem.avatar_url.startsWith('data:')) {
                        const userName = newItem.user_metadata?.full_name || 'Avatar';
                        newItem.avatar_url = await this.saveFile(newItem.avatar_url, userName, 'avatar');
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
                const checked = await this.init(true);
                if (!checked) return { data: { user: null }, error: { message: "Carpeta de datos local no seleccionada." } };
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
                return { data: null, error: { message: "El usuario ya existe" } };
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
            if (!this.activeSessionUser) return { error: { message: "No hay sesión activa" } };

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
            return { error: { message: "Usuario no encontrado" } };
        }
    };
}

export const localDb = new FileSystemAdapter();

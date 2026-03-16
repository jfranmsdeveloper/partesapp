// Using native crypto.randomUUID instead of external uuid library

export const DB_FILE_NAME = 'database.json';
export const SESSION_FILE_NAME = 'session.json';
export const IDB_STORE = 'PartesAppStore';
export const IDB_KEY = 'rootDirectoryHandle';

// ---------------------------------------------------------------------------
// IndexedDB helpers — persist the root folder handle across sessions
// ---------------------------------------------------------------------------
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

export async function clearHandleFromIDB(): Promise<void> {
    return new Promise((resolve) => {
        const req = indexedDB.open('PartesAppDB', 1);
        req.onupgradeneeded = () => {
            req.result.createObjectStore(IDB_STORE);
        };
        req.onsuccess = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(IDB_STORE)) {
                resolve();
                return;
            }
            const tx = db.transaction(IDB_STORE, 'readwrite');
            const store = tx.objectStore(IDB_STORE);
            store.delete(IDB_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
        };
        req.onerror = () => resolve();
    });
}

// ---------------------------------------------------------------------------
// DB schema
// ---------------------------------------------------------------------------
interface DBState {
    users: any[];
    partes: any[];
    actuaciones: any[];
    clients: any[];
    snippets: any[];
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
    clients: [],
    snippets: []
};

// ---------------------------------------------------------------------------
// Helper: derive a safe folder name from an email
//   "jmolin01@melilla.es" → "jmolin01"
// ---------------------------------------------------------------------------
function userFolderName(email: string): string {
    return email.split('@')[0].replace(/[^a-z0-9_\-]/gi, '_');
}

// ---------------------------------------------------------------------------
// FileSystemAdapter — wraps the File System Access API as a Supabase-like client
// ---------------------------------------------------------------------------
class FileSystemAdapter {
    private handle: FileSystemDirectoryHandle | null = null;
    private state: DBState = JSON.parse(JSON.stringify(DEFAULT_DB));
    public isInitialized = false;
    /** True when IndexedDB has a stored handle but the browser needs a user gesture to re-grant permission */
    public hasPendingHandle = false;
    private activeSessionUser: any = null;
    /** The username inferred from the last session file found (used to speed up reconnect) */
    private pendingUsername: string | null = null;
    private lastLoadTime: number = 0;

    // -----------------------------------------------------------------------
    // init — restore or acquire the root folder handle
    //   promptUserIfNeeded = true  → show directory picker if not stored yet
    //   promptUserIfNeeded = false → silent check only (used by checkSession)
    // -----------------------------------------------------------------------
    async init(promptUserIfNeeded = false): Promise<boolean> {
        if (!('showDirectoryPicker' in window)) {
            alert('Tu navegador no soporta File System Access API. Usa Chrome o Edge en PC/Mac.');
            return false;
        }

        try {
            let dirHandle = await getHandleFromIDB();

            if (dirHandle) {
                // Check current permission status
                const permission = await (dirHandle as any).queryPermission({ mode: 'readwrite' });

                if (permission !== 'granted') {
                    if (promptUserIfNeeded) {
                        // requestPermission needs a user gesture — it works when called
                        // from a button click handler (loginUser / checkSession from App mount).
                        try {
                            const newPerm = await (dirHandle as any).requestPermission({ mode: 'readwrite' });
                            if (newPerm !== 'granted') dirHandle = null;
                        } catch (err) {
                            console.warn('requestPermission failed or no user gesture:', err);
                            dirHandle = null;
                        }
                    } else {
                        // Silent check: keep handle but mark as not fully initialised yet
                        this.handle = dirHandle;
                        this.hasPendingHandle = true;
                        return false;
                    }
                }
            }

            // No stored handle (or permission denied) and we can prompt → show picker once
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
                this.hasPendingHandle = false;
                await this.loadDatabase();
                this.isInitialized = true;

                // Try to restore session from the file-based session.json
                await this.restoreSessionFromFile();

                return true;
            }

            return false;
        } catch (e) {
            console.error('Error init filesystem:', e);
            return false;
        }
    }

    // -----------------------------------------------------------------------
    // Session persistence — read/write <username>/session.json
    // -----------------------------------------------------------------------

    /** Read session.json for a given username folder. Returns null if not found. */
    private async readSessionFile(username: string): Promise<any | null> {
        if (!this.handle) return null;
        try {
            const userDir = await this.handle.getDirectoryHandle(username, { create: false });
            const fileHandle = await userDir.getFileHandle(SESSION_FILE_NAME, { create: false });
            const file = await fileHandle.getFile();
            const text = await file.text();
            return text ? JSON.parse(text) : null;
        } catch {
            return null;
        }
    }

    /** Write session data to <username>/session.json */
    private async writeSessionFile(username: string, sessionData: any): Promise<void> {
        if (!this.handle) return;
        try {
            // Ensure the user folder exists
            const userDir = await this.handle.getDirectoryHandle(username, { create: true });
            const fileHandle = await userDir.getFileHandle(SESSION_FILE_NAME, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(sessionData, null, 2));
            await writable.close();
            console.log(`FSA: session.json guardado en ${username}/`);
        } catch (e) {
            console.error('Error writing session file:', e);
        }
    }

    /** Delete <username>/session.json (on logout) */
    private async deleteSessionFile(username: string): Promise<void> {
        if (!this.handle) return;
        try {
            const userDir = await this.handle.getDirectoryHandle(username, { create: false });
            await userDir.removeEntry(SESSION_FILE_NAME);
        } catch {
            // File might not exist, that's fine
        }
    }

    /**
     * After the folder is successfully opened, scan all user folders for a valid session.
     * This replaces the old localStorage-based restore.
     */
    private async restoreSessionFromFile(): Promise<void> {
        if (!this.handle) return;

        // We iterate over known users to find whose session.json exists and is valid
        for (const user of this.state.users) {
            const uname = userFolderName(user.email);
            const session = await this.readSessionFile(uname);
            if (session && session.userId) {
                // Validate against DB
                const dbUser = this.state.users.find(u => u.id === session.userId);
                if (dbUser) {
                    this.activeSessionUser = dbUser;
                    this.pendingUsername = uname;
                    console.log(`FSA: sesión restaurada para ${dbUser.email}`);
                    return;
                }
            }
        }

        // No valid session found
        this.activeSessionUser = null;
        this.pendingUsername = null;
    }

    /**
     * Called from the Login page reconnect button.
     * Requests folder permission (needs user gesture) and then restores the session.
     * Returns true if session was successfully restored.
     */
    async requestPermissionAndRestore(): Promise<boolean> {
        const ready = await this.init(true);
        return ready && !!this.activeSessionUser;
    }

    /** Returns the email of the user whose session.json was found, if any. */
    get pendingSessionEmail(): string | null {
        if (!this.pendingUsername) return null;
        const user = this.state.users.find(u => userFolderName(u.email) === this.pendingUsername);
        return user?.email || null;
    }

    // -----------------------------------------------------------------------
    // Database load / save
    // -----------------------------------------------------------------------

    private async loadDatabase(force = false) {
        if (!this.handle) return;
        
        // Simple throttle: don't reload if we just loaded in the last 500ms (unless forced)
        const now = Date.now();
        if (!force && now - this.lastLoadTime < 500) return;

        try {
            const fileHandle = await this.handle.getFileHandle(DB_FILE_NAME, { create: true });
            const file = await fileHandle.getFile();
            const text = await file.text();
            this.lastLoadTime = Date.now();

            let loadedState: DBState;
            if (text && text.trim().startsWith('{')) {
                try {
                    loadedState = JSON.parse(text);
                    if (!loadedState.users) loadedState.users = [];
                    if (!loadedState.partes) loadedState.partes = [];
                    if (!loadedState.actuaciones) loadedState.actuaciones = [];
                    if (!loadedState.clients) loadedState.clients = [];
                    if (!loadedState.snippets) loadedState.snippets = [];
                } catch (e) {
                    console.error('Malformed JSON in database.json, resetting to default.', e);
                    loadedState = JSON.parse(JSON.stringify(DEFAULT_DB));
                }
            } else {
                loadedState = JSON.parse(JSON.stringify(DEFAULT_DB));
            }

            console.log('FSA: Base de datos cargada. Usuarios:', loadedState.users.map(u => u.email));

            // Upsert predefined users
            let modified = !text;
            DEFAULT_DB.users.forEach(defUser => {
                const existingIndex = loadedState.users.findIndex(u => u.email === defUser.email);
                if (existingIndex === -1) {
                    loadedState.users.push(defUser);
                    modified = true;
                }
            });

            // Remove old default admin
            const oldAdmin = loadedState.users.findIndex(u => u.id === 'admin-id' || u.email === 'admin@admin.com');
            if (oldAdmin > -1) {
                loadedState.users.splice(oldAdmin, 1);
                modified = true;
            }

            this.state = loadedState;

            // Run migrations
            let migrationModified = false;
            
            // 1. Migrate base64 to files
            const migrationCount = await this.migrateBase64ToFiles();
            if (migrationCount > 0) {
                console.log(`FSA: Migrados ${migrationCount} archivos base64 a archivos físicos.`);
                migrationModified = true;
            }

            // 2. Migrate missing IDs for legacy data
            const idMigrationCount = this.migrateMissingIds();
            if (idMigrationCount > 0) {
                console.log(`FSA: Migrados ${idMigrationCount} registros con IDs faltantes.`);
                migrationModified = true;
            }

            if (modified || migrationModified) {
                await this.saveDatabase();
            }
        } catch (e) {
            console.error('Error loading DB:', e);
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

        for (const parte of this.state.partes) {
            if (parte.pdf_file && parte.pdf_file.startsWith('data:')) {
                const userName = parte.created_by || 'Sistema';
                const path = await this.saveFile(parte.pdf_file, userName, 'parte');
                if (path && path.startsWith('local://')) { parte.pdf_file = path; count++; }
            }
            if (parte.pdf_file_signed && parte.pdf_file_signed.startsWith('data:')) {
                const userName = parte.created_by || 'Sistema';
                const path = await this.saveFile(parte.pdf_file_signed, userName, 'parte_signed');
                if (path && path.startsWith('local://')) { parte.pdf_file_signed = path; count++; }
            }
        }

        for (const user of this.state.users) {
            if (user.avatar_url && user.avatar_url.startsWith('data:')) {
                const userName = user.user_metadata?.full_name || user.name || 'Avatar';
                const path = await this.saveFile(user.avatar_url, userName, 'avatar');
                if (path && path.startsWith('local://')) { user.avatar_url = path; count++; }
            }
        }

        return count;
    }

    /**
     * Ensures all existing records (partes, actuaciones, clients) have unique IDs.
     */
    private migrateMissingIds(): number {
        let count = 0;
        if (!this.state) return 0;

        const generateId = (prefix: string) => crypto.randomUUID ? crypto.randomUUID() : `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

        // For partes, try to keep numeric sequence if possible
        this.state.partes.forEach(p => {
            if (!p.id) {
                const manualIds = this.state.partes
                    .filter(part => typeof part.id === 'string' && part.id.startsWith('MAN-'))
                    .map(part => parseInt((part.id as string).split('-')[1]))
                    .filter(num => !isNaN(num));
                
                const maxManual = manualIds.length > 0 ? Math.max(...manualIds) : 0;
                p.id = `MAN-${maxManual + 1}`;
                count++;
            }
        });

        this.state.actuaciones.forEach(a => {
            if (!a.id) { a.id = generateId('act'); count++; }
        });

        this.state.clients.forEach(c => {
            if (!c.id) { c.id = generateId('client'); count++; }
        });
        
        this.state.snippets.forEach(s => {
            if (!s.id) { s.id = generateId('snip'); count++; }
        });

        return count;
    }

    private async saveDatabase(): Promise<boolean> {
        if (!this.handle) return false;
        try {
            console.log('FSA: Guardando base de datos...');
            const fileHandle = await this.handle.getFileHandle(DB_FILE_NAME, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(this.state, null, 2));
            await writable.close();
            console.log('FSA: Base de datos guardada con éxito.');
            return true;
        } catch (e) {
            console.error('Error saving DB:', e);
            return false;
        }
    }

    // -----------------------------------------------------------------------
    // File helpers
    // -----------------------------------------------------------------------

    async getFileUrl(path: string): Promise<string | null> {
        if (!this.handle || !path) return null;
        if (!path.startsWith('local://')) return path;

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
            console.error('Error retrieving file for preview:', e);
            return null;
        }
    }

    async saveFile(base64: string, folderName: string, prefix: string = 'file'): Promise<string | null> {
        if (!this.handle) return null;
        if (!base64 || !base64.startsWith('data:')) return base64;

        try {
            const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) return base64;

            const mime = matches[1];
            const dataBase64 = matches[2];
            const extMap: any = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' };
            const ext = extMap[mime] || 'bin';

            const byteCharacters = atob(dataBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mime });

            const safeFolderName = folderName.replace(/[^a-z0-9]/gi, '_');

            let archivesHandle;
            try { archivesHandle = await this.handle.getDirectoryHandle('Archivos', { create: true }); }
            catch { archivesHandle = this.handle; }

            let userHandle;
            try { userHandle = await archivesHandle.getDirectoryHandle(safeFolderName, { create: true }); }
            catch { userHandle = archivesHandle; }

            const fileName = `${prefix}_${Date.now()}.${ext}`;
            const fileHandle = await userHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();

            return `local://Archivos/${safeFolderName}/${fileName}`;
        } catch (e) {
            console.error('Error saving physical file:', e);
            return base64.length > 50000 ? null : base64;
        }
    }


    // -----------------------------------------------------------------------
    // Supabase-compatible API
    // -----------------------------------------------------------------------

    from(table: keyof DBState) {
        let queryParams: any = {};
        let pendingAction: any = null;

        const execute = async () => {
            if (!this.isInitialized) {
                return { data: null, error: { message: 'Carpeta no inicializada. Por favor, inicia sesión primero.' } };
            }

            if (pendingAction) {
                // Ensure we have the latest data before any write operation (Read-Modify-Write)
                await this.loadDatabase(true);
            }

            let collection = this.state[table] || [];

            if (pendingAction) {
                if (pendingAction.type === 'update') {
                    if (pendingAction.id) {
                        const index = collection.findIndex((item: any) => String(item.id) === String(pendingAction.id));
                        if (index > -1) {
                            const userName = this.activeSessionUser?.user_metadata?.full_name || 'Sistema';

                            if (pendingAction.body.pdf_file && pendingAction.body.pdf_file.startsWith('data:')) {
                                pendingAction.body.pdf_file = await this.saveFile(pendingAction.body.pdf_file, userName, 'parte');
                            }
                            if (pendingAction.body.pdf_file_signed && pendingAction.body.pdf_file_signed.startsWith('data:')) {
                                pendingAction.body.pdf_file_signed = await this.saveFile(pendingAction.body.pdf_file_signed, userName, 'parte_signed');
                            }

                            collection[index] = { ...collection[index], ...pendingAction.body };
                            const ok = await this.saveDatabase();
                            if (!ok) return { data: null, error: { message: 'Error físico al escribir en el archivo. Verifica permisos.' } };
                        }
                    } else if (pendingAction.column && pendingAction.val) {
                        let updated = false;
                        for (let i = 0; i < collection.length; i++) {
                            if (collection[i][pendingAction.column] === pendingAction.val) {
                                collection[i] = { ...collection[i], ...pendingAction.body };
                                updated = true;
                            }
                        }
                        if (updated) {
                            const ok = await this.saveDatabase();
                            if (!ok) return { data: null, error: { message: 'Error físico al escribir en el archivo.' } };
                        }
                    }
                    return { data: collection, error: null };

                } else if (pendingAction.type === 'delete') {
                    if (pendingAction.id) {
                        this.state[table] = collection.filter((item: any) => String(item.id) !== String(pendingAction.id));
                    } else if (pendingAction.inValues && pendingAction.column) {
                        const vals = pendingAction.inValues.map((v: any) => String(v));
                        this.state[table] = collection.filter((item: any) => !vals.includes(String(item[pendingAction.column])));
                    } else if (pendingAction.column && pendingAction.val) {
                        this.state[table] = collection.filter((item: any) => String(item[pendingAction.column]) !== String(pendingAction.val));
                    }
                    const ok = await this.saveDatabase();
                    if (!ok) return { data: null, error: { message: 'Error físico al escribir en el archivo.' } };
                    return { data: null, error: null };

                } else if (pendingAction.type === 'insert') {
                    let newItem = { ...pendingAction.body };

                    // Ensure ID generation if missing
                    if (!newItem.id) {
                        if (table === 'partes') {
                            // If it doesn't have a PDF, it's a manual entry
                            const isManual = !newItem.pdf_file;
                            if (isManual) {
                                const manualIds = collection
                                    .filter((item: any) => typeof item.id === 'string' && item.id.startsWith('MAN-'))
                                    .map((item: any) => parseInt(item.id.split('-')[1]))
                                    .filter((num: number) => !isNaN(num));
                                const maxManual = manualIds.length > 0 ? Math.max(...manualIds) : 0;
                                newItem.id = `MAN-${maxManual + 1}`;
                            } else {
                                const numericIds = collection
                                    .map((item: any) => {
                                        const raw = item.id;
                                        if (typeof raw === 'number') return raw;
                                        if (typeof raw === 'string' && !raw.startsWith('MAN-')) return parseInt(raw);
                                        return NaN;
                                    })
                                    .filter((id: number) => !isNaN(id));
                                const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
                                newItem.id = String(maxId + 1);
                            }
                        } else {
                            newItem.id = crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        }
                    }

                    // PREVENT DUPLICATES: Check if ID already exists
                    const exists = collection.some((item: any) => String(item.id) === String(newItem.id));
                    if (exists) {
                        return { data: null, error: { message: `Ya existe un registro con el ID ${newItem.id}.` } };
                    }

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
                    const ok = await this.saveDatabase();
                    if (!ok) return { data: null, error: { message: 'Error físico al escribir en el archivo.' } };
                    return { data: [newItem], error: null };
                }
            }

            // SELECT
            let results = [...collection];

            for (const key of Object.keys(queryParams)) {
                if (key === 'order' || key === 'select' || key === 'inValues') continue;
                results = results.filter((item: any) => String(item[key]) === String(queryParams[key]));
            }

            if (queryParams.inValues && queryParams.inColumn) {
                const vals = queryParams.inValues.map((v: any) => String(v));
                results = results.filter((item: any) => vals.includes(String(item[queryParams.inColumn])));
            }

            if (queryParams.order) {
                const { column, asc } = queryParams.order;
                results.sort((a: any, b: any) => {
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
            in: (col: string, vals: any[]) => {
                if (pendingAction && (pendingAction.type === 'update' || pendingAction.type === 'delete')) {
                    pendingAction.column = col;
                    pendingAction.inValues = vals;
                } else {
                    queryParams.inColumn = col;
                    queryParams.inValues = vals;
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
            // Step 1: Validate credentials against the in-memory DEFAULT_DB first
            // (database might not be loaded yet if folder wasn't selected before)
            const defaultUser = DEFAULT_DB.users.find(u => u.email === email && u.password === password);
            if (!defaultUser) {
                // Not a predefined user. We MUST have the folder to check the DB.
                if (!this.isInitialized) {
                    console.log('FSA: Usuario no es predefinido, solicitando carpeta...');
                    const ready = await this.init(true);
                    if (!ready) {
                        return { data: { user: null }, error: { message: 'Inicia sesión o selecciona la carpeta donde están tus datos.' } };
                    }
                }
                
                // Now check in the (newly) loaded state
                const user = this.state.users.find((u: any) => u.email === email && u.password === password);
                if (!user) {
                    return { data: { user: null }, error: { message: 'Credenciales incorrectas' } };
                }
            }

            // Step 2: Ensure folder is accessible for predefined users too
            if (!this.isInitialized) {
                const ready = await this.init(true);
                if (!ready) {
                    return { data: { user: null }, error: { message: 'Es necesario seleccionar la carpeta de datos para continuar.' } };
                }
            }

            // Step 3: Find user in the now-loaded database
            const user = this.state.users.find((u: any) => u.email === email && u.password === password);
            if (!user) {
                return { data: { user: null }, error: { message: 'Credenciales incorrectas' } };
            }

            // Step 4: Create the user's personal subfolder and save session
            const uname = userFolderName(email);
            await this.ensureUserFolder(uname);
            await this.writeSessionFile(uname, { userId: user.id, email: user.email, loginAt: new Date().toISOString() });

            this.activeSessionUser = user;
            console.log(`FSA: sesión iniciada y guardada en ${uname}/session.json`);

            return { data: { user }, error: null };
        },

        signUp: async ({ email, password, options }: any) => {
            if (!this.isInitialized) {
                const ready = await this.init(true);
                if (!ready) return { data: null, error: { message: 'Carpeta de datos no seleccionada.' } };
            }
            if (this.state.users.find((u: any) => u.email === email)) {
                return { data: null, error: { message: 'El usuario ya existe' } };
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
            if (this.activeSessionUser) {
                const uname = userFolderName(this.activeSessionUser.email);
                await this.deleteSessionFile(uname);
            }
            this.activeSessionUser = null;
            this.handle = null;
            this.isInitialized = false;
            this.hasPendingHandle = false;
            this.pendingUsername = null;
            // Reset state to default
            this.state = JSON.parse(JSON.stringify(DEFAULT_DB));
            
            // Clear any legacy localStorage entry and all other browser storages
            try { 
                localStorage.clear(); 
                sessionStorage.clear();
            } catch { /* ignore */ }

            // Clear the stored directory handle so there is no trace of the connection
            try {
                await clearHandleFromIDB();
            } catch { /* ignore */ }

            return { error: null };
        },

        updateUser: async ({ data, password }: any) => {
            if (!this.activeSessionUser) return { error: { message: 'No hay sesión activa' } };

            const index = this.state.users.findIndex((u: any) => u.id === this.activeSessionUser.id);
            if (index > -1) {
                if (data) {
                    this.state.users[index].user_metadata = { ...this.state.users[index].user_metadata, ...data };
                }
                if (password) {
                    this.state.users[index].password = password;
                }
                this.activeSessionUser = this.state.users[index];

                // Refresh session file
                const uname = userFolderName(this.activeSessionUser.email);
                await this.writeSessionFile(uname, { userId: this.activeSessionUser.id, email: this.activeSessionUser.email, loginAt: new Date().toISOString() });

                await this.saveDatabase();
                return { data: { user: this.activeSessionUser }, error: null };
            }
            return { error: { message: 'Usuario no encontrado' } };
        }
    };

    // -----------------------------------------------------------------------
    // Ensure the user personal folder exists
    // -----------------------------------------------------------------------
    private async ensureUserFolder(username: string): Promise<void> {
        if (!this.handle) return;
        try {
            await this.handle.getDirectoryHandle(username, { create: true });
            console.log(`FSA: carpeta de usuario '${username}' asegurada.`);
        } catch (e) {
            console.error(`FSA: no se pudo crear la carpeta del usuario '${username}':`, e);
        }
    }
}

export const localDb = new FileSystemAdapter();

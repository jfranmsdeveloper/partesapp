// Adapts the Supabase client interface to our local Express API or PHP API
// For local PHP development, run: php -S localhost:8000 -t php-backend
// const API_URL = '/api'; // Old Node Url
const API_URL = 'http://localhost:8000'; // New PHP URL

// Helper for fetch wrapper
async function request(endpoint: string, method: string = 'GET', body?: any) {
    console.log(`[localClient] ${method} ${endpoint}`, body);
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
        const headers: any = { 'Content-Type': 'application/json' };
        const res = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal
        });
        clearTimeout(id);

        const text = await res.text();
        console.log(`[localClient] Response (${res.status}):`, text.substring(0, 200));

        let data;
        try {
            data = text ? JSON.parse(text) : null;
        } catch (parseError) {
            console.error('[localClient] JSON Parse Error:', parseError);
            const snippet = text.length > 50 ? text.substring(0, 50) + '...' : text;
            return { data: null, error: { message: `Server Error (${res.status}): ${snippet}` } };
        }

        if (!res.ok) {
            return { data: null, error: { message: data?.error || 'Request failed' } };
        }

        return { data, error: null };
    } catch (e: any) {
        clearTimeout(id);
        console.error('[localClient] Network/Fetch Error:', e);
        if (e.name === 'AbortError') {
            return { data: null, error: { message: 'Timeout: El servidor no responde.' } };
        }
        return { data: null, error: { message: e.message } };
    }
}

class QueryBuilder {
    private table: string;
    private queryParams: any = {};
    private pendingAction: { type: 'update' | 'delete', body?: any, id?: any } | null = null;

    constructor(table: string) {
        this.table = table;
    }

    select(_columns: string = '*') {
        return this;
    }

    order(_column: string, { ascending: _ascending = true } = {}) {
        // Our mock server might not support complex sorting via params perfectly yet, 
        // but let's pass it anyway or handle it client side if needed. 
        // For now, simple implementation:
        // this.queryParams.order = `${column}.${ascending ? 'asc' : 'desc'}`;
        return this;
    }

    eq(column: string, value: any) {
        // For update/delete, we expect 'id' eq usually
        if ((this.pendingAction?.type === 'update' || this.pendingAction?.type === 'delete') && column === 'id') {
            this.pendingAction.id = value;
            return this;
        }

        this.queryParams[column] = value;
        return this;
    }

    async insert(row: any) {
        return request(`/${this.table}`, 'POST', row);
    }

    update(updates: any) {
        this.pendingAction = { type: 'update', body: updates };
        return this;
    }

    delete() {
        this.pendingAction = { type: 'delete' };
        return this;
    }

    // Execute the chain
    then(resolve: (value: any) => void) {
        const execute = async () => {
            // Handle Action
            if (this.pendingAction) {
                if (!this.pendingAction.id) {
                    // If we have an update/delete but no ID, we might be in trouble with this simple adapter
                    // In real Supabase, `eq` is called after.
                    // We rely on `eq` being called to set the ID.
                    // But `then` is called at the end.
                    // If `eq` was called, `this.pendingAction.id` should be set.
                    return { error: { message: 'Missing ID for update/delete' } };
                }

                if (this.pendingAction.type === 'update') {
                    return request(`/${this.table}/${this.pendingAction.id}`, 'PATCH', this.pendingAction.body);
                } else {
                    return request(`/${this.table}/${this.pendingAction.id}`, 'DELETE');
                }
            }

            // Handle Select
            const params = new URLSearchParams(this.queryParams).toString();
            return request(`/${this.table}?${params}`, 'GET');
        };

        execute().then(resolve);
    }
}

export const localClient = {
    from: (table: string) => new QueryBuilder(table),
    auth: {
        getSession: async () => {
            // We can check if we have a token in localStorage
            const session = localStorage.getItem('local-session');
            return { data: { session: session ? JSON.parse(session) : null }, error: null };
        },
        getUser: async () => {
            const session = localStorage.getItem('local-session');
            if (session) {
                return { data: { user: JSON.parse(session).user }, error: null };
            }
            return { data: { user: null }, error: null };
        },
        signInWithPassword: async ({ email, password }: any) => {
            const res = await request('/auth/login', 'POST', { email, password });
            if (res.data?.session) {
                localStorage.setItem('local-session', JSON.stringify(res.data.session));
            }
            return res;
        },
        signUp: async (payload: any) => {
            // payload: { email, password, options }
            const res = await request('/auth/register', 'POST', payload);
            // Auto login? Supabase usually requires confirmation or returns session if not.
            // Our mock returns session.
            if (res.data?.session) {
                localStorage.setItem('local-session', JSON.stringify(res.data.session));
            }
            return res;
        },
        signOut: async () => {
            localStorage.removeItem('local-session');
            return { error: null };
        },
        updateUser: async ({ data }: any) => {
            // Need current user email
            const sessionStr = localStorage.getItem('local-session');
            if (!sessionStr) return { error: { message: 'No session' } };
            const session = JSON.parse(sessionStr);

            const res = await request('/auth/update', 'POST', { email: session.user.email, data });

            if (res.data?.user) {
                // Update local session
                session.user = res.data.user;
                localStorage.setItem('local-session', JSON.stringify(session));
            }
            return res;
        },
        sendCode: async (email: string) => {
            return request('/auth/send-code', 'POST', { email });
        },
        verifyCode: async (email: string, code: string) => {
            return request('/auth/verify-code', 'POST', { email, code });
        }
    }
};

import CryptoJS from 'crypto-js';

const INTERNAL_SECRET = 'partes-app-v2-secure-salt-2026';

function decryptData(ciphertext: string) {
    try {
        let cleanText = ciphertext.trim();
        if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
            cleanText = cleanText.slice(1, -1);
        }
        const bytes = CryptoJS.AES.decrypt(cleanText, INTERNAL_SECRET);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(originalText);
    } catch {
        return null;
    }
}

export interface DbCollections {
    users: any[];
    partes: any[];
    actuaciones: any[];
    clients: any[];
    snippets: any[];
    reminders: any[];
}

export interface MergeStats {
    partesAdded: number;
    partesMerged: number;
    partesRenamed: number;
    actuacionesAdded: number;
    clientsAdded: number;
    usersAdded: number;
    snippetsAdded: number;
    remindersAdded: number;
}

function normalizeState(raw: any): DbCollections | null {
    if (!raw || (!raw.users && !raw.partes)) return null;
    return {
        users: Array.isArray(raw.users) ? raw.users : [],
        partes: Array.isArray(raw.partes) ? raw.partes : [],
        actuaciones: Array.isArray(raw.actuaciones) ? raw.actuaciones : [],
        clients: Array.isArray(raw.clients) ? raw.clients : [],
        snippets: Array.isArray(raw.snippets) ? raw.snippets : [],
        reminders: Array.isArray(raw.reminders) ? raw.reminders : [],
    };
}

export function parseDatabaseFileText(text: string): DbCollections | null {
    let parsed = decryptData(text);
    if (!parsed) {
        try {
            parsed = JSON.parse(text);
        } catch {
            return null;
        }
    }
    return normalizeState(parsed);
}

function parteLabel(p: any): string {
    return String(p.description || p.title || '')
        .trim()
        .toLowerCase();
}

function isSameParteRecord(a: any, b: any): boolean {
    const la = parteLabel(a);
    const lb = parteLabel(b);
    if (la && lb && la === lb) return true;
    if (a.pdf_file && b.pdf_file && a.pdf_file === b.pdf_file) return true;
    return false;
}

function allocateParteId(collection: any[]): string {
    const isManual = (item: any) => typeof item.id === 'string' && item.id.startsWith('MAN-');
    const manualIds = collection
        .filter(isManual)
        .map((item) => parseInt(String(item.id).split('-')[1], 10))
        .filter((n) => !isNaN(n));
    const maxManual = manualIds.length > 0 ? Math.max(...manualIds) : 0;

    const numericIds = collection
        .map((item) => {
            const raw = item.id;
            if (typeof raw === 'number') return raw;
            if (typeof raw === 'string' && !raw.startsWith('MAN-')) return parseInt(raw, 10);
            return NaN;
        })
        .filter((n) => !isNaN(n));
    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;

    return String(maxId + 1);
}

function clientKey(c: any): string {
    return String(c.full_name || c.name || '')
        .trim()
        .toLowerCase();
}

export function mergeDatabaseStates(local: DbCollections, incoming: DbCollections): { state: DbCollections; stats: MergeStats } {
    const merged: DbCollections = {
        users: [...local.users],
        partes: local.partes.map((p) => ({ ...p })),
        actuaciones: [...local.actuaciones],
        clients: [...local.clients],
        snippets: [...local.snippets],
        reminders: [...local.reminders],
    };

    const stats: MergeStats = {
        partesAdded: 0,
        partesMerged: 0,
        partesRenamed: 0,
        actuacionesAdded: 0,
        clientsAdded: 0,
        usersAdded: 0,
        snippetsAdded: 0,
        remindersAdded: 0,
    };

    const parteIdMap = new Map<string, string>();
    const clientIdMap = new Map<string, string>();
    const existingActIds = new Set(merged.actuaciones.map((a) => String(a.id)));

    for (const u of incoming.users) {
        if (!u?.email) continue;
        if (merged.users.some((x) => x.email === u.email)) continue;
        merged.users.push({ ...u });
        stats.usersAdded++;
    }

    for (const c of incoming.clients) {
        const cid = String(c.id);
        const existingById = merged.clients.find((x) => String(x.id) === cid);
        if (existingById) {
            clientIdMap.set(cid, String(existingById.id));
            continue;
        }
        const key = clientKey(c);
        const existingByName = key ? merged.clients.find((x) => clientKey(x) === key) : undefined;
        if (existingByName) {
            clientIdMap.set(cid, String(existingByName.id));
            continue;
        }
        merged.clients.push({ ...c });
        clientIdMap.set(cid, cid);
        stats.clientsAdded++;
    }

    for (const p of incoming.partes) {
        const importId = String(p.id);
        const existing = merged.partes.find((x) => String(x.id) === importId);

        let targetParteId = importId;
        const copy = { ...p };

        if (copy.client_id && clientIdMap.has(String(copy.client_id))) {
            copy.client_id = clientIdMap.get(String(copy.client_id));
        }

        if (existing) {
            if (isSameParteRecord(existing, copy)) {
                targetParteId = String(existing.id);
                parteIdMap.set(importId, targetParteId);
                stats.partesMerged++;
            } else {
                targetParteId = allocateParteId(merged.partes);
                copy.id = targetParteId;
                merged.partes.push(copy);
                parteIdMap.set(importId, targetParteId);
                stats.partesAdded++;
                stats.partesRenamed++;
            }
        } else {
            merged.partes.push(copy);
            parteIdMap.set(importId, targetParteId);
            stats.partesAdded++;
        }
    }

    for (const a of incoming.actuaciones) {
        const actId = String(a.id);
        if (existingActIds.has(actId)) continue;

        const mappedParteId = parteIdMap.get(String(a.parte_id)) ?? String(a.parte_id);
        if (!merged.partes.some((p) => String(p.id) === mappedParteId)) continue;

        merged.actuaciones.push({
            ...a,
            id: a.id,
            parte_id: mappedParteId,
        });
        existingActIds.add(actId);
        stats.actuacionesAdded++;
    }

    for (const s of incoming.snippets) {
        if (merged.snippets.some((x) => String(x.id) === String(s.id))) continue;
        merged.snippets.push({ ...s });
        stats.snippetsAdded++;
    }

    for (const r of incoming.reminders) {
        if (merged.reminders.some((x) => String(x.id) === String(r.id))) continue;
        const copy = { ...r };
        if (copy.parteId && parteIdMap.has(String(copy.parteId))) {
            copy.parteId = parteIdMap.get(String(copy.parteId));
        }
        if (copy.parte_id && parteIdMap.has(String(copy.parte_id))) {
            copy.parte_id = parteIdMap.get(String(copy.parte_id));
        }
        merged.reminders.push(copy);
        stats.remindersAdded++;
    }

    return { state: merged, stats };
}

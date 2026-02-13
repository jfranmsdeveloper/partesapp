import CryptoJS from 'crypto-js';
// import { type StateStorage } from 'zustand/middleware';

export interface StateStorage {
    getItem: (name: string) => string | null | Promise<string | null>;
    setItem: (name: string, value: string) => void | Promise<void>;
    removeItem: (name: string) => void | Promise<void>;
}

// Secret key for client-side encryption
// In a real app this should come from ENV, but for client-side-only app 
// we at least obfuscate it from plain localStorage readers.
// V5: We admit this is a weak secret management (hardcoded), but inevitable for purely client-side apps without backend.
// SECURITY WARNING: This key is exposed in the client bundle. Do not use for highly sensitive data.
// TODO: Move to environment variable VITE_STORAGE_KEY and consider backend encryption.
const SECRET_KEY = import.meta.env.VITE_STORAGE_KEY || 'partes-app-secure-key-v1';

export const secureStorage: StateStorage = {
    getItem: (name: string): string | null => {
        const value = localStorage.getItem(name);
        if (!value) return null;

        // Migration Strategy:
        // 1. Check if value looks like AES (starts with U2FsdGVkX1 -> "Salted__" in Base64)
        // 2. If not, assume it's legacy plaintext JSON and return it as-is.
        // 3. Next save will encrypt it automatically.
        if (!value.startsWith('U2FsdGVkX1')) {
            return value;
        }

        try {
            const bytes = CryptoJS.AES.decrypt(value, SECRET_KEY);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);

            // If decryption produces empty string (wrong key or corrupted), return null
            if (!decrypted) return null;

            return decrypted;
        } catch (e) {
            console.warn('Failed to decrypt storage', e);
            return null;
        }
    },
    setItem: (name: string, value: string): void => {
        const encrypted = CryptoJS.AES.encrypt(value, SECRET_KEY).toString();
        localStorage.setItem(name, encrypted);
    },
    removeItem: (name: string): void => {
        localStorage.removeItem(name);
    }
};

export const hashPassword = (password: string): string => {
    return CryptoJS.SHA256(password).toString();
};

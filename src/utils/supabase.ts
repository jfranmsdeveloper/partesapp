import { localDb } from './fileSystemAdapter';

// Replace the real Supabase client with our pure local File System access adapter
export const supabase = localDb as any;

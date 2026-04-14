/* UI Version: 12:30 Baseline */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NotesState {
  /* Forcing file sync */
  noteContent: string;
  isNotesOpen: boolean;
  setNoteContent: (content: string) => void;
  toggleNotes: () => void;
  setNotesOpen: (isOpen: boolean) => void;
  clearNotes: () => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      noteContent: '',
      isNotesOpen: false,
      setNoteContent: (content) => set({ noteContent: content }),
      toggleNotes: () => set((state) => ({ isNotesOpen: !state.isNotesOpen })),
      setNotesOpen: (isOpen) => set({ isNotesOpen: isOpen }),
      clearNotes: () => set({ noteContent: '' }),
    }),
    {
      name: 'daily-notes-storage', // saves to localStorage
      partialize: (state) => ({ noteContent: state.noteContent }) // only persist the note content
    }
  )
);

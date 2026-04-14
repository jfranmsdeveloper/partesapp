import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface QuickNote {
  id: string;
  content: string;
  createdAt: string;
}

interface NotesState {
  notes: QuickNote[];
  activeNoteIndex: number;
  isNotesOpen: boolean;
  
  // Actions
  addNote: () => void;
  updateActiveNote: (content: string) => void;
  deleteActiveNote: () => void;
  nextNote: () => void;
  prevNote: () => void;
  setIndex: (index: number) => void;
  toggleNotes: () => void;
  setNotesOpen: (isOpen: boolean) => void;
  clearAll: () => void;
}

const DEFAULT_NOTE = (): QuickNote => ({
  id: crypto.randomUUID(),
  content: '',
  createdAt: new Date().toISOString()
});

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [DEFAULT_NOTE()],
      activeNoteIndex: 0,
      isNotesOpen: false,

      addNote: () => {
        const { notes } = get();
        const newNote = DEFAULT_NOTE();
        set({ 
          notes: [...notes, newNote],
          activeNoteIndex: notes.length 
        });
      },

      updateActiveNote: (content) => {
        const { notes, activeNoteIndex } = get();
        const newNotes = [...notes];
        newNotes[activeNoteIndex] = { ...newNotes[activeNoteIndex], content };
        set({ notes: newNotes });
      },

      deleteActiveNote: () => {
        const { notes, activeNoteIndex } = get();
        if (notes.length <= 1) {
          set({ notes: [DEFAULT_NOTE()], activeNoteIndex: 0 });
          return;
        }
        
        const newNotes = notes.filter((_, i) => i !== activeNoteIndex);
        const newIndex = Math.max(0, activeNoteIndex - 1);
        set({ notes: newNotes, activeNoteIndex: newIndex });
      },

      nextNote: () => {
        const { notes, activeNoteIndex } = get();
        if (activeNoteIndex < notes.length - 1) {
          set({ activeNoteIndex: activeNoteIndex + 1 });
        }
      },

      prevNote: () => {
        const { activeNoteIndex } = get();
        if (activeNoteIndex > 0) {
          set({ activeNoteIndex: activeNoteIndex - 1 });
        }
      },

      setIndex: (index) => set({ activeNoteIndex: index }),

      toggleNotes: () => set((state) => ({ isNotesOpen: !state.isNotesOpen })),
      setNotesOpen: (isOpen) => set({ isNotesOpen: isOpen }),
      clearAll: () => set({ notes: [DEFAULT_NOTE()], activeNoteIndex: 0 }),
    }),
    {
      name: 'daily-notes-storage-v2', // Updated version to avoid conflict with old schema
    }
  )
);

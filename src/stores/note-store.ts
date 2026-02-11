import { create } from "zustand"

export interface NoteEntry {
  id: string
  content: string
  imageUrls: string[]
  storagePaths: string[]
  source: "MANUAL" | "STT" | "IMAGE"
  createdAt: string
}

interface NoteState {
  notes: NoteEntry[]
  addNote: (note: NoteEntry) => void
  loadNotes: (notes: NoteEntry[]) => void
  reset: () => void
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],

  addNote: (note) =>
    set((state) => ({
      notes: [...state.notes, note],
    })),

  loadNotes: (notes) => set({ notes }),

  reset: () => set({ notes: [] }),
}))

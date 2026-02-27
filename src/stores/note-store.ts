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

export function buildDoctorNotes(
  notes: Array<{ content?: string | null }>
): string {
  return notes
    .map((note) => note.content || "")
    .filter(Boolean)
    .join("\n")
}

export function buildNoteImageEntries(
  notes: Array<{
    imageUrls?: string[] | null
    storagePaths?: string[] | null
  }>
): Array<{ storagePath: string; imageUrl: string }> {
  const imageEntries: Array<{ storagePath: string; imageUrl: string }> = []
  for (const note of notes) {
    const urls = note.imageUrls || []
    const paths = note.storagePaths || []
    urls.forEach((url, i) => {
      if (paths[i]) {
        imageEntries.push({ storagePath: paths[i], imageUrl: url })
      }
    })
  }
  return imageEntries
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

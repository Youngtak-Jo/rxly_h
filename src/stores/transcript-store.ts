import { create } from "zustand"
import type { TranscriptEntry, Speaker } from "@/types/session"

interface TranscriptState {
  entries: TranscriptEntry[]
  interimText: string
  interimSpeaker: Speaker
  addFinalEntry: (entry: TranscriptEntry) => void
  setInterimText: (text: string, speaker: Speaker) => void
  clearInterim: () => void
  loadEntries: (entries: TranscriptEntry[]) => void
  reset: () => void
  getFullTranscript: () => string
}

export const useTranscriptStore = create<TranscriptState>((set, get) => ({
  entries: [],
  interimText: "",
  interimSpeaker: "UNKNOWN",

  addFinalEntry: (entry) =>
    set((state) => ({
      entries: [...state.entries, entry],
      interimText: "",
    })),

  setInterimText: (text, speaker) =>
    set({ interimText: text, interimSpeaker: speaker }),

  clearInterim: () => set({ interimText: "", interimSpeaker: "UNKNOWN" }),

  loadEntries: (entries) => set({ entries }),

  reset: () =>
    set({
      entries: [],
      interimText: "",
      interimSpeaker: "UNKNOWN",
    }),

  getFullTranscript: () => {
    const { entries } = get()
    return entries.map((e) => `[${e.speaker}]: ${e.text}`).join("\n")
  },
}))

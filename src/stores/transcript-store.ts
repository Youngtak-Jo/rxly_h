import { create } from "zustand"
import type { TranscriptEntry, Speaker, DiagnosticKeyword } from "@/types/session"

export type IdentificationStatus =
  | "unidentified"
  | "identifying"
  | "identified"

export type HighlightStatus = "idle" | "loading" | "done"

interface TranscriptState {
  entries: TranscriptEntry[]
  interimText: string
  interimSpeaker: Speaker
  identificationStatus: IdentificationStatus
  identificationAttempt: number
  speakerRoleMap: Record<number, Speaker>
  diagnosticKeywords: DiagnosticKeyword[]
  highlightStatus: HighlightStatus

  addFinalEntry: (entry: TranscriptEntry) => void
  setInterimText: (text: string, speaker: Speaker) => void
  clearInterim: () => void
  loadEntries: (entries: TranscriptEntry[]) => void
  reset: () => void
  getFullTranscript: () => string
  setIdentificationStatus: (status: IdentificationStatus) => void
  incrementIdentificationAttempt: () => void
  relabelSpeakers: (mapping: Record<number, Speaker>) => void
  setDiagnosticKeywords: (keywords: DiagnosticKeyword[]) => void
  setHighlightStatus: (status: HighlightStatus) => void
}

export const useTranscriptStore = create<TranscriptState>((set, get) => ({
  entries: [],
  interimText: "",
  interimSpeaker: "UNKNOWN",
  identificationStatus: "unidentified",
  identificationAttempt: 0,
  speakerRoleMap: {},
  diagnosticKeywords: [],
  highlightStatus: "idle",

  addFinalEntry: (entry) =>
    set((state) => ({
      entries: [...state.entries, entry],
      interimText: "",
    })),

  setInterimText: (text, speaker) =>
    set({ interimText: text, interimSpeaker: speaker }),

  clearInterim: () => set({ interimText: "", interimSpeaker: "UNKNOWN" }),

  loadEntries: (entries) => {
    const hasIdentifiedSpeakers = entries.some(
      (e: TranscriptEntry) => e.speaker === "DOCTOR" || e.speaker === "PATIENT"
    )
    set({
      entries,
      identificationStatus: hasIdentifiedSpeakers ? "identified" : "unidentified",
      diagnosticKeywords: [],
      highlightStatus: "idle",
    })
  },

  reset: () =>
    set({
      entries: [],
      interimText: "",
      interimSpeaker: "UNKNOWN",
      identificationStatus: "unidentified",
      identificationAttempt: 0,
      speakerRoleMap: {},
      diagnosticKeywords: [],
      highlightStatus: "idle",
    }),

  getFullTranscript: () => {
    const { entries } = get()
    return entries.map((e) => `[${e.speaker}]: ${e.text}`).join("\n")
  },

  setIdentificationStatus: (status) =>
    set({ identificationStatus: status }),

  incrementIdentificationAttempt: () =>
    set((state) => ({
      identificationAttempt: state.identificationAttempt + 1,
    })),

  relabelSpeakers: (mapping) =>
    set((state) => ({
      speakerRoleMap: mapping,
      identificationStatus: "identified",
      entries: state.entries.map((entry) => {
        if (
          entry.rawSpeakerId !== undefined &&
          mapping[entry.rawSpeakerId]
        ) {
          return { ...entry, speaker: mapping[entry.rawSpeakerId] }
        }
        return entry
      }),
    })),

  setDiagnosticKeywords: (keywords) =>
    set({ diagnosticKeywords: keywords, highlightStatus: "done" }),

  setHighlightStatus: (status) => set({ highlightStatus: status }),
}))

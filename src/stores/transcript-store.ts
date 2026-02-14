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

  // Single-speaker mode state
  singleSpeakerDetected: boolean
  singleSpeakerPromptDismissed: boolean
  singleSpeakerMode: boolean
  lastClassifiedEntryIndex: number
  classifyingEntries: boolean

  addFinalEntry: (entry: TranscriptEntry) => void
  setInterimText: (text: string, speaker: Speaker) => void
  clearInterim: () => void
  loadEntries: (entries: TranscriptEntry[]) => void
  reset: () => void
  getFullTranscript: () => string
  getTranscriptSince: (entryIndex: number) => string
  getEntryCount: () => number
  setIdentificationStatus: (status: IdentificationStatus) => void
  incrementIdentificationAttempt: () => void
  relabelSpeakers: (mapping: Record<number, Speaker>) => void
  setDiagnosticKeywords: (keywords: DiagnosticKeyword[]) => void
  setHighlightStatus: (status: HighlightStatus) => void

  // Single-speaker mode actions
  setSingleSpeakerDetected: (detected: boolean) => void
  dismissSingleSpeakerPrompt: () => void
  activateSingleSpeakerMode: () => void
  setLastClassifiedEntryIndex: (index: number) => void
  setClassifyingEntries: (classifying: boolean) => void
  relabelEntriesIndividually: (mapping: Record<string, Speaker>) => void
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

  // Single-speaker mode defaults
  singleSpeakerDetected: false,
  singleSpeakerPromptDismissed: false,
  singleSpeakerMode: false,
  lastClassifiedEntryIndex: 0,
  classifyingEntries: false,

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
      singleSpeakerDetected: false,
      singleSpeakerPromptDismissed: false,
      singleSpeakerMode: false,
      lastClassifiedEntryIndex: 0,
      classifyingEntries: false,
    }),

  getFullTranscript: () => {
    const { entries } = get()
    return entries.map((e) => `[${e.speaker}]: ${e.text}`).join("\n")
  },

  getTranscriptSince: (entryIndex: number) => {
    const { entries } = get()
    return entries
      .slice(entryIndex)
      .map((e) => `[${e.speaker}]: ${e.text}`)
      .join("\n")
  },

  getEntryCount: () => get().entries.length,

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

  // Single-speaker mode actions
  setSingleSpeakerDetected: (detected) =>
    set({ singleSpeakerDetected: detected }),

  dismissSingleSpeakerPrompt: () =>
    set({ singleSpeakerPromptDismissed: true, singleSpeakerDetected: false }),

  activateSingleSpeakerMode: () =>
    set({ singleSpeakerMode: true }),

  setLastClassifiedEntryIndex: (index) =>
    set({ lastClassifiedEntryIndex: index }),

  setClassifyingEntries: (classifying) =>
    set({ classifyingEntries: classifying }),

  relabelEntriesIndividually: (mapping) =>
    set((state) => ({
      entries: state.entries.map((entry) => {
        if (mapping[entry.id]) {
          return { ...entry, speaker: mapping[entry.id] }
        }
        return entry
      }),
      identificationStatus: "identified",
    })),
}))

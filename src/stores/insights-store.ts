import { create } from "zustand"
import type {
  ChecklistItem,
  DiagnosisItem,
  InlineComment,
  InsightsResponse,
} from "@/types/insights"
import { v4 as uuid } from "uuid"

interface InsightsState {
  summary: string
  keyFindings: string[]
  redFlags: string[]
  checklistItems: ChecklistItem[]
  diagnoses: DiagnosisItem[]
  isProcessing: boolean
  lastUpdated: Date | null
  wordCountAtLastUpdate: number
  entryCountAtLastUpdate: number
  analysisCount: number
  analyzedImages: Record<string, string> // storagePath → findings summary
  pendingComments: InlineComment[]
  // Global callback for triggering analysis from note submission
  _noteTrigger: (() => void) | null
  setNoteTrigger: (fn: (() => void) | null) => void
  addComment: (comment: InlineComment) => void
  clearComments: () => void

  setProcessing: (processing: boolean) => void
  updateFromResponse: (response: InsightsResponse, sessionId: string) => void
  loadFromDB: (data: {
    summary: string
    keyFindings: string[]
    redFlags: string[]
    checklistItems: ChecklistItem[]
    diagnoses?: DiagnosisItem[]
  }) => void
  toggleChecklistItem: (id: string) => void
  addChecklistItem: (label: string, sessionId: string) => void
  removeChecklistItem: (id: string) => void
  updateChecklistNote: (id: string, note: string) => void
  setWordCountAtLastUpdate: (count: number) => void
  setEntryCountAtLastUpdate: (count: number) => void
  incrementAnalysisCount: () => void
  addAnalyzedImages: (newImages: Record<string, string>) => void
  reset: () => void
}

export const useInsightsStore = create<InsightsState>((set) => ({
  summary: "",
  keyFindings: [],
  redFlags: [],
  checklistItems: [],
  diagnoses: [],
  isProcessing: false,
  lastUpdated: null,
  wordCountAtLastUpdate: 0,
  entryCountAtLastUpdate: 0,
  analysisCount: 0,
  analyzedImages: {},
  pendingComments: [],
  _noteTrigger: null,
  setNoteTrigger: (fn) => set({ _noteTrigger: fn }),
  addComment: (comment) =>
    set((state) => ({ pendingComments: [...state.pendingComments, comment] })),
  clearComments: () => set({ pendingComments: [] }),

  setProcessing: (isProcessing) => set({ isProcessing }),

  updateFromResponse: (response, sessionId) =>
    set((state) => {
      const existingById = new Map(
        state.checklistItems.map((item) => [item.id, item])
      )

      // Reconcile: match by ID (model echoes back existing IDs)
      const returnedIds = new Set<string>()
      const reconciledItems = response.checklist.map((aiItem, index) => {
        if (aiItem.id && existingById.has(aiItem.id)) {
          // Existing item — preserve manual state
          const existing = existingById.get(aiItem.id)!
          returnedIds.add(aiItem.id)
          return {
            ...existing,
            label: aiItem.label,
            isChecked: aiItem.checked || existing.isChecked, // Keep checked if manually checked
            isAutoChecked: aiItem.checked,
            sortOrder: index,
          }
        }

        // New item from AI (no id or unrecognized id)
        return {
          id: uuid(),
          sessionId,
          label: aiItem.label,
          isChecked: aiItem.checked,
          isAutoChecked: aiItem.checked,
          doctorNote: null,
          sortOrder: index,
          source: "AI" as const,
        }
      })

      // Preserve manually added items that the AI didn't include
      const manualItems = state.checklistItems.filter(
        (item) =>
          item.source === "MANUAL" && !returnedIds.has(item.id)
      )

      const diagnoses: DiagnosisItem[] = (response.diagnoses ?? []).map(
        (dx, index) => ({
          id: uuid(),
          sessionId,
          icdCode: dx.icdCode,
          diseaseName: dx.diseaseName,
          confidence: dx.confidence,
          evidence: dx.evidence,
          citations: dx.citations,
          sortOrder: index,
        })
      )

      return {
        summary: response.summary,
        keyFindings: response.keyFindings,
        redFlags: response.redFlags,
        checklistItems: [...reconciledItems, ...manualItems],
        diagnoses,
        isProcessing: false,
        lastUpdated: new Date(),
      }
    }),

  loadFromDB: (data) =>
    set({
      summary: data.summary || "",
      keyFindings: data.keyFindings || [],
      redFlags: data.redFlags || [],
      checklistItems: data.checklistItems || [],
      diagnoses: data.diagnoses || [],
    }),

  toggleChecklistItem: (id) =>
    set((state) => ({
      checklistItems: state.checklistItems.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      ),
      lastUpdated: new Date(),
    })),

  addChecklistItem: (label, sessionId) =>
    set((state) => ({
      checklistItems: [
        ...state.checklistItems,
        {
          id: uuid(),
          sessionId,
          label,
          isChecked: false,
          isAutoChecked: false,
          doctorNote: null,
          sortOrder: state.checklistItems.length,
          source: "MANUAL" as const,
        },
      ],
      lastUpdated: new Date(),
    })),

  removeChecklistItem: (id) =>
    set((state) => ({
      checklistItems: state.checklistItems.filter((item) => item.id !== id),
      lastUpdated: new Date(),
    })),

  updateChecklistNote: (id, note) =>
    set((state) => ({
      checklistItems: state.checklistItems.map((item) =>
        item.id === id ? { ...item, doctorNote: note } : item
      ),
      lastUpdated: new Date(),
    })),

  setWordCountAtLastUpdate: (count) =>
    set({ wordCountAtLastUpdate: count }),

  setEntryCountAtLastUpdate: (count) =>
    set({ entryCountAtLastUpdate: count }),

  incrementAnalysisCount: () =>
    set((state) => ({ analysisCount: state.analysisCount + 1 })),

  addAnalyzedImages: (newImages) =>
    set((state) => ({
      analyzedImages: { ...state.analyzedImages, ...newImages },
    })),

  reset: () =>
    set({
      summary: "",
      keyFindings: [],
      redFlags: [],
      checklistItems: [],
      diagnoses: [],
      isProcessing: false,
      lastUpdated: null,
      wordCountAtLastUpdate: 0,
      entryCountAtLastUpdate: 0,
      analysisCount: 0,
      analyzedImages: {},
      pendingComments: [],
    }),
}))

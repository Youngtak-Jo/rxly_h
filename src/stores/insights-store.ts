import { create } from "zustand"
import type { ChecklistItem, InsightsResponse } from "@/types/insights"
import { v4 as uuid } from "uuid"

interface InsightsState {
  summary: string
  keyFindings: string[]
  redFlags: string[]
  checklistItems: ChecklistItem[]
  isProcessing: boolean
  lastUpdated: Date | null
  wordCountAtLastUpdate: number

  setProcessing: (processing: boolean) => void
  updateFromResponse: (response: InsightsResponse, sessionId: string) => void
  toggleChecklistItem: (id: string) => void
  addChecklistItem: (label: string, sessionId: string) => void
  removeChecklistItem: (id: string) => void
  updateChecklistNote: (id: string, note: string) => void
  setWordCountAtLastUpdate: (count: number) => void
  reset: () => void
}

export const useInsightsStore = create<InsightsState>((set) => ({
  summary: "",
  keyFindings: [],
  redFlags: [],
  checklistItems: [],
  isProcessing: false,
  lastUpdated: null,
  wordCountAtLastUpdate: 0,

  setProcessing: (isProcessing) => set({ isProcessing }),

  updateFromResponse: (response, sessionId) =>
    set((state) => {
      const existingItems = [...state.checklistItems]

      const updatedItems = existingItems.map((item) => {
        if (response.checklistUpdates.autoCheck.includes(item.label)) {
          return { ...item, isChecked: true, isAutoChecked: true }
        }
        return item
      })

      const filteredItems = updatedItems.filter(
        (item) => !response.checklistUpdates.remove.includes(item.label)
      )

      const newItems = response.checklistUpdates.add
        .filter(
          (newItem) =>
            !filteredItems.some((existing) => existing.label === newItem.label)
        )
        .map((newItem, index) => ({
          id: uuid(),
          sessionId,
          label: newItem.label,
          isChecked: newItem.autoChecked,
          isAutoChecked: newItem.autoChecked,
          doctorNote: null,
          sortOrder: filteredItems.length + index,
          source: "AI" as const,
        }))

      return {
        summary: response.summary,
        keyFindings: response.keyFindings,
        redFlags: response.redFlags,
        checklistItems: [...filteredItems, ...newItems],
        isProcessing: false,
        lastUpdated: new Date(),
      }
    }),

  toggleChecklistItem: (id) =>
    set((state) => ({
      checklistItems: state.checklistItems.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      ),
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
    })),

  removeChecklistItem: (id) =>
    set((state) => ({
      checklistItems: state.checklistItems.filter((item) => item.id !== id),
    })),

  updateChecklistNote: (id, note) =>
    set((state) => ({
      checklistItems: state.checklistItems.map((item) =>
        item.id === id ? { ...item, doctorNote: note } : item
      ),
    })),

  setWordCountAtLastUpdate: (count) =>
    set({ wordCountAtLastUpdate: count }),

  reset: () =>
    set({
      summary: "",
      keyFindings: [],
      redFlags: [],
      checklistItems: [],
      isProcessing: false,
      lastUpdated: null,
      wordCountAtLastUpdate: 0,
    }),
}))

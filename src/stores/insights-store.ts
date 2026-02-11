import { create } from "zustand"
import type { ChecklistItem, InsightsResponse } from "@/types/insights"
import { v4 as uuid } from "uuid"

/**
 * Normalize a checklist label for fuzzy comparison.
 * Strips filler words, lowercases, removes punctuation, and sorts key terms.
 */
function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/\(e\.g\..*?\)/g, "") // remove example parentheticals
    .replace(/[^a-z0-9\s]/g, "") // remove punctuation
    .replace(/\b(the|a|an|and|or|if|for|with|to|of|in|on|at|by|is|are|was|were|be|been|being|current|currently)\b/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Check if two checklist labels are semantically similar enough to be considered duplicates.
 * Uses normalized word overlap ratio.
 */
function isSimilarLabel(a: string, b: string): boolean {
  if (a === b) return true
  const normA = normalizeLabel(a)
  const normB = normalizeLabel(b)
  if (normA === normB) return true

  const wordsA = new Set(normA.split(" ").filter(Boolean))
  const wordsB = new Set(normB.split(" ").filter(Boolean))
  if (wordsA.size === 0 || wordsB.size === 0) return false

  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length
  const smaller = Math.min(wordsA.size, wordsB.size)
  // If 70%+ of the smaller set's words appear in the other, consider it a duplicate
  return intersection / smaller >= 0.7
}

interface InsightsState {
  summary: string
  keyFindings: string[]
  redFlags: string[]
  checklistItems: ChecklistItem[]
  isProcessing: boolean
  lastUpdated: Date | null
  wordCountAtLastUpdate: number
  // Global callback for triggering analysis from note submission
  _noteTrigger: (() => void) | null
  setNoteTrigger: (fn: (() => void) | null) => void

  setProcessing: (processing: boolean) => void
  updateFromResponse: (response: InsightsResponse, sessionId: string) => void
  loadFromDB: (data: {
    summary: string
    keyFindings: string[]
    redFlags: string[]
    checklistItems: ChecklistItem[]
  }) => void
  toggleChecklistItem: (id: string) => void
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
  _noteTrigger: null,
  setNoteTrigger: (fn) => set({ _noteTrigger: fn }),

  setProcessing: (isProcessing) => set({ isProcessing }),

  updateFromResponse: (response, sessionId) =>
    set((state) => {
      const existingItems = [...state.checklistItems]
      const matchedExistingIds = new Set<string>()

      // Reconcile: for each AI checklist item, find best match in existing items
      const reconciledItems = response.checklist.map((aiItem, index) => {
        // Try to find a matching existing item (fuzzy match)
        const match = existingItems.find(
          (existing) =>
            !matchedExistingIds.has(existing.id) &&
            isSimilarLabel(existing.label, aiItem.label)
        )

        if (match) {
          matchedExistingIds.add(match.id)
          return {
            ...match,
            label: aiItem.label, // Update to AI's latest wording
            isChecked: aiItem.checked || match.isChecked, // Keep checked if manually checked
            isAutoChecked: aiItem.checked,
            sortOrder: index,
          }
        }

        // New item from AI
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
      const manualItems = existingItems.filter(
        (item) =>
          item.source === "MANUAL" && !matchedExistingIds.has(item.id)
      )

      return {
        summary: response.summary,
        keyFindings: response.keyFindings,
        redFlags: response.redFlags,
        checklistItems: [...reconciledItems, ...manualItems],
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
      lastUpdated: new Date(),
    }),

  toggleChecklistItem: (id) =>
    set((state) => ({
      checklistItems: state.checklistItems.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      ),
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

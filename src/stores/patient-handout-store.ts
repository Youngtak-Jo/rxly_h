import { create } from "zustand"
import type {
  PatientHandoutCondition,
  PatientHandoutDocument,
  PatientHandoutSectionKey,
  PatientHandoutSections,
} from "@/types/patient-handout"

interface PatientHandoutState {
  document: PatientHandoutDocument | null
  selectedConditions: PatientHandoutCondition[]
  isGenerating: boolean
  lastUpdated: Date | null
  abortController: AbortController | null

  setDocument: (document: PatientHandoutDocument | null) => void
  loadFromDB: (document: PatientHandoutDocument | null) => void
  setGeneratedDocument: (document: PatientHandoutDocument) => void
  setSelectedConditions: (conditions: PatientHandoutCondition[]) => void
  addCondition: (condition: PatientHandoutCondition) => void
  removeCondition: (conditionId: string) => void
  updateSection: (
    conditionId: string,
    field: PatientHandoutSectionKey,
    value: string
  ) => void
  setGenerating: (generating: boolean) => void
  setAbortController: (controller: AbortController | null) => void
  reset: () => void
}

function createEmptySections(): PatientHandoutSections {
  return {
    conditionOverview: "",
    signsSymptoms: "",
    causesRiskFactors: "",
    complications: "",
    treatmentOptions: "",
    whenToSeekHelp: "",
    additionalAdviceFollowUp: "",
    disclaimer: "",
  }
}

function dedupeConditions(
  conditions: PatientHandoutCondition[]
): PatientHandoutCondition[] {
  const byCode = new Map<string, PatientHandoutCondition>()
  for (const condition of conditions) {
    const key = condition.icdCode.trim().toUpperCase() || condition.id
    if (!byCode.has(key)) {
      byCode.set(key, condition)
    }
  }
  return Array.from(byCode.values())
}

export const usePatientHandoutStore = create<PatientHandoutState>((set, get) => ({
  document: null,
  selectedConditions: [],
  isGenerating: false,
  lastUpdated: null,
  abortController: null,

  setDocument: (document) =>
    set({
      document,
      selectedConditions: document ? dedupeConditions(document.conditions) : [],
    }),

  loadFromDB: (document) =>
    set({
      document,
      selectedConditions: document ? dedupeConditions(document.conditions) : [],
      isGenerating: false,
      lastUpdated: null,
      abortController: null,
    }),

  setGeneratedDocument: (document) =>
    set({
      document,
      selectedConditions: dedupeConditions(document.conditions),
      isGenerating: false,
      lastUpdated: new Date(),
    }),

  setSelectedConditions: (conditions) =>
    set({
      selectedConditions: dedupeConditions(conditions),
    }),

  addCondition: (condition) =>
    set((state) => {
      const merged = dedupeConditions([...state.selectedConditions, condition])
      return {
        selectedConditions: merged,
      }
    }),

  removeCondition: (conditionId) =>
    set((state) => {
      const selectedConditions = state.selectedConditions.filter(
        (condition) => condition.id !== conditionId
      )

      if (!state.document) {
        return { selectedConditions }
      }

      const filteredConditions = state.document.conditions.filter(
        (condition) => condition.id !== conditionId
      )
      const filteredEntries = state.document.entries.filter(
        (entry) => entry.conditionId !== conditionId
      )

      return {
        selectedConditions,
        document: {
          ...state.document,
          conditions: filteredConditions,
          entries: filteredEntries,
        },
        lastUpdated: new Date(),
      }
    }),

  updateSection: (conditionId, field, value) =>
    set((state) => {
      if (!state.document) return state

      const existingEntry = state.document.entries.find(
        (entry) => entry.conditionId === conditionId
      )

      const updatedEntry = existingEntry
        ? {
            ...existingEntry,
            sections: { ...existingEntry.sections, [field]: value },
          }
        : {
            conditionId,
            sections: { ...createEmptySections(), [field]: value },
          }

      const entries = existingEntry
        ? state.document.entries.map((entry) =>
            entry.conditionId === conditionId ? updatedEntry : entry
          )
        : [...state.document.entries, updatedEntry]

      return {
        document: {
          ...state.document,
          entries,
        },
        lastUpdated: new Date(),
      }
    }),

  setGenerating: (isGenerating) => set({ isGenerating }),

  setAbortController: (abortController) => set({ abortController }),

  reset: () => {
    const { abortController } = get()
    if (abortController) abortController.abort()
    set({
      document: null,
      selectedConditions: [],
      isGenerating: false,
      lastUpdated: null,
      abortController: null,
    })
  },
}))

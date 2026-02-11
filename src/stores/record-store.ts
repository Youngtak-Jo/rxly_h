import { create } from "zustand"
import type { ConsultationRecord } from "@/types/record"

interface RecordState {
  record: ConsultationRecord | null
  isGenerating: boolean
  setRecord: (record: ConsultationRecord) => void
  loadFromDB: (record: ConsultationRecord) => void
  updateField: (field: keyof ConsultationRecord, value: string) => void
  setGenerating: (generating: boolean) => void
  reset: () => void
}

export const useRecordStore = create<RecordState>((set) => ({
  record: null,
  isGenerating: false,

  setRecord: (record) => set({ record, isGenerating: false }),

  loadFromDB: (record) => set({ record }),

  updateField: (field, value) =>
    set((state) => {
      if (!state.record) return state
      return { record: { ...state.record, [field]: value } }
    }),

  setGenerating: (isGenerating) => set({ isGenerating }),

  reset: () => set({ record: null, isGenerating: false }),
}))

import { create } from "zustand"
import type { ConsultationRecord } from "@/types/record"

function toPersistableRecord(record: ConsultationRecord) {
  return {
    patientName: record.patientName,
    chiefComplaint: record.chiefComplaint,
    hpiText: record.hpiText,
    medications: record.medications,
    rosText: record.rosText,
    pmh: record.pmh,
    socialHistory: record.socialHistory,
    familyHistory: record.familyHistory,
    vitals: record.vitals,
    physicalExam: record.physicalExam,
    labsStudies: record.labsStudies,
    assessment: record.assessment,
    plan: record.plan,
  }
}

export function computeRecordFingerprint(
  record: ConsultationRecord | null
): string | null {
  if (!record) return null
  return JSON.stringify(toPersistableRecord(record))
}

interface RecordState {
  record: ConsultationRecord | null
  isGenerating: boolean
  lastUpdated: Date | null
  lastPersistedFingerprint: string | null
  setRecord: (record: ConsultationRecord) => void
  loadFromDB: (record: ConsultationRecord) => void
  updateField: (field: keyof ConsultationRecord, value: string) => void
  setGenerating: (generating: boolean) => void
  setLastPersistedFingerprint: (fingerprint: string | null) => void
  reset: () => void
}

export const useRecordStore = create<RecordState>((set) => ({
  record: null,
  isGenerating: false,
  lastUpdated: null,
  lastPersistedFingerprint: null,

  setRecord: (record) => set({ record, isGenerating: false, lastUpdated: new Date() }),

  loadFromDB: (record) =>
    set({
      record,
      lastPersistedFingerprint: computeRecordFingerprint(record),
    }),

  updateField: (field, value) =>
    set((state) => {
      if (!state.record) return state
      return { record: { ...state.record, [field]: value }, lastUpdated: new Date() }
    }),

  setGenerating: (isGenerating) => set({ isGenerating }),

  setLastPersistedFingerprint: (lastPersistedFingerprint) =>
    set({ lastPersistedFingerprint }),

  reset: () =>
    set({
      record: null,
      isGenerating: false,
      lastUpdated: null,
      lastPersistedFingerprint: null,
    }),
}))

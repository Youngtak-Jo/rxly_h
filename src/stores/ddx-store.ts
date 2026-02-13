import { create } from "zustand"
import type { DiagnosisItem, DiagnosisCitation } from "@/types/insights"
import { v4 as uuid } from "uuid"

interface DdxOutputItem {
  icdCode: string
  diseaseName: string
  confidence: "high" | "moderate" | "low"
  evidence: string
  citations?: DiagnosisCitation[]
}

interface DdxState {
  diagnoses: DiagnosisItem[]
  isProcessing: boolean
  lastUpdated: Date | null
  wordCountAtLastUpdate: number
  // Global callback for triggering DDx from note submission
  _noteTrigger: (() => void) | null
  setNoteTrigger: (fn: (() => void) | null) => void

  setProcessing: (processing: boolean) => void
  updateFromResponse: (diagnoses: DdxOutputItem[], sessionId: string) => void
  loadFromDB: (diagnoses: DiagnosisItem[]) => void
  setWordCountAtLastUpdate: (count: number) => void
  reset: () => void
}

export const useDdxStore = create<DdxState>((set) => ({
  diagnoses: [],
  isProcessing: false,
  lastUpdated: null,
  wordCountAtLastUpdate: 0,
  _noteTrigger: null,
  setNoteTrigger: (fn) => set({ _noteTrigger: fn }),

  setProcessing: (isProcessing) => set({ isProcessing }),

  updateFromResponse: (responseDiagnoses, sessionId) =>
    set((state) => {
      const newDiagnoses: DiagnosisItem[] = responseDiagnoses.map(
        (aiDx, index) => {
          const existing = state.diagnoses.find(
            (d) => d.icdCode === aiDx.icdCode
          )
          // Merge citations: keep existing + add new unique ones
          const newCites = aiDx.citations || []
          const oldCites = existing?.citations || []
          const citeKeys = new Set(
            newCites.map((c) => `${c.source}:${c.url}`)
          )
          const merged = [
            ...newCites,
            ...oldCites.filter(
              (c) => !citeKeys.has(`${c.source}:${c.url}`)
            ),
          ]
          return {
            id: existing?.id || uuid(),
            sessionId,
            icdCode: aiDx.icdCode,
            icdUri: undefined,
            diseaseName: aiDx.diseaseName,
            confidence: aiDx.confidence,
            evidence: aiDx.evidence,
            citations: merged,
            sortOrder: index,
          }
        }
      )

      return {
        diagnoses: newDiagnoses,
        isProcessing: false,
        lastUpdated: new Date(),
      }
    }),

  loadFromDB: (diagnoses) =>
    set({
      diagnoses: diagnoses || [],
    }),

  setWordCountAtLastUpdate: (count) =>
    set({ wordCountAtLastUpdate: count }),

  reset: () =>
    set({
      diagnoses: [],
      isProcessing: false,
      lastUpdated: null,
      wordCountAtLastUpdate: 0,
    }),
}))

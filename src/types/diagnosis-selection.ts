export const DIAGNOSIS_SELECTION_SOURCES = ["ddx", "icd11"] as const
export type DiagnosisSelectionSource =
  (typeof DIAGNOSIS_SELECTION_SOURCES)[number]

export interface SelectedDiagnosisCondition {
  id: string
  icdCode: string
  diseaseName: string
  source: DiagnosisSelectionSource
}

export interface DiagnosisSelectionItem extends SelectedDiagnosisCondition {
  evidence: string
  confidence?: "high" | "moderate" | "low"
}

import type { RichTextDocument } from "@/lib/documents/rich-text"
import type { SelectedDiagnosisCondition } from "@/types/diagnosis-selection"

export type PatientHandoutCondition = SelectedDiagnosisCondition

export type PatientHandoutSectionKey =
  | "conditionOverview"
  | "signsSymptoms"
  | "causesRiskFactors"
  | "complications"
  | "treatmentOptions"
  | "whenToSeekHelp"
  | "additionalAdviceFollowUp"
  | "disclaimer"

export interface PatientHandoutSections {
  conditionOverview: string
  signsSymptoms: string
  causesRiskFactors: string
  complications: string
  treatmentOptions: string
  whenToSeekHelp: string
  additionalAdviceFollowUp: string
  disclaimer: string
}

export interface PatientHandoutEntry {
  conditionId: string
  sections: PatientHandoutSections
}

export interface PatientHandoutDocument {
  id: string
  sessionId: string
  language: "ko" | "en"
  conditions: PatientHandoutCondition[]
  entries: PatientHandoutEntry[]
  generatedAt: string
  documentJson?: RichTextDocument | null
}

export const PATIENT_HANDOUT_SECTION_KEYS: PatientHandoutSectionKey[] = [
  "conditionOverview",
  "signsSymptoms",
  "causesRiskFactors",
  "complications",
  "treatmentOptions",
  "whenToSeekHelp",
  "additionalAdviceFollowUp",
  "disclaimer",
]

export const PATIENT_HANDOUT_SECTION_LABELS: Record<
  PatientHandoutSectionKey,
  string
> = {
  conditionOverview: "Condition Overview",
  signsSymptoms: "Signs / Symptoms",
  causesRiskFactors: "Causes / Risk Factors",
  complications: "Complications",
  treatmentOptions: "Treatment Options",
  whenToSeekHelp: "When to Seek Help",
  additionalAdviceFollowUp: "Additional Advice / Follow-Up",
  disclaimer: "Disclaimer",
}

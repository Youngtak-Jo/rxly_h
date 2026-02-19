export interface PatientHandoutCondition {
  id: string
  icdCode: string
  diseaseName: string
  source: "ddx" | "icd11"
}

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

export interface ChecklistItem {
  id: string
  sessionId: string
  label: string
  isChecked: boolean
  isAutoChecked: boolean
  doctorNote: string | null
  sortOrder: number
  source: "AI" | "MANUAL"
}

export interface Insights {
  id: string
  sessionId: string
  summary: string
  keyFindings: string[]
  redFlags: string[]
  lastProcessedAt: string | null
}

export interface ChecklistOutputItem {
  label: string
  checked: boolean
}

export interface DiagnosisCitation {
  source: "pubmed" | "europe_pmc" | "icd11" | "openfda" | "clinical_trials" | "dailymed"
  title: string
  url: string
  snippet?: string
}

export interface DiagnosisItem {
  id: string
  sessionId: string
  icdCode: string
  icdUri?: string
  diseaseName: string
  confidence: "high" | "moderate" | "low"
  evidence: string
  citations: DiagnosisCitation[]
  sortOrder: number
}

export interface DiagnosisOutputItem {
  icdCode: string
  diseaseName: string
  confidence: "high" | "moderate" | "low"
  evidence: string
  citations: DiagnosisCitation[]
}

export type ConnectorType = "pubmed" | "icd11" | "europe_pmc" | "openfda" | "clinical_trials" | "dailymed"

export interface ConnectorState {
  pubmed: boolean
  icd11: boolean
  europe_pmc: boolean
  openfda: boolean
  clinical_trials: boolean
  dailymed: boolean
}

export interface DiagnosisDetailArticle {
  source: "pubmed" | "europe_pmc"
  title: string
  abstract: string
  authors: string[]
  url: string
}

export interface ClinicalDecisionSupport {
  diagnosticCriteria: string[]
  recommendedWorkup: string[]
  treatmentOptions: {
    firstLine: string[]
    alternatives: string[]
    nonPharmacologic: string[]
  }
  differentiatingFeatures: string[]
  escalationCriteria: string[]
  clinicalPearls: string[]
}

export interface EnrichedSource {
  citation: DiagnosisCitation
  articleDetail?: { abstract: string; authors: string[] } | null
  icd11Detail?: Icd11Detail | null
}

export interface ClinicalSupportResponse {
  support: ClinicalDecisionSupport
  sources: EnrichedSource[]
}

export interface Icd11Detail {
  description: string
  parents: { code: string; title: string }[]
  browserUrl: string
}

export interface FetchStatus {
  icd11: {
    url: string
    status: "success" | "failed" | "timeout" | "no_credentials"
  }[]
  articles: {
    source: string
    url: string
    status: "success" | "failed" | "timeout" | "id_extraction_failed"
  }[]
}

export interface DiagnosisDetails {
  icd11Details: (Icd11Detail | null)[]
  articles: DiagnosisDetailArticle[]
  fetchStatus: FetchStatus
  clinicalSupport?: ClinicalDecisionSupport
}

export interface InsightsResponse {
  title?: string
  summary: string
  keyFindings: string[]
  redFlags: string[]
  checklist: ChecklistOutputItem[]
  diagnoses?: DiagnosisOutputItem[]
}

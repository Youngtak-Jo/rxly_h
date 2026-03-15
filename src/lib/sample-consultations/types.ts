import type { Scenario } from "@/data/scenarios"
import type { DiagnosticKeyword } from "@/types/session"
import type { DiagnosisCitation } from "@/types/insights"
import type { ResearchCitation } from "@/stores/research-store"
import type { ConsultationRecord } from "@/types/record"
import type { PatientHandoutDocument } from "@/types/patient-handout"
import type { SessionDocumentGenerationInputs } from "@/types/document"

export const SAMPLE_PACK_VERSION = 1

export interface SampleArtifactMetadata {
  modelId: string
  promptFamily: string
  generatedAt: string
}

export interface SampleChecklistItemFixture {
  label: string
  isChecked: boolean
  isAutoChecked: boolean
  doctorNote: string | null
  source: "AI" | "MANUAL"
}

export interface SampleDiagnosisFixture {
  icdCode: string
  icdUri?: string | null
  diseaseName: string
  confidence: "high" | "moderate" | "low"
  evidence: string
  citations: DiagnosisCitation[]
}

export interface SampleInsightsFixture {
  summary: string
  keyFindings: string[]
  redFlags: string[]
  diagnosticKeywords: DiagnosticKeyword[]
  checklistItems: SampleChecklistItemFixture[]
  metadata: SampleArtifactMetadata
}

export interface SampleResearchExchangeFixture {
  question: string
  answer: string
  citations: ResearchCitation[]
  metadata: SampleArtifactMetadata
}

export interface SampleDocumentFixture {
  templateId: string
  title: string | null
  contentJson: Record<string, unknown>
  generationInputs: SessionDocumentGenerationInputs | null
  metadata: SampleArtifactMetadata
}

export interface SampleRecordFixture
  extends Omit<ConsultationRecord, "id" | "sessionId"> {
  metadata: SampleArtifactMetadata
}

export interface SamplePatientHandoutFixture
  extends Omit<PatientHandoutDocument, "id" | "sessionId"> {
  metadata: SampleArtifactMetadata
}

export interface SampleConsultationFixture {
  key: string
  scenarioId: Scenario["id"]
  sessionTitle: string
  patientName: string
  startedAt: string
  insights: SampleInsightsFixture
  diagnoses: SampleDiagnosisFixture[]
  research: SampleResearchExchangeFixture[]
  record: SampleRecordFixture
  patientHandout: SamplePatientHandoutFixture
  documents: SampleDocumentFixture[]
}

export interface SampleConsultationFixturePack {
  version: number
  generatedAt: string
  samples: SampleConsultationFixture[]
}

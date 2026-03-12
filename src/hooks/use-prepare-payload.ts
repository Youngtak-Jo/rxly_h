"use client"

import { useCallback } from "react"
import {
  deriveRecordFromRichTextDocument,
  isRichTextDocument,
  normalizeRichTextDocument,
} from "@/lib/documents/rich-text"
import { BUILT_IN_RECORD_TEMPLATE_ID } from "@/lib/documents/constants"
import { useSessionStore } from "@/stores/session-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useDdxStore } from "@/stores/ddx-store"
import { useSessionDocumentStore } from "@/stores/session-document-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useSettingsStore } from "@/stores/settings-store"

export function usePreparePayload() {
  const activeSession = useSessionStore((s) => s.activeSession)
  const medplumModel = useSettingsStore((s) => s.aiModel.medplumModel)
  const summary = useInsightsStore((s) => s.summary)
  const keyFindings = useInsightsStore((s) => s.keyFindings)
  const redFlags = useInsightsStore((s) => s.redFlags)
  const insightsDiagnoses = useInsightsStore((s) => s.diagnoses)
  const ddxDiagnoses = useDdxStore((s) => s.diagnoses)
  const getFullTranscript = useTranscriptStore((s) => s.getFullTranscript)
  const recordSessionDocument = useSessionDocumentStore((state) =>
    state.getDefaultSessionDocument(activeSession?.id, BUILT_IN_RECORD_TEMPLATE_ID)
  )

  return useCallback(() => {
    if (!activeSession) return null
    const diagnoses = ddxDiagnoses.length > 0 ? ddxDiagnoses : insightsDiagnoses
    const canonicalRecord =
      recordSessionDocument && isRichTextDocument(recordSessionDocument.contentJson)
        ? deriveRecordFromRichTextDocument(
            normalizeRichTextDocument(recordSessionDocument.contentJson),
            {
              id: recordSessionDocument.id,
              sessionId: activeSession.id,
              date: activeSession.startedAt,
              patientName: activeSession.patientName,
              chiefComplaint: null,
              hpiText: null,
              medications: null,
              rosText: null,
              pmh: null,
              socialHistory: null,
              familyHistory: null,
              vitals: null,
              physicalExam: null,
              labsStudies: null,
              assessment: null,
              plan: null,
            }
          )
        : null

    return {
      session: {
        title: activeSession.title,
        patientName: activeSession.patientName,
        startedAt: activeSession.startedAt,
        endedAt: activeSession.endedAt,
      },
      record: canonicalRecord
        ? {
            patientName: canonicalRecord.patientName,
            chiefComplaint: canonicalRecord.chiefComplaint,
            hpiText: canonicalRecord.hpiText,
            medications: canonicalRecord.medications,
            rosText: canonicalRecord.rosText,
            pmh: canonicalRecord.pmh,
            socialHistory: canonicalRecord.socialHistory,
            familyHistory: canonicalRecord.familyHistory,
            vitals: canonicalRecord.vitals,
            physicalExam: canonicalRecord.physicalExam,
            labsStudies: canonicalRecord.labsStudies,
            assessment: canonicalRecord.assessment,
            plan: canonicalRecord.plan,
          }
        : undefined,
      insights: summary
        ? { summary, keyFindings, redFlags }
        : undefined,
      diagnoses: diagnoses.length > 0
        ? diagnoses.map((d) => ({
            icdCode: d.icdCode,
            diseaseName: d.diseaseName,
            confidence: d.confidence,
            evidence: d.evidence,
          }))
        : undefined,
      transcript: getFullTranscript() || undefined,
      model: medplumModel || undefined,
    }
  }, [
    activeSession,
    recordSessionDocument,
    summary,
    keyFindings,
    redFlags,
    insightsDiagnoses,
    ddxDiagnoses,
    getFullTranscript,
    medplumModel,
  ])
}

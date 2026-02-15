"use client"

import { useCallback } from "react"
import { useSessionStore } from "@/stores/session-store"
import { useRecordStore } from "@/stores/record-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useDdxStore } from "@/stores/ddx-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useSettingsStore } from "@/stores/settings-store"

export function usePreparePayload() {
  const activeSession = useSessionStore((s) => s.activeSession)
  const medplumModel = useSettingsStore((s) => s.aiModel.medplumModel)
  const record = useRecordStore((s) => s.record)
  const summary = useInsightsStore((s) => s.summary)
  const keyFindings = useInsightsStore((s) => s.keyFindings)
  const redFlags = useInsightsStore((s) => s.redFlags)
  const insightsDiagnoses = useInsightsStore((s) => s.diagnoses)
  const ddxDiagnoses = useDdxStore((s) => s.diagnoses)
  const getFullTranscript = useTranscriptStore((s) => s.getFullTranscript)

  return useCallback(() => {
    if (!activeSession) return null
    const diagnoses = ddxDiagnoses.length > 0 ? ddxDiagnoses : insightsDiagnoses

    return {
      session: {
        title: activeSession.title,
        patientName: activeSession.patientName,
        startedAt: activeSession.startedAt,
        endedAt: activeSession.endedAt,
      },
      record: record
        ? {
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
  }, [activeSession, record, summary, keyFindings, redFlags, insightsDiagnoses, ddxDiagnoses, getFullTranscript, medplumModel])
}

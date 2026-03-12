"use client"

import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import { toast } from "sonner"

import { useSessionStore } from "@/stores/session-store"
import type { Session } from "@/types/session"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useRecordingStore } from "@/stores/recording-store"
import { useRecordingSegmentStore } from "@/stores/recording-segment-store"
import { useNoteStore } from "@/stores/note-store"
import { useDdxStore } from "@/stores/ddx-store"
import { useResearchStore } from "@/stores/research-store"
import { useConsultationModeStore } from "@/stores/consultation-mode-store"
import { useConsultationDocumentsStore } from "@/stores/consultation-documents-store"
import { useActiveConsultationDocumentDraftStore } from "@/stores/active-consultation-document-draft-store"
import { useSessionDocumentStore } from "@/stores/session-document-store"
import {
  cancelSessionLoad,
  deleteCachedSession,
  setCachedSession,
  setCoreCachedSession,
} from "@/hooks/use-session-loader"

export function useCreateSession() {
  const t = useTranslations("NavSessions")
  const router = useRouter()
  const { addSession, setActiveSession } = useSessionStore()
  const transcriptStore = useTranscriptStore()
  const insightsStore = useInsightsStore()
  const recordingStore = useRecordingStore()
  const recordingSegmentStore = useRecordingSegmentStore()
  const noteStore = useNoteStore()
  const ddxStore = useDdxStore()
  const researchStore = useResearchStore()

  const stopSimulationIfRunning = () => {
    const recState = useRecordingStore.getState()
    if (recState.isSimulating && recState.simulationControls) {
      recState.simulationControls.stop({ skipFinalAnalysis: true })
    }
  }

  const resetConsultationStores = (sessionId?: string) => {
    transcriptStore.reset()
    insightsStore.reset()
    ddxStore.reset()
    recordingStore.reset()
    recordingSegmentStore.reset()
    noteStore.reset()
    researchStore.reset()
    if (sessionId) {
      useSessionDocumentStore.getState().resetSessionDocuments(sessionId)
      useConsultationDocumentsStore.getState().resetSessionUi(sessionId)
      useActiveConsultationDocumentDraftStore.getState().clearSession(sessionId)
    }
    useConsultationModeStore.getState().reset()
    useConsultationTabStore.getState().clearAllUnseenUpdates()
  }

  const restorePreviousSessionContext = async (previousSession: Session | null) => {
    cancelSessionLoad()
    useSessionStore.getState().setSwitching(false)

    if (previousSession) {
      useSessionStore.getState().setActiveSession(previousSession)
      router.replace(`/consultation/${previousSession.id}`)
      return
    }

    useSessionStore.getState().setActiveSession(null)
    resetConsultationStores()
    router.replace("/consultation")
  }

  const createSession = async () => {
    const storeBeforeCreate = useSessionStore.getState()
    const previousSessions = storeBeforeCreate.sessions
    const previousActiveSession = storeBeforeCreate.activeSession

    cancelSessionLoad()
    useSessionStore.getState().setSwitching(false)
    stopSimulationIfRunning()

    const tempId = uuidv4()
    const now = new Date().toISOString()
    const newConsultationTitle = t("newConsultation")
    const optimisticSession: Session = {
      id: tempId,
      title: newConsultationTitle,
      patientName: null,
      mode: "DOCTOR",
      startedAt: now,
      endedAt: null,
      createdAt: now,
      updatedAt: now,
    }

    // Prevent a stale fetch for a not-yet-persisted session while navigating.
    const dummyCoreSession = {
      ...optimisticSession,
      insights: null,
      diagnoses: [],
      record: null,
      patientHandout: null,
      sessionDocuments: [],
      checklistItems: [],
    }
    setCoreCachedSession(tempId, dummyCoreSession)
    setCachedSession(tempId, {
      session: dummyCoreSession,
      transcriptEntries: [],
      notes: [],
      researchMessages: [],
      recordingSegments: [],
    })

    addSession(optimisticSession)
    setActiveSession(optimisticSession)
    resetConsultationStores(tempId)
    router.push(`/consultation/${tempId}`)

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tempId, title: newConsultationTitle }),
      })
      if (!res.ok) throw new Error("Failed to create session")
      const realSession = await res.json()

      const realCoreSession = {
        ...realSession,
        insights: realSession.insights ?? null,
        diagnoses: [],
        record: realSession.record ?? null,
        patientHandout: null,
        sessionDocuments: [],
        checklistItems: [],
      }

      const store = useSessionStore.getState()
      store.setSessions(
        store.sessions.map((s) => (s.id === tempId ? realSession : s))
      )
      if (store.activeSession?.id === tempId) {
        store.setActiveSession(realSession)
      }
      setCoreCachedSession(realSession.id, realCoreSession)
      setCachedSession(realSession.id, {
        session: realCoreSession,
        transcriptEntries: [],
        notes: [],
        researchMessages: [],
        recordingSegments: [],
      })
      if (realSession.id !== tempId) {
        deleteCachedSession(tempId)
      }
    } catch (error) {
      console.error("Failed to create session:", error)
      toast.error(t("createFailed"))
      deleteCachedSession(tempId)
      const store = useSessionStore.getState()
      store.setSessions(previousSessions)
      await restorePreviousSessionContext(previousActiveSession)
    }
  }

  return { createSession }
}

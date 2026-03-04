"use client"

import { useCallback, useEffect, useRef } from "react"
import {
  computeRecordFingerprint,
  useRecordStore,
} from "@/stores/record-store"
import { useRecordingStore } from "@/stores/recording-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { buildDoctorNotes, useNoteStore } from "@/stores/note-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useSessionStore } from "@/stores/session-store"
import { useSettingsStore } from "@/stores/settings-store"
import type { ConsultationRecord } from "@/types/record"
import { trackClientEvent } from "@/lib/telemetry/client-events"
import { deleteCachedSession } from "@/hooks/use-session-loader"
import { useDocumentWorkspaceStore } from "@/stores/document-workspace-store"
import { BUILT_IN_RECORD_TEMPLATE_ID } from "@/lib/documents/constants"

const WAIT_TIMEOUT_MS = 60000

function toPersistableRecordPayload(record: ConsultationRecord) {
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

export async function generateRecord(
  sessionId: string,
  patientName: string | null,
  existingRecordId?: string,
  signal?: AbortSignal
) {
  const workspaceState = useDocumentWorkspaceStore.getState()
  if (
    workspaceState.hasLoaded &&
    !workspaceState.isDocumentInstalled(BUILT_IN_RECORD_TEMPLATE_ID)
  ) {
    return
  }

  const { setGenerating, setRecord, setLastPersistedFingerprint } =
    useRecordStore.getState()

  const transcript = useTranscriptStore.getState().getFullTranscript()
  const { summary, keyFindings } = useInsightsStore.getState()
  const existingRecord = useRecordStore.getState().record

  // Use cached notes from store instead of fetching
  const notes = useNoteStore.getState().notes
  const doctorNotes = buildDoctorNotes(notes)
  const imageUrls = notes.flatMap((n) => n.imageUrls || [])

  // Need at least transcript, notes, or images to generate
  if (!transcript.trim() && !doctorNotes.trim() && imageUrls.length === 0) return

  const { aiModel, customInstructions } = useSettingsStore.getState()

  setGenerating(true)
  trackClientEvent({
    eventType: "analysis_triggered",
    feature: "record",
    sessionId,
  })
  try {
    const res = await fetch("/api/ai/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript,
        doctorNotes,
        imageUrls,
        insights: { summary, keyFindings },
        sessionId,
        existingRecord,
        model: aiModel.recordModel,
        customInstructions: customInstructions.record || undefined,
      }),
      signal,
    })

    if (!res.ok) throw new Error("Failed to generate record")

    const reader = res.body?.getReader()
    if (!reader) throw new Error("No stream")

    const decoder = new TextDecoder()
    let accumulated = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      accumulated += decoder.decode(value, { stream: true })
    }

    // Parse the final accumulated JSON (strip markdown code fences if present)
    try {
      const cleaned = accumulated
        .replace(/^```(?:json)?\s*\n?/, "")
        .replace(/\n?```\s*$/, "")
      const parsed = JSON.parse(cleaned)

      // Bail out if the session changed while we were streaming
      const currentSessionId = useSessionStore.getState().activeSession?.id
      if (currentSessionId !== sessionId) return

      const newRecord = {
        id: existingRecordId || "temp",
        sessionId,
        date: new Date().toISOString(),
        patientName,
        chiefComplaint: parsed.chiefComplaint || null,
        hpiText: parsed.hpiText || null,
        medications: Array.isArray(parsed.medications) ? parsed.medications.join("\n") : (parsed.medications || null),
        rosText: parsed.rosText || null,
        pmh: parsed.pmh || null,
        socialHistory: parsed.socialHistory || null,
        familyHistory: parsed.familyHistory || null,
        vitals: parsed.vitals || null,
        physicalExam: parsed.physicalExam || null,
        labsStudies: Array.isArray(parsed.labsStudies) ? parsed.labsStudies.join("\n") : (parsed.labsStudies || null),
        assessment: Array.isArray(parsed.assessment) ? parsed.assessment.map((a: string, i: number) => `${i + 1}. ${a}`).join("\n") : (parsed.assessment || null),
        plan: parsed.plan || null,
      }
      setRecord(newRecord)
      trackClientEvent({
        eventType: "analysis_completed",
        feature: "record",
        sessionId,
      })

      const recordFingerprint = computeRecordFingerprint(newRecord)
      const lastPersistedFingerprint =
        useRecordStore.getState().lastPersistedFingerprint
      const shouldPersistNow =
        recordFingerprint !== null &&
        recordFingerprint !== lastPersistedFingerprint

      // Immediately persist to DB (fire-and-forget), unless autosave payload is unchanged.
      if (shouldPersistNow) {
        fetch(`/api/sessions/${sessionId}/record`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toPersistableRecordPayload(newRecord)),
        })
          .then((res) => {
            if (res.ok) {
              deleteCachedSession(sessionId)
              setLastPersistedFingerprint(recordFingerprint)
            }
          })
          .catch((err) => console.error("Failed to persist record:", err))
      }
    } catch {
      console.error("Failed to parse record response")
      trackClientEvent({
        eventType: "analysis_failed",
        feature: "record",
        sessionId,
        metadata: { reason: "parse_error" },
      })
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return
    console.error("Failed to generate record:", error)
    trackClientEvent({
      eventType: "analysis_failed",
      feature: "record",
      sessionId,
      metadata: { reason: "request_error" },
    })
  } finally {
    setGenerating(false)
  }
}

function waitForInsightsToComplete(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    // Only wait for insights — Record doesn't depend on DDx,
    // so DDx and Record can run in parallel after insights finishes.
    const check = () => !useInsightsStore.getState().isProcessing

    if (check()) {
      resolve()
      return
    }

    const timeout = setTimeout(() => {
      unsub()
      resolve()
    }, WAIT_TIMEOUT_MS)

    const onAbort = () => {
      clearTimeout(timeout)
      unsub()
      reject(new DOMException("Aborted", "AbortError"))
    }
    signal.addEventListener("abort", onAbort, { once: true })

    const unsub = useInsightsStore.subscribe(() => {
      if (check()) {
        clearTimeout(timeout)
        signal.removeEventListener("abort", onAbort)
        unsub()
        resolve()
      }
    })
  })
}

export function useLiveRecord() {
  const abortControllerRef = useRef<AbortController | null>(null)
  const activeSession = useSessionStore((s) => s.activeSession)

  const autoGenerate = useCallback(async (signal: AbortSignal) => {
    try {
      // Wait for insights only — DDx and Record run in parallel
      await waitForInsightsToComplete(signal)

      const session = useSessionStore.getState().activeSession
      if (!session) return

      const workspaceState = useDocumentWorkspaceStore.getState()
      if (
        workspaceState.hasLoaded &&
        !workspaceState.isDocumentInstalled(BUILT_IN_RECORD_TEMPLATE_ID)
      ) {
        return
      }

      // Skip if record already exists (user can manually regenerate)
      if (useRecordStore.getState().record) return

      // Skip if already generating
      if (useRecordStore.getState().isGenerating) return

      const transcript = useTranscriptStore.getState().getFullTranscript()
      if (!transcript.trim()) return

      await generateRecord(session.id, session.patientName, undefined, signal)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      console.error("Auto record generation failed:", error)
    }
  }, [])

  // Subscribe to recording state changes
  useEffect(() => {
    let prevIsRecording = useRecordingStore.getState().isRecording

    const unsubscribe = useRecordingStore.subscribe((state) => {
      const wasRecording = prevIsRecording
      prevIsRecording = state.isRecording

      // Detect recording stop (true → false)
      if (wasRecording && !state.isRecording) {
        // Abort any previous auto-generation
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }

        const controller = new AbortController()
        abortControllerRef.current = controller
        autoGenerate(controller.signal)
      }
    })

    return () => {
      unsubscribe()
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [autoGenerate])

  // Clean up on session change
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [activeSession?.id])
}

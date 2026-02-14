"use client"

import { useCallback, useEffect, useRef } from "react"
import { useRecordStore } from "@/stores/record-store"
import { useRecordingStore } from "@/stores/recording-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useSessionStore } from "@/stores/session-store"
import { useSettingsStore } from "@/stores/settings-store"

const WAIT_TIMEOUT_MS = 60000

export async function generateRecord(
  sessionId: string,
  patientName: string | null,
  existingRecordId?: string,
  signal?: AbortSignal
) {
  const { setGenerating, setRecord } = useRecordStore.getState()

  const transcript = useTranscriptStore.getState().getFullTranscript()
  const { summary, keyFindings } = useInsightsStore.getState()
  const existingRecord = useRecordStore.getState().record

  // Fetch doctor notes and image URLs
  let doctorNotes = ""
  let imageUrls: string[] = []
  try {
    const notesRes = await fetch(`/api/sessions/${sessionId}/notes`, { signal })
    if (notesRes.ok) {
      const notes = await notesRes.json()
      if (notes.length > 0) {
        doctorNotes = notes
          .map((n: { content: string }) => n.content)
          .filter(Boolean)
          .join("\n")
        imageUrls = notes.flatMap(
          (n: { imageUrls: string[] }) => n.imageUrls || []
        )
      }
    }
  } catch {
    // Continue without notes
  }

  // Need at least transcript, notes, or images to generate
  if (!transcript.trim() && !doctorNotes.trim() && imageUrls.length === 0) return

  const { recordModel } = useSettingsStore.getState().aiModel

  setGenerating(true)
  try {
    const res = await fetch("/api/grok/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript,
        doctorNotes,
        imageUrls,
        insights: { summary, keyFindings },
        sessionId,
        existingRecord,
        model: recordModel,
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
      const newRecord = {
        id: existingRecordId || "temp",
        sessionId,
        date: new Date().toISOString(),
        patientName,
        chiefComplaint: parsed.chiefComplaint || null,
        hpiText: parsed.hpiText || null,
        medications: parsed.medications || null,
        rosText: parsed.rosText || null,
        pmh: parsed.pmh || null,
        socialHistory: parsed.socialHistory || null,
        familyHistory: parsed.familyHistory || null,
        vitals: parsed.vitals || null,
        physicalExam: parsed.physicalExam || null,
        labsStudies: parsed.labsStudies || null,
        assessment: parsed.assessment || null,
        plan: parsed.plan || null,
      }
      setRecord(newRecord)

      // Immediately persist to DB (fire-and-forget)
      fetch(`/api/sessions/${sessionId}/record`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: newRecord.patientName,
          chiefComplaint: newRecord.chiefComplaint,
          hpiText: newRecord.hpiText,
          medications: newRecord.medications,
          rosText: newRecord.rosText,
          pmh: newRecord.pmh,
          socialHistory: newRecord.socialHistory,
          familyHistory: newRecord.familyHistory,
          vitals: newRecord.vitals,
          physicalExam: newRecord.physicalExam,
          labsStudies: newRecord.labsStudies,
          assessment: newRecord.assessment,
          plan: newRecord.plan,
        }),
      }).catch((err) => console.error("Failed to persist record:", err))
    } catch {
      console.error("Failed to parse record response")
      setGenerating(false)
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return
    console.error("Failed to generate record:", error)
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

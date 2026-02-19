"use client"

import { useCallback, useEffect, useRef } from "react"
import { useDdxStore } from "@/stores/ddx-store"
import { useInsightsStore } from "@/stores/insights-store"
import { usePatientHandoutStore } from "@/stores/patient-handout-store"
import { useRecordingStore } from "@/stores/recording-store"
import { useSessionStore } from "@/stores/session-store"
import { useSettingsStore } from "@/stores/settings-store"
import { useTranscriptStore } from "@/stores/transcript-store"

const WAIT_TIMEOUT_MS = 60000

function resolveLanguage(
  mode: "auto" | "ko" | "en",
  sttLanguage: string
): "ko" | "en" {
  if (mode === "ko" || mode === "en") return mode
  return sttLanguage.toLowerCase().startsWith("ko") ? "ko" : "en"
}

async function fetchDoctorNotes(
  sessionId: string,
  signal: AbortSignal
): Promise<string> {
  try {
    const res = await fetch(`/api/sessions/${sessionId}/notes`, { signal })
    if (!res.ok) return ""
    const notes = (await res.json()) as Array<{ content: string }>
    return notes
      .map((note) => note.content)
      .filter(Boolean)
      .join("\n")
  } catch {
    return ""
  }
}

function waitForInsightsToComplete(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
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

export async function generatePatientHandout(
  sessionId: string,
  externalSignal?: AbortSignal
) {
  const {
    selectedConditions,
    languageMode,
    setGenerating,
    setGeneratedDocument,
    setAbortController,
    document,
  } = usePatientHandoutStore.getState()

  if (selectedConditions.length === 0) return
  if (usePatientHandoutStore.getState().isGenerating) return

  const currentAbort = usePatientHandoutStore.getState().abortController
  if (currentAbort) currentAbort.abort()

  const controller = new AbortController()
  setAbortController(controller)

  const abortFromExternal = () => controller.abort()
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort()
    } else {
      externalSignal.addEventListener("abort", abortFromExternal, { once: true })
    }
  }

  const transcript = useTranscriptStore.getState().getFullTranscript()
  const insightsStore = useInsightsStore.getState()
  const ddxStore = useDdxStore.getState()
  const settingsStore = useSettingsStore.getState()
  const resolvedLanguage = resolveLanguage(languageMode, settingsStore.stt.language)

  setGenerating(true)

  try {
    const doctorNotes = await fetchDoctorNotes(sessionId, controller.signal)

    const diagnoses = ddxStore.diagnoses.map((diagnosis) => ({
      icdCode: diagnosis.icdCode,
      diseaseName: diagnosis.diseaseName,
      confidence: diagnosis.confidence,
      evidence: diagnosis.evidence,
    }))

    const res = await fetch("/api/ai/patient-handout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript,
        doctorNotes,
        insights: {
          summary: insightsStore.summary,
          keyFindings: insightsStore.keyFindings,
          redFlags: insightsStore.redFlags,
        },
        diagnoses,
        selectedConditions,
        language: resolvedLanguage,
        model: settingsStore.aiModel.patientHandoutModel,
        customInstructions: settingsStore.customInstructions.patientHandout || undefined,
      }),
      signal: controller.signal,
    })

    if (!res.ok) throw new Error(`Failed to generate patient handout: ${res.status}`)

    const generated = (await res.json()) as {
      language: "ko" | "en"
      conditions: typeof selectedConditions
      entries: Array<{
        conditionId: string
        sections: {
          conditionOverview: string
          signsSymptoms: string
          causesRiskFactors: string
          complications: string
          treatmentOptions: string
          whenToSeekHelp: string
          additionalAdviceFollowUp: string
          disclaimer: string
        }
      }>
    }

    const currentSessionId = useSessionStore.getState().activeSession?.id
    if (currentSessionId !== sessionId) return

    const handout = {
      id: document?.id || "temp",
      sessionId,
      language: generated.language,
      conditions: generated.conditions,
      entries: generated.entries,
      generatedAt: new Date().toISOString(),
    }

    setGeneratedDocument(handout)

    fetch(`/api/sessions/${sessionId}/patient-handout`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(handout),
    }).catch((error) => console.error("Failed to persist patient handout:", error))
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return
    console.error("Failed to generate patient handout:", error)
  } finally {
    if (externalSignal) {
      externalSignal.removeEventListener("abort", abortFromExternal)
    }
    setGenerating(false)
    setAbortController(null)
  }
}

export function useLivePatientHandout() {
  const activeSession = useSessionStore((s) => s.activeSession)
  const abortControllerRef = useRef<AbortController | null>(null)

  const autoGenerate = useCallback(async (signal: AbortSignal) => {
    try {
      await waitForInsightsToComplete(signal)

      const session = useSessionStore.getState().activeSession
      if (!session) return

      if (usePatientHandoutStore.getState().selectedConditions.length === 0) {
        return
      }

      await generatePatientHandout(session.id, signal)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return
      console.error("Auto patient handout generation failed:", error)
    }
  }, [])

  const generateNow = useCallback(async () => {
    const session = useSessionStore.getState().activeSession
    if (!session) return

    await generatePatientHandout(session.id)
  }, [])

  useEffect(() => {
    let prevIsRecording = useRecordingStore.getState().isRecording

    const unsubscribe = useRecordingStore.subscribe((state) => {
      const wasRecording = prevIsRecording
      prevIsRecording = state.isRecording

      if (wasRecording && !state.isRecording) {
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

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [activeSession?.id])

  return { generateNow }
}

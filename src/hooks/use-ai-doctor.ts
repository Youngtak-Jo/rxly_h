"use client"

import { useCallback, useRef } from "react"
import { useConsultationModeStore } from "@/stores/consultation-mode-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useSessionStore } from "@/stores/session-store"
import { useSettingsStore } from "@/stores/settings-store"
import { useRecordingStore } from "@/stores/recording-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useNoteStore } from "@/stores/note-store"
import { useDdxStore } from "@/stores/ddx-store"
import { v4 as uuidv4 } from "uuid"
import { toast } from "sonner"

const OPENING_MESSAGE =
  "Hi. I'm your AI doctor. Please have a seat. What brings you in today?"

export function useAiDoctor() {
  const consultationStartRef = useRef<number>(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const getElapsedSeconds = () =>
    consultationStartRef.current
      ? (Date.now() - consultationStartRef.current) / 1000
      : 0

  const addToTranscript = useCallback(
    (speaker: "DOCTOR" | "PATIENT", text: string) => {
      const session = useSessionStore.getState().activeSession
      if (!session) return

      const elapsed = getElapsedSeconds()
      const entry = {
        id: uuidv4(),
        sessionId: session.id,
        speaker,
        text,
        startTime: elapsed,
        endTime: elapsed,
        confidence: 1.0,
        isFinal: true,
        createdAt: new Date().toISOString(),
      }

      useTranscriptStore.getState().addFinalEntry(entry)

      // Persist to DB (fire-and-forget)
      fetch(`/api/sessions/${session.id}/transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      }).catch(() => { })
    },
    []
  )

  const startConsultation = useCallback(() => {
    const session = useSessionStore.getState().activeSession
    if (!session) return

    consultationStartRef.current = Date.now()

    const modeStore = useConsultationModeStore.getState()
    modeStore.setConsultationStarted(true)

    // Set recording state so analysis hooks activate
    const recordingStore = useRecordingStore.getState()
    recordingStore.setRecording(true)
    recordingStore.setDuration(0)

    // Set identification status to "identified" since we know the speakers
    useTranscriptStore.getState().setIdentificationStatus("identified")

    // Add opening message
    modeStore.addMessage("assistant", OPENING_MESSAGE)
    addToTranscript("DOCTOR", OPENING_MESSAGE)

    toast.info(
      "You can type messages or use the microphone button for voice input.",
      { duration: 5000 }
    )
  }, [addToTranscript])

  const sendMessage = useCallback(
    async (text: string, imageUrls?: string[]) => {
      const trimmed = text.trim()
      const hasImages = imageUrls && imageUrls.length > 0
      if (!trimmed && !hasImages) return

      const session = useSessionStore.getState().activeSession
      if (!session) return

      const modeStore = useConsultationModeStore.getState()

      // Build transcript text
      const transcriptText = hasImages
        ? `${trimmed ? trimmed + " " : ""}[Patient sent ${imageUrls.length} image(s)]`
        : trimmed

      // Add user message
      modeStore.addMessage("user", trimmed || "[Image]", imageUrls)
      addToTranscript("PATIENT", transcriptText)

      // If images were sent, also save them as a note so the analysis pipeline picks them up
      if (hasImages) {
        try {
          const noteRes = await fetch(`/api/sessions/${session.id}/notes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: trimmed || "",
              imageUrls,
              storagePaths: [],
            }),
          })
          if (noteRes.ok) {
            const savedNote = await noteRes.json()
            useNoteStore.getState().addNote({
              id: savedNote.id,
              content: savedNote.content,
              imageUrls: savedNote.imageUrls || [],
              storagePaths: savedNote.storagePaths || [],
              source: savedNote.source,
              createdAt: savedNote.createdAt,
            })
          }
        } catch {
          // Note save is best-effort for analysis pipeline
        }
      }

      // Build messages array for the API (Vercel AI SDK format)
      // For multimodal messages, content is an array of parts
      const messages = useConsultationModeStore
        .getState()
        .aiDoctorMessages.map((m) => {
          if (m.imageUrls && m.imageUrls.length > 0) {
            // Multimodal message
            const content: Array<
              | { type: "text"; text: string }
              | { type: "image"; image: string }
            > = []
            if (m.content) {
              content.push({ type: "text", text: m.content })
            }
            for (const url of m.imageUrls) {
              content.push({ type: "image", image: url })
            }
            return { role: m.role, content }
          }
          return { role: m.role, content: m.content }
        })

      const modelId = useSettingsStore.getState().aiModel.aiDoctorModel

      modeStore.setAiResponding(true)

      try {
        abortControllerRef.current = new AbortController()

        const res = await fetch("/api/ai/ai-doctor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, model: modelId }),
          signal: abortControllerRef.current.signal,
        })

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`)
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error("No response body")

        const decoder = new TextDecoder()
        let accumulated = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
        }

        // Add AI response
        const responseText = accumulated.trim()
        if (responseText) {
          modeStore.addMessage("assistant", responseText)
          addToTranscript("DOCTOR", responseText)

          // Trigger analysis
          const insightsTrigger =
            useInsightsStore.getState()._noteTrigger
          if (insightsTrigger) insightsTrigger()

          const ddxTrigger = useDdxStore.getState()._noteTrigger
          if (ddxTrigger) ddxTrigger()
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("AI Doctor error:", error)
          toast.error("Failed to get AI doctor response")
        }
      } finally {
        modeStore.setAiResponding(false)
        abortControllerRef.current = null
      }
    },
    [addToTranscript]
  )

  const endConsultation = useCallback(() => {
    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // Stop recording state (triggers final analysis in useLiveRecord)
    useRecordingStore.getState().setRecording(false)

    // Deactivate mic
    useConsultationModeStore.getState().setMicActive(false)
  }, [])

  return { startConsultation, sendMessage, endConsultation }
}

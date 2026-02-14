"use client"

import { useEffect, useRef } from "react"
import { useRecordingStore } from "@/stores/recording-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useSessionStore } from "@/stores/session-store"
import { useSettingsStore } from "@/stores/settings-store"

export function useDiagnosticHighlights() {
  const isRecording = useRecordingStore((s) => s.isRecording)
  const wasRecordingRef = useRef(false)
  const isAnalyzingRef = useRef(false)

  useEffect(() => {
    if (wasRecordingRef.current && !isRecording && !isAnalyzingRef.current) {
      const analyze = async () => {
        const { getFullTranscript, setHighlightStatus, setDiagnosticKeywords } =
          useTranscriptStore.getState()

        const transcript = getFullTranscript()
        if (!transcript.trim()) return

        isAnalyzingRef.current = true
        setHighlightStatus("loading")

        try {
          const res = await fetch("/api/grok/diagnostic-keywords", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transcript,
              model: useSettingsStore.getState().aiModel.diagnosticKeywordsModel,
            }),
          })

          if (!res.ok) throw new Error("Keyword extraction failed")

          const keywords = await res.json()
          setDiagnosticKeywords(keywords)

          // Persist to DB
          const sessionId = useSessionStore.getState().activeSession?.id
          if (sessionId) {
            fetch(`/api/sessions/${sessionId}/insights`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ diagnosticKeywords: keywords }),
            }).catch(console.error)
          }
        } catch (error) {
          console.error("Diagnostic highlight extraction failed:", error)
          setHighlightStatus("idle")
        } finally {
          isAnalyzingRef.current = false
        }
      }

      analyze()
    }

    wasRecordingRef.current = isRecording
  }, [isRecording])
}

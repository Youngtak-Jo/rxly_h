"use client"

import { useEffect, useRef } from "react"
import { useRecordingStore } from "@/stores/recording-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useSessionStore } from "@/stores/session-store"
import { useSettingsStore } from "@/stores/settings-store"
import type { DiagnosticKeyword } from "@/types/session"

export function useDiagnosticHighlights() {
  const isRecording = useRecordingStore((s) => s.isRecording)
  const wasRecordingRef = useRef(false)
  const isAnalyzingRef = useRef(false)

  useEffect(() => {
    if (wasRecordingRef.current && !isRecording && !isAnalyzingRef.current) {
      const analyze = async () => {
        const {
          getTranscriptSince,
          setHighlightStatus,
          setDiagnosticKeywords,
          diagnosticKeywords: existingKeywords,
          lastAnalyzedHighlightIndex,
          setLastAnalyzedHighlightIndex,
          entries,
        } = useTranscriptStore.getState()

        const transcript = getTranscriptSince(lastAnalyzedHighlightIndex)
        if (!transcript.trim()) return

        const currentEntryCount = entries.length
        isAnalyzingRef.current = true
        setHighlightStatus("loading")

        try {
          const res = await fetch("/api/ai/diagnostic-keywords", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transcript,
              model: useSettingsStore.getState().aiModel.diagnosticKeywordsModel,
            }),
          })

          if (!res.ok) throw new Error("Keyword extraction failed")

          const newKeywords = (await res.json()) as DiagnosticKeyword[]

          // Deduplicate and merge keywords
          const mergedKeywords = [...existingKeywords]
          const seen = new Set(
            existingKeywords
              .filter((k) => k?.category && k?.phrase)
              .map((k) => `${k.category}:${k.phrase.toLowerCase()}`)
          )

          for (const k of newKeywords) {
            if (!k?.category || !k?.phrase) continue

            const key = `${k.category}:${k.phrase.toLowerCase()}`
            if (!seen.has(key)) {
              seen.add(key)
              mergedKeywords.push(k)
            }
          }

          setDiagnosticKeywords(mergedKeywords)
          setLastAnalyzedHighlightIndex(currentEntryCount)

          // Persist to DB
          const sessionId = useSessionStore.getState().activeSession?.id
          if (sessionId) {
            fetch(`/api/sessions/${sessionId}/insights`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ diagnosticKeywords: mergedKeywords }),
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

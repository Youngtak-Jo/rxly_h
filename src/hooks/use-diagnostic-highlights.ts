"use client"

import { useEffect, useRef } from "react"
import { useRecordingStore } from "@/stores/recording-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useSessionStore } from "@/stores/session-store"
import { useSettingsStore } from "@/stores/settings-store"
import type { DiagnosticKeyword } from "@/types/session"
import { deleteCachedSession } from "@/hooks/use-session-loader"

export function useDiagnosticHighlights() {
  const isRecording = useRecordingStore((s) => s.isRecording)
  const activeSessionId = useSessionStore((s) => s.activeSession?.id)
  const wasRecordingRef = useRef(false)
  const isAnalyzingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (wasRecordingRef.current && !isRecording && !isAnalyzingRef.current) {
      const analyze = async () => {
        let abortController: AbortController | null = null
        const {
          getTranscriptSince,
          setHighlightStatus,
          setDiagnosticKeywords,
          diagnosticKeywords: existingKeywords,
          lastAnalyzedHighlightIndex,
          setLastAnalyzedHighlightIndex,
          entries,
        } = useTranscriptStore.getState()
        const sessionId = useSessionStore.getState().activeSession?.id

        const transcript = getTranscriptSince(lastAnalyzedHighlightIndex)
        if (!transcript.trim() || !sessionId) return

        const currentEntryCount = entries.length
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        abortController = new AbortController()
        abortControllerRef.current = abortController
        isAnalyzingRef.current = true
        setHighlightStatus("loading")

        try {
          const res = await fetch("/api/ai/diagnostic-keywords", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              transcript,
              model: useSettingsStore.getState().aiModel.diagnosticKeywordsModel,
            }),
            signal: abortController.signal,
          })

          if (!res.ok) throw new Error("Keyword extraction failed")

          const newKeywords = (await res.json()) as DiagnosticKeyword[]
          const currentSessionId = useSessionStore.getState().activeSession?.id
          if (currentSessionId !== sessionId || abortController.signal.aborted) {
            setHighlightStatus("idle")
            return
          }

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
          fetch(`/api/sessions/${sessionId}/insights`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ diagnosticKeywords: mergedKeywords }),
          })
            .then((res) => {
              const latestSessionId = useSessionStore.getState().activeSession?.id
              if (res.ok && latestSessionId === sessionId) {
                deleteCachedSession(sessionId)
              }
            })
            .catch(console.error)
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            setHighlightStatus("idle")
            return
          }
          console.error("Diagnostic highlight extraction failed:", error)
          setHighlightStatus("idle")
        } finally {
          isAnalyzingRef.current = false
          if (abortControllerRef.current === abortController) {
            abortControllerRef.current = null
          }
        }
      }

      analyze()
    }

    wasRecordingRef.current = isRecording
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [isRecording, activeSessionId])
}

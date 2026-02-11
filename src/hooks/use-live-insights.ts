"use client"

import { useCallback, useRef } from "react"
import { useInsightsStore } from "@/stores/insights-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useSessionStore } from "@/stores/session-store"
import type { InsightsResponse } from "@/types/insights"

const MIN_NEW_WORDS = 30
const MIN_INTERVAL_MS = 12000

export function useLiveInsights() {
  const lastAnalysisTimeRef = useRef<number>(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isAnalyzingRef = useRef(false)

  const {
    summary,
    keyFindings,
    redFlags,
    checklistItems,
    wordCountAtLastUpdate,
    setProcessing,
    updateFromResponse,
    setWordCountAtLastUpdate,
  } = useInsightsStore()
  const getFullTranscript = useTranscriptStore((s) => s.getFullTranscript)
  const activeSession = useSessionStore((s) => s.activeSession)

  const analyzeTranscript = useCallback(async () => {
    if (!activeSession || isAnalyzingRef.current) return

    const transcript = getFullTranscript()
    const currentWordCount = transcript.split(/\s+/).length
    const newWords = currentWordCount - wordCountAtLastUpdate
    const timeSinceLastAnalysis = Date.now() - lastAnalysisTimeRef.current

    if (newWords < MIN_NEW_WORDS && timeSinceLastAnalysis < MIN_INTERVAL_MS)
      return

    // Abort any in-flight analysis
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController
    isAnalyzingRef.current = true
    setProcessing(true)

    try {
      const res = await fetch("/api/grok/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          currentInsights: {
            summary,
            keyFindings,
            redFlags,
            checklistItems: checklistItems.map((item) => ({
              label: item.label,
              isChecked: item.isChecked,
            })),
          },
          sessionId: activeSession.id,
        }),
        signal: abortController.signal,
      })

      if (!res.ok) throw new Error("Analysis failed")

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No stream")

      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
      }

      // Parse the complete response
      try {
        const parsed: InsightsResponse = JSON.parse(accumulated)
        updateFromResponse(parsed, activeSession.id)
        setWordCountAtLastUpdate(currentWordCount)
        lastAnalysisTimeRef.current = Date.now()

        // Persist insights to DB
        await fetch(`/api/sessions/${activeSession.id}/insights`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: parsed.summary,
            keyFindings: parsed.keyFindings,
            redFlags: parsed.redFlags,
          }),
        }).catch(console.error)
      } catch {
        console.error("Failed to parse insights response:", accumulated)
        setProcessing(false)
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return // Cancelled, new analysis will follow
      }
      console.error("Insights analysis failed:", error)
      setProcessing(false)
    } finally {
      isAnalyzingRef.current = false
    }
  }, [
    activeSession,
    getFullTranscript,
    wordCountAtLastUpdate,
    summary,
    keyFindings,
    redFlags,
    checklistItems,
    setProcessing,
    updateFromResponse,
    setWordCountAtLastUpdate,
  ])

  const triggerAnalysis = useCallback(() => {
    // Debounce: only run if enough time has passed
    const timeSinceLastAnalysis = Date.now() - lastAnalysisTimeRef.current
    if (timeSinceLastAnalysis >= MIN_INTERVAL_MS) {
      analyzeTranscript()
    } else {
      // Schedule for later
      setTimeout(
        () => analyzeTranscript(),
        MIN_INTERVAL_MS - timeSinceLastAnalysis
      )
    }
  }, [analyzeTranscript])

  return { triggerAnalysis, analyzeTranscript }
}

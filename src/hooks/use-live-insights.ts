"use client"

import { useCallback, useEffect, useRef } from "react"
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
  const titleGeneratedRef = useRef(false)

  const activeSession = useSessionStore((s) => s.activeSession)

  // Reset title-generated flag when session changes
  useEffect(() => {
    titleGeneratedRef.current = false
  }, [activeSession?.id])

  const runAnalysis = useCallback(
    async (forceRun: boolean = false) => {
      const session = useSessionStore.getState().activeSession
      if (!session || isAnalyzingRef.current) return

      const {
        summary,
        keyFindings,
        redFlags,
        checklistItems,
        wordCountAtLastUpdate,
        setProcessing,
        updateFromResponse,
        setWordCountAtLastUpdate,
      } = useInsightsStore.getState()

      const transcript = useTranscriptStore.getState().getFullTranscript()
      const currentWordCount = transcript.split(/\s+/).length
      const newWords = currentWordCount - wordCountAtLastUpdate
      const timeSinceLastAnalysis = Date.now() - lastAnalysisTimeRef.current

      // When not forced, require transcript with enough new content
      if (!forceRun) {
        if (!transcript.trim()) return
        if (
          newWords < MIN_NEW_WORDS &&
          timeSinceLastAnalysis < MIN_INTERVAL_MS
        )
          return
      }

      // Abort any in-flight analysis
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const abortController = new AbortController()
      abortControllerRef.current = abortController
      isAnalyzingRef.current = true
      setProcessing(true)

      try {
        // Fetch doctor notes for context (including image URLs for vision)
        let doctorNotes = ""
        let imageUrls: string[] = []
        try {
          const notesRes = await fetch(
            `/api/sessions/${session.id}/notes`,
            { signal: abortController.signal }
          )
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
          // Ignore notes fetch failure
        }

        const res = await fetch("/api/grok/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            doctorNotes,
            imageUrls,
            currentInsights: {
              summary,
              keyFindings,
              redFlags,
              checklistItems: checklistItems.map((item) => ({
                label: item.label,
                isChecked: item.isChecked,
              })),
            },
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

        // Parse the complete response (strip markdown code fences if present)
        try {
          const cleaned = accumulated.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "")
          const parsed: InsightsResponse = JSON.parse(cleaned)
          updateFromResponse(parsed, session.id)
          setWordCountAtLastUpdate(currentWordCount)
          lastAnalysisTimeRef.current = Date.now()

          // Auto-save title once from the first insights response
          if (
            !titleGeneratedRef.current &&
            session.title === "New Consultation" &&
            parsed.title
          ) {
            titleGeneratedRef.current = true
            const title = parsed.title.replace(/^["']|["']$/g, "")
            useSessionStore.getState().updateSession(session.id, { title })
            fetch(`/api/sessions/${session.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title }),
            }).catch(console.error)
          }
        } catch {
          console.error("Failed to parse insights response:", accumulated)
          setProcessing(false)
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        console.error("Insights analysis failed:", error)
        useInsightsStore.getState().setProcessing(false)
      } finally {
        isAnalyzingRef.current = false
      }
    },
    []
  )

  const analyzeTranscript = useCallback(() => {
    runAnalysis(false)
  }, [runAnalysis])

  const triggerAnalysis = useCallback(() => {
    const timeSinceLastAnalysis = Date.now() - lastAnalysisTimeRef.current
    if (timeSinceLastAnalysis >= MIN_INTERVAL_MS) {
      analyzeTranscript()
    } else {
      setTimeout(
        () => analyzeTranscript(),
        MIN_INTERVAL_MS - timeSinceLastAnalysis
      )
    }
  }, [analyzeTranscript])

  const triggerFromNote = useCallback(() => {
    runAnalysis(true)
  }, [runAnalysis])

  // Register triggerFromNote globally so NoteInputBar can call it
  useEffect(() => {
    useInsightsStore.getState().setNoteTrigger(triggerFromNote)
    return () => {
      useInsightsStore.getState().setNoteTrigger(null)
    }
  }, [triggerFromNote])

  return { triggerAnalysis, analyzeTranscript, triggerFromNote }
}

"use client"

import { useCallback, useEffect, useRef } from "react"
import { useInsightsStore } from "@/stores/insights-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useSessionStore } from "@/stores/session-store"
import type { InsightsResponse } from "@/types/insights"

const MIN_NEW_WORDS = 30
const MIN_INTERVAL_MS = 12000
const AUTO_SAVE_DEBOUNCE_MS = 2000

export function useLiveInsights() {
  const lastAnalysisTimeRef = useRef<number>(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isAnalyzingRef = useRef(false)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleGeneratedRef = useRef(false)

  const {
    summary,
    keyFindings,
    redFlags,
    checklistItems,
    lastUpdated,
    wordCountAtLastUpdate,
    setProcessing,
    updateFromResponse,
    setWordCountAtLastUpdate,
  } = useInsightsStore()
  const getFullTranscript = useTranscriptStore((s) => s.getFullTranscript)
  const activeSession = useSessionStore((s) => s.activeSession)

  // Reset title-generated flag when session changes
  useEffect(() => {
    titleGeneratedRef.current = false
  }, [activeSession?.id])

  // Auto-save insights to DB whenever store state changes
  useEffect(() => {
    if (!activeSession || !lastUpdated) return

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      fetch(`/api/sessions/${activeSession.id}/insights`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          keyFindings,
          redFlags,
          checklistItems: checklistItems.map((item) => ({
            label: item.label,
            isChecked: item.isChecked,
            isAutoChecked: item.isAutoChecked,
            doctorNote: item.doctorNote,
            sortOrder: item.sortOrder,
            source: item.source,
          })),
        }),
      }).catch(console.error)
    }, AUTO_SAVE_DEBOUNCE_MS)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [activeSession, lastUpdated, summary, keyFindings, redFlags, checklistItems])

  const runAnalysis = useCallback(
    async (forceRun: boolean = false) => {
      if (!activeSession || isAnalyzingRef.current) return

      const transcript = getFullTranscript()
      const currentWordCount = transcript.split(/\s+/).length
      const newWords = currentWordCount - wordCountAtLastUpdate
      const timeSinceLastAnalysis = Date.now() - lastAnalysisTimeRef.current

      // Skip threshold checks when forced (e.g., triggered by doctor note)
      if (
        !forceRun &&
        newWords < MIN_NEW_WORDS &&
        timeSinceLastAnalysis < MIN_INTERVAL_MS
      )
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
        // Fetch doctor notes for context (including image URLs)
        let doctorNotes = ""
        try {
          const notesRes = await fetch(
            `/api/sessions/${activeSession.id}/notes`,
            { signal: abortController.signal }
          )
          if (notesRes.ok) {
            const notes = await notesRes.json()
            if (notes.length > 0) {
              doctorNotes = notes
                .map(
                  (n: { content: string; imageUrls: string[] }) => {
                    let noteText = n.content
                    if (n.imageUrls && n.imageUrls.length > 0) {
                      noteText += `\n[Doctor uploaded ${n.imageUrls.length} medical image(s)]`
                    }
                    return noteText
                  }
                )
                .filter(Boolean)
                .join("\n")
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

          // Auto-save title once from the first insights response
          if (
            !titleGeneratedRef.current &&
            activeSession.title === "New Consultation" &&
            parsed.title
          ) {
            titleGeneratedRef.current = true
            const title = parsed.title.replace(/^["']|["']$/g, "")
            useSessionStore.getState().updateSession(activeSession.id, { title })
            fetch(`/api/sessions/${activeSession.id}`, {
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
          return // Cancelled, new analysis will follow
        }
        console.error("Insights analysis failed:", error)
        setProcessing(false)
      } finally {
        isAnalyzingRef.current = false
      }
    },
    [
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
    ]
  )

  const analyzeTranscript = useCallback(() => {
    runAnalysis(false)
  }, [runAnalysis])

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

  // Force analysis immediately (bypasses word count and time checks)
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

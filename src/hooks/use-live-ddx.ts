"use client"

import { useCallback, useEffect, useRef } from "react"
import { useDdxStore } from "@/stores/ddx-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useSessionStore } from "@/stores/session-store"
import { useConnectorStore } from "@/stores/connector-store"
import { useRecordingStore } from "@/stores/recording-store"

const MIN_NEW_WORDS = 50
const MIN_INTERVAL_MS = 20000
const INSIGHTS_DEBOUNCE_MS = 3000

export function useLiveDdx() {
  const lastDdxTimeRef = useRef<number>(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isAnalyzingRef = useRef(false)
  const insightsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeSession = useSessionStore((s) => s.activeSession)

  const runDdx = useCallback(
    async (forceRun: boolean = false) => {
      const session = useSessionStore.getState().activeSession
      if (!session || isAnalyzingRef.current) return

      const {
        diagnoses,
        wordCountAtLastUpdate,
        setProcessing,
        updateFromResponse,
        setWordCountAtLastUpdate,
      } = useDdxStore.getState()

      const {
        summary,
        keyFindings,
        redFlags,
      } = useInsightsStore.getState()

      // Need at least some insights context before generating DDx
      if (!summary && keyFindings.length === 0) return

      const transcript = useTranscriptStore.getState().getFullTranscript()
      const currentWordCount = transcript.split(/\s+/).length
      const newWords = currentWordCount - wordCountAtLastUpdate
      const timeSinceLastDdx = Date.now() - lastDdxTimeRef.current

      // When not forced, require enough new content
      if (!forceRun) {
        if (!transcript.trim()) return
        if (
          newWords < MIN_NEW_WORDS &&
          timeSinceLastDdx < MIN_INTERVAL_MS
        )
          return
      }

      // Abort any in-flight DDx generation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      const abortController = new AbortController()
      abortControllerRef.current = abortController
      isAnalyzingRef.current = true
      setProcessing(true)

      try {
        // Fetch doctor notes
        let doctorNotes = ""
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
            }
          }
        } catch {
          // Ignore notes fetch failure
        }

        const enabledConnectors = useConnectorStore.getState().connectors

        const res = await fetch("/api/grok/ddx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            doctorNotes,
            currentInsights: { summary, keyFindings, redFlags },
            currentDiagnoses: diagnoses.map((dx) => ({
              icdCode: dx.icdCode,
              diseaseName: dx.diseaseName,
              confidence: dx.confidence,
              citations: dx.citations,
            })),
            enabledConnectors,
          }),
          signal: abortController.signal,
        })

        if (!res.ok) throw new Error("DDx generation failed")

        const parsed = await res.json()

        if (parsed.diagnoses && Array.isArray(parsed.diagnoses)) {
          updateFromResponse(parsed.diagnoses, session.id)
          setWordCountAtLastUpdate(currentWordCount)
          lastDdxTimeRef.current = Date.now()
        } else {
          setProcessing(false)
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        console.error("DDx generation failed:", error)
        useDdxStore.getState().setProcessing(false)
      } finally {
        isAnalyzingRef.current = false
      }
    },
    []
  )

  const triggerFromNote = useCallback(() => {
    runDdx(true)
  }, [runDdx])

  // Register triggerFromNote globally so NoteInputBar can call it
  useEffect(() => {
    useDdxStore.getState().setNoteTrigger(triggerFromNote)
    return () => {
      useDdxStore.getState().setNoteTrigger(null)
    }
  }, [triggerFromNote])

  // Subscribe to insights store changes and reactively trigger DDx
  useEffect(() => {
    const unsubscribe = useInsightsStore.subscribe((state, prevState) => {
      if (state.lastUpdated === prevState.lastUpdated) return
      if (state.isProcessing) return // Wait until insights processing is done

      // Clear any pending debounce timer
      if (insightsDebounceRef.current) {
        clearTimeout(insightsDebounceRef.current)
      }

      // Debounce to let insights settle
      insightsDebounceRef.current = setTimeout(() => {
        const session = useSessionStore.getState().activeSession
        if (!session) return
        // Force DDx when recording has stopped (final analysis scenario)
        const isRecording = useRecordingStore.getState().isRecording
        runDdx(!isRecording)
      }, INSIGHTS_DEBOUNCE_MS)
    })

    return () => {
      unsubscribe()
      if (insightsDebounceRef.current) {
        clearTimeout(insightsDebounceRef.current)
      }
    }
  }, [runDdx])

  // Clean up on session change
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (insightsDebounceRef.current) {
        clearTimeout(insightsDebounceRef.current)
      }
    }
  }, [activeSession?.id])

  return { triggerFromNote }
}

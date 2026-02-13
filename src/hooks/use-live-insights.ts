"use client"

import { useCallback, useEffect, useRef } from "react"
import { useInsightsStore } from "@/stores/insights-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useSessionStore } from "@/stores/session-store"
import type { InsightsResponse } from "@/types/insights"

const MIN_NEW_WORDS = 30
const MIN_INTERVAL_MS = 12000
const CHECKPOINT_INTERVAL = 5 // Send full transcript every N analyses

export function useLiveInsights() {
  const lastAnalysisTimeRef = useRef<number>(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isAnalyzingRef = useRef(false)
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
        entryCountAtLastUpdate,
        analysisCount,
        setProcessing,
        updateFromResponse,
        setWordCountAtLastUpdate,
        setEntryCountAtLastUpdate,
        incrementAnalysisCount,
      } = useInsightsStore.getState()

      const transcriptStore = useTranscriptStore.getState()
      const currentEntryCount = transcriptStore.getEntryCount()
      const fullTranscript = transcriptStore.getFullTranscript()
      const currentWordCount = fullTranscript.split(/\s+/).length
      const newWords = currentWordCount - wordCountAtLastUpdate
      const timeSinceLastAnalysis = Date.now() - lastAnalysisTimeRef.current

      // When not forced, require transcript with enough new content
      if (!forceRun) {
        if (!fullTranscript.trim()) return
        if (
          newWords < MIN_NEW_WORDS &&
          timeSinceLastAnalysis < MIN_INTERVAL_MS
        )
          return
      }

      // Decide whether to send full transcript or delta
      const isCheckpoint =
        analysisCount === 0 || analysisCount % CHECKPOINT_INTERVAL === 0
      const transcript = isCheckpoint
        ? fullTranscript
        : transcriptStore.getTranscriptSince(entryCountAtLastUpdate)
      const mode = isCheckpoint ? "full" : ("delta" as const)
      const previousSummary = isCheckpoint ? undefined : summary

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
        let newImageUrls: string[] = []
        let newImageStoragePaths: string[] = []
        let previousImageFindings: { storagePath: string; findings: string }[] = []
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

              // Pair imageUrls with storagePaths for stable identification
              const { analyzedImages } = useInsightsStore.getState()
              const imageEntries: { storagePath: string; imageUrl: string }[] = []
              notes.forEach(
                (n: { imageUrls: string[]; storagePaths: string[] }) => {
                  const urls = n.imageUrls || []
                  const paths = n.storagePaths || []
                  urls.forEach((url: string, i: number) => {
                    if (paths[i]) {
                      imageEntries.push({ storagePath: paths[i], imageUrl: url })
                    }
                  })
                }
              )

              // Separate new images from already-analyzed ones
              const newEntries = imageEntries.filter(
                (e) => !analyzedImages[e.storagePath]
              )
              newImageUrls = newEntries.map((e) => e.imageUrl)
              newImageStoragePaths = newEntries.map((e) => e.storagePath)
              previousImageFindings = imageEntries
                .filter((e) => analyzedImages[e.storagePath])
                .map((e) => ({
                  storagePath: e.storagePath,
                  findings: analyzedImages[e.storagePath],
                }))
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
            newImageUrls,
            previousImageFindings,
            mode,
            previousSummary,
            currentInsights: {
              summary,
              keyFindings,
              redFlags,
              // Only send doctor-modified items; AI regenerates its own from transcript
              checklistItems: checklistItems
                .filter(
                  (item) =>
                    item.source === "MANUAL" ||
                    item.isChecked !== item.isAutoChecked ||
                    item.doctorNote !== null
                )
                .map((item) => ({
                  id: item.id,
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
          setEntryCountAtLastUpdate(currentEntryCount)
          incrementAnalysisCount()
          lastAnalysisTimeRef.current = Date.now()

          // Cache findings for newly analyzed images to avoid re-sending them
          if (newImageStoragePaths.length > 0) {
            const findingsText = [
              `Summary: ${parsed.summary}`,
              `Key Findings: ${parsed.keyFindings.join("; ")}`,
              `Red Flags: ${parsed.redFlags.join("; ")}`,
            ].join("\n")
            const newAnalyzed: Record<string, string> = {}
            for (const path of newImageStoragePaths) {
              newAnalyzed[path] = findingsText
            }
            useInsightsStore.getState().addAnalyzedImages(newAnalyzed)
          }

          // Auto-update title from every insights response
          if (parsed.title) {
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

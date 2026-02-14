"use client"

import { useCallback, useEffect, useRef } from "react"
import { useInsightsStore } from "@/stores/insights-store"
import { useSettingsStore } from "@/stores/settings-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useSessionStore } from "@/stores/session-store"
import type { InsightsResponse } from "@/types/insights"

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
        pendingComments,
        setProcessing,
        updateFromResponse,
        setWordCountAtLastUpdate,
        setEntryCountAtLastUpdate,
        incrementAnalysisCount,
        clearComments,
      } = useInsightsStore.getState()

      const transcriptStore = useTranscriptStore.getState()
      const currentEntryCount = transcriptStore.getEntryCount()
      const fullTranscript = transcriptStore.getFullTranscript()
      const currentWordCount = fullTranscript.split(/\s+/).length
      const newWords = currentWordCount - wordCountAtLastUpdate
      const timeSinceLastAnalysis = Date.now() - lastAnalysisTimeRef.current

      // When not forced, require transcript with enough new content
      const { insightsMinWords, insightsMinInterval } =
        useSettingsStore.getState().analysis
      if (!forceRun) {
        if (!fullTranscript.trim()) return
        if (
          newWords < insightsMinWords &&
          timeSinceLastAnalysis < insightsMinInterval
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

        const { aiModel, customInstructions } = useSettingsStore.getState()

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
            model: aiModel.insightsModel,
            customInstructions: customInstructions.insights || undefined,
            inlineComments: pendingComments.length > 0 ? pendingComments : undefined,
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
          clearComments()
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
          // Update lastUpdated so reactive subscribers (DDx) don't silently skip
          useInsightsStore.setState({ lastUpdated: new Date() })
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
    const { insightsMinInterval } = useSettingsStore.getState().analysis
    const timeSinceLastAnalysis = Date.now() - lastAnalysisTimeRef.current
    if (timeSinceLastAnalysis >= insightsMinInterval) {
      analyzeTranscript()
    } else {
      setTimeout(
        () => analyzeTranscript(),
        insightsMinInterval - timeSinceLastAnalysis
      )
    }
  }, [analyzeTranscript])

  const triggerFromNote = useCallback(() => {
    runAnalysis(true)
  }, [runAnalysis])

  // Forced final analysis for session/simulation end.
  // Sets isProcessing gate synchronously so waitForInsightsToComplete() blocks
  // until the analysis completes.
  const runFinalAnalysis = useCallback(async () => {
    useInsightsStore.getState().setProcessing(true)

    // If an analysis is already in flight, abort it so we can run fresh
    if (isAnalyzingRef.current && abortControllerRef.current) {
      abortControllerRef.current.abort()
      const start = Date.now()
      while (isAnalyzingRef.current && Date.now() - start < 2000) {
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    }

    await runAnalysis(true)

    // If runAnalysis returned early (no session, etc.), release the gate
    if (!isAnalyzingRef.current) {
      useInsightsStore.getState().setProcessing(false)
    }
  }, [runAnalysis])

  // Register triggerFromNote globally so NoteInputBar can call it
  useEffect(() => {
    useInsightsStore.getState().setNoteTrigger(triggerFromNote)
    return () => {
      useInsightsStore.getState().setNoteTrigger(null)
    }
  }, [triggerFromNote])

  return { triggerAnalysis, analyzeTranscript, triggerFromNote, runFinalAnalysis }
}

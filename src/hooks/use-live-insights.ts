"use client"

import { useCallback, useEffect, useRef } from "react"
import { useInsightsStore } from "@/stores/insights-store"
import { useSettingsStore } from "@/stores/settings-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useSessionStore } from "@/stores/session-store"
import type { InsightsResponse } from "@/types/insights"

const CHECKPOINT_INTERVAL = 5 // Send full transcript every N analyses

export function useLiveInsights() {
  const activeSession = useSessionStore((s) => s.activeSession)
  const lastAnalysisTimeRef = useRef<number>(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isAnalyzingRef = useRef(false)
  const pendingRetriggerRef = useRef<"force" | "normal" | false>(false)
  const titlePatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const analysisTriggerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerAnalysisRef = useRef<() => void>(undefined)

  const queueSessionTitlePatch = useCallback((sessionId: string, title: string) => {
    if (titlePatchTimerRef.current) {
      clearTimeout(titlePatchTimerRef.current)
    }

    titlePatchTimerRef.current = setTimeout(() => {
      fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      }).catch(console.error)
      titlePatchTimerRef.current = null
    }, 500)
  }, [])

  const runAnalysis = useCallback(
    async (forceRun: boolean = false) => {
      const session = useSessionStore.getState().activeSession
      if (!session) return
      if (isAnalyzingRef.current) {
        // Queue a re-trigger so newly added comments or transcripts get picked up
        if (forceRun) pendingRetriggerRef.current = "force"
        else if (!pendingRetriggerRef.current) pendingRetriggerRef.current = "normal"
        return
      }

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

      // Snapshot comment IDs so we only clear these after analysis completes
      const sentCommentIds = new Set(pendingComments.map((c) => c.id))

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
      // Force checkpoint (full transcript) when inline comments are present so the
      // AI has complete context to address the comment without losing existing items.
      const hasComments = pendingComments.length > 0
      const isCheckpoint =
        analysisCount === 0 || analysisCount % CHECKPOINT_INTERVAL === 0 || hasComments
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

        const res = await fetch("/api/ai/insights", {
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
              // Always send the full checklist so the AI can see existing items and preserve them
              checklistItems: checklistItems.map((item) => ({
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

          // Sanitize arrays to prevent runtime crashes if AI returns invalid types
          if (!Array.isArray(parsed.keyFindings)) parsed.keyFindings = []
          if (!Array.isArray(parsed.redFlags)) parsed.redFlags = []
          if (!Array.isArray(parsed.checklist)) parsed.checklist = []
          if (parsed.diagnoses && !Array.isArray(parsed.diagnoses)) parsed.diagnoses = []

          // Bail out if the session changed while we were streaming
          const currentSessionId = useSessionStore.getState().activeSession?.id
          if (currentSessionId !== session.id) return

          updateFromResponse(parsed, session.id)
          clearComments(sentCommentIds)
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
            const title = parsed.title.replace(/^["']|["']$/g, "").trim()
            if (title) {
              const store = useSessionStore.getState()
              const previousTitle = store.sessions.find((s) => s.id === session.id)?.title ?? ""
              if (previousTitle !== title) {
                store.updateSession(session.id, { title })
                queueSessionTitlePatch(session.id, title)
              }
            }
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
        if (pendingRetriggerRef.current) {
          const wasForce = pendingRetriggerRef.current === "force"
          pendingRetriggerRef.current = false
          // Pick up comments or transcripts added during the in-flight analysis.
          // We wait 100ms before triggering to let the state settle.
          setTimeout(() => {
            if (wasForce) runAnalysis(true)
            else triggerAnalysisRef.current?.()
          }, 100)
        }
      }
    },
    [queueSessionTitlePatch]
  )

  const analyzeTranscript = useCallback(() => {
    runAnalysis(false)
  }, [runAnalysis])

  const triggerAnalysis = useCallback(() => {
    const { insightsMinInterval } = useSettingsStore.getState().analysis
    const timeSinceLastAnalysis = Date.now() - lastAnalysisTimeRef.current
    if (timeSinceLastAnalysis >= insightsMinInterval) {
      if (analysisTriggerTimerRef.current) {
        clearTimeout(analysisTriggerTimerRef.current)
        analysisTriggerTimerRef.current = null
      }
      analyzeTranscript()
    } else {
      if (analysisTriggerTimerRef.current) {
        clearTimeout(analysisTriggerTimerRef.current)
      }
      analysisTriggerTimerRef.current = setTimeout(
        () => {
          analysisTriggerTimerRef.current = null
          analyzeTranscript()
        },
        insightsMinInterval - timeSinceLastAnalysis
      )
    }
  }, [analyzeTranscript])

  triggerAnalysisRef.current = triggerAnalysis

  const triggerFromNote = useCallback(() => {
    runAnalysis(true)
  }, [runAnalysis])

  // Forced final analysis for session/simulation end.
  // Sets isProcessing gate synchronously so waitForInsightsToComplete() blocks
  // until the analysis completes.
  const runFinalAnalysis = useCallback(async () => {
    pendingRetriggerRef.current = false // Don't re-trigger after forced final
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

  // Clean up on session change
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (titlePatchTimerRef.current) {
        clearTimeout(titlePatchTimerRef.current)
        titlePatchTimerRef.current = null
      }
      if (analysisTriggerTimerRef.current) {
        clearTimeout(analysisTriggerTimerRef.current)
        analysisTriggerTimerRef.current = null
      }
      isAnalyzingRef.current = false
    }
  }, [activeSession?.id])

  return { triggerAnalysis, analyzeTranscript, triggerFromNote, runFinalAnalysis }
}

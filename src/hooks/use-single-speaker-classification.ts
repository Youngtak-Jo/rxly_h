"use client"

import { useEffect, useRef } from "react"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useSessionStore } from "@/stores/session-store"
import { useSettingsStore } from "@/stores/settings-store"
import type { Speaker, TranscriptEntry } from "@/types/session"

const BATCH_SIZE = 3
const CONTEXT_SIZE = 2

/**
 * Hook that handles ongoing content-based role classification
 * when single-speaker mode is active. Classifies new entries
 * in batches of BATCH_SIZE.
 */
export function useSingleSpeakerClassification() {
  const isClassifyingRef = useRef(false)

  const singleSpeakerMode = useTranscriptStore((s) => s.singleSpeakerMode)
  const entries = useTranscriptStore((s) => s.entries)
  const lastClassifiedEntryIndex = useTranscriptStore(
    (s) => s.lastClassifiedEntryIndex
  )
  const activeSession = useSessionStore((s) => s.activeSession)

  useEffect(() => {
    if (!singleSpeakerMode || isClassifyingRef.current) return

    const unclassifiedCount = entries.length - lastClassifiedEntryIndex
    if (unclassifiedCount < BATCH_SIZE) return

    const classify = async () => {
      isClassifyingRef.current = true
      const store = useTranscriptStore.getState()
      store.setClassifyingEntries(true)

      try {
        const aiModel = useSettingsStore.getState().aiModel.speakerIdModel

        // Context: last CONTEXT_SIZE already-classified entries for conversation flow
        const contextEntries = store.entries
          .slice(
            Math.max(0, store.lastClassifiedEntryIndex - CONTEXT_SIZE),
            store.lastClassifiedEntryIndex
          )
          .map((e) => ({ id: e.id, text: e.text }))

        // Entries to classify
        const newEntries = store.entries
          .slice(store.lastClassifiedEntryIndex)
          .map((e) => ({ id: e.id, text: e.text }))

        const res = await fetch("/api/ai/classify-single-speaker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entries: newEntries,
            context: contextEntries.length > 0 ? contextEntries : undefined,
            model: aiModel,
          }),
        })

        if (!res.ok) throw new Error("Classification failed")

        const result: { mapping: Record<string, Speaker> } = await res.json()

        store.relabelEntriesIndividually(result.mapping)
        store.setLastClassifiedEntryIndex(store.entries.length)

        // Persist to DB (fire-and-forget)
        updateDbEntries(activeSession?.id, result.mapping)
      } catch (error) {
        console.error("Single-speaker batch classification failed:", error)
      } finally {
        useTranscriptStore.getState().setClassifyingEntries(false)
        isClassifyingRef.current = false
      }
    }

    classify()
  }, [entries.length, singleSpeakerMode, lastClassifiedEntryIndex, activeSession])
}

/**
 * Classify all existing entries when user confirms single-speaker mode.
 * Called directly from the UI handler, not from the hook.
 */
export async function classifyAllEntries(
  entries: TranscriptEntry[],
  sessionId: string,
  aiModel: string
): Promise<void> {
  const store = useTranscriptStore.getState()
  store.setClassifyingEntries(true)

  try {
    const res = await fetch("/api/ai/classify-single-speaker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entries: entries.map((e) => ({ id: e.id, text: e.text })),
        model: aiModel,
      }),
    })

    if (!res.ok) throw new Error("Classification failed")

    const result: { mapping: Record<string, Speaker> } = await res.json()

    store.relabelEntriesIndividually(result.mapping)
    store.setLastClassifiedEntryIndex(entries.length)

    // Persist to DB
    updateDbEntries(sessionId, result.mapping)
  } catch (error) {
    console.error("Initial single-speaker classification failed:", error)
    throw error
  } finally {
    useTranscriptStore.getState().setClassifyingEntries(false)
  }
}

/** Fire-and-forget: update DB entries with classified speaker roles */
function updateDbEntries(
  sessionId: string | undefined,
  mapping: Record<string, Speaker>
) {
  if (!sessionId) return

  const updates = Object.entries(mapping).map(([id, speaker]) => ({
    id,
    speaker,
  }))

  if (updates.length === 0) return

  fetch(`/api/sessions/${sessionId}/transcript`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updates }),
  }).catch(console.error)
}

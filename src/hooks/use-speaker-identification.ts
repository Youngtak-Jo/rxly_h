"use client"

import { useEffect, useRef } from "react"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useSessionStore } from "@/stores/session-store"
import { useSettingsStore } from "@/stores/settings-store"
import type { Speaker } from "@/types/session"

const ENTRIES_PER_ATTEMPT = 3
const MAX_ATTEMPTS = 2

export function useSpeakerIdentification() {
  const isIdentifyingRef = useRef(false)

  const entries = useTranscriptStore((s) => s.entries)
  const identificationStatus = useTranscriptStore(
    (s) => s.identificationStatus
  )
  const identificationAttempt = useTranscriptStore(
    (s) => s.identificationAttempt
  )
  const setIdentificationStatus = useTranscriptStore(
    (s) => s.setIdentificationStatus
  )
  const incrementIdentificationAttempt = useTranscriptStore(
    (s) => s.incrementIdentificationAttempt
  )
  const relabelSpeakers = useTranscriptStore((s) => s.relabelSpeakers)
  const activeSession = useSessionStore((s) => s.activeSession)

  useEffect(() => {
    // Already identified or currently identifying
    if (identificationStatus === "identified" || isIdentifyingRef.current) {
      return
    }

    // Max attempts reached — force-label based on best guess (first = DOCTOR)
    if (identificationAttempt >= MAX_ATTEMPTS) {
      const uniqueSpeakerIds = [
        ...new Set(
          entries
            .map((e) => e.rawSpeakerId)
            .filter((id): id is number => id !== undefined)
        ),
      ]
      if (uniqueSpeakerIds.length >= 2) {
        const fallback: Record<number, Speaker> = {}
        fallback[uniqueSpeakerIds[0]] = "DOCTOR"
        fallback[uniqueSpeakerIds[1]] = "PATIENT"
        relabelSpeakers(fallback)
        updateDbSpeakers(activeSession?.id, entries, fallback)
      }
      return
    }

    // Check if we have enough entries for this attempt
    const requiredEntries = ENTRIES_PER_ATTEMPT * (identificationAttempt + 1)

    if (entries.length < requiredEntries) return

    // Need at least 2 unique speakers to identify
    const uniqueSpeakerIds = [
      ...new Set(
        entries
          .map((e) => e.rawSpeakerId)
          .filter((id): id is number => id !== undefined)
      ),
    ]
    if (uniqueSpeakerIds.length < 2) return

    // Trigger identification
    const identify = async () => {
      isIdentifyingRef.current = true
      setIdentificationStatus("identifying")
      incrementIdentificationAttempt()

      try {
        const utterances = entries.slice(0, requiredEntries).map((e) => ({
          speakerId: e.rawSpeakerId ?? 0,
          text: e.text,
        }))

        const res = await fetch("/api/grok/identify-speakers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            utterances,
            model: useSettingsStore.getState().aiModel.speakerIdModel,
          }),
        })

        if (!res.ok) throw new Error("Identification failed")

        const result: {
          mapping: Record<string, Speaker>
          confident: boolean
        } = await res.json()

        if (result.confident) {
          // Convert string keys to numbers
          const numericMapping: Record<number, Speaker> = {}
          for (const [key, value] of Object.entries(result.mapping)) {
            numericMapping[Number(key)] = value
          }
          relabelSpeakers(numericMapping)
          updateDbSpeakers(activeSession?.id, entries, numericMapping)
        } else {
          // Not confident — revert to unidentified so next attempt can trigger
          setIdentificationStatus("unidentified")
        }
      } catch (error) {
        console.error("Speaker identification failed:", error)
        setIdentificationStatus("unidentified")
      } finally {
        isIdentifyingRef.current = false
      }
    }

    identify()
  }, [
    entries,
    identificationStatus,
    identificationAttempt,
    setIdentificationStatus,
    incrementIdentificationAttempt,
    relabelSpeakers,
    activeSession,
  ])
}

/** Fire-and-forget: update DB entries with identified speaker roles */
function updateDbSpeakers(
  sessionId: string | undefined,
  entries: { id: string; rawSpeakerId?: number }[],
  mapping: Record<number, Speaker>
) {
  if (!sessionId) return

  const updates = entries
    .filter(
      (e) =>
        e.rawSpeakerId !== undefined && mapping[e.rawSpeakerId] !== undefined
    )
    .map((e) => ({
      id: e.id,
      speaker: mapping[e.rawSpeakerId!],
    }))

  if (updates.length === 0) return

  fetch(`/api/sessions/${sessionId}/transcript`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ updates }),
  }).catch(console.error)
}

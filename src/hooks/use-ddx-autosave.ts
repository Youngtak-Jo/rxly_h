"use client"

import { useEffect, useRef } from "react"
import { useDdxStore } from "@/stores/ddx-store"
import { useSessionStore } from "@/stores/session-store"

const AUTO_SAVE_DEBOUNCE_MS = 2000

export function useDdxAutoSave() {
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const unsubscribe = useDdxStore.subscribe((state, prevState) => {
      if (state.lastUpdated === prevState.lastUpdated) return

      // Always clear pending timer first (even on reset) to prevent
      // stale saves after session switch
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }

      const session = useSessionStore.getState().activeSession
      if (!session || !state.lastUpdated) return

      const scheduledSessionId = session.id

      autoSaveTimerRef.current = setTimeout(() => {
        const currentSession = useSessionStore.getState().activeSession
        const currentState = useDdxStore.getState()
        if (!currentSession || currentSession.id !== scheduledSessionId) return

        fetch(`/api/sessions/${currentSession.id}/diagnoses`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            diagnoses: currentState.diagnoses.map((dx) => ({
              id: dx.id,
              icdCode: dx.icdCode,
              icdUri: dx.icdUri,
              diseaseName: dx.diseaseName,
              confidence: dx.confidence,
              evidence: dx.evidence,
              citations: dx.citations,
              sortOrder: dx.sortOrder,
            })),
          }),
        }).catch(console.error)
      }, AUTO_SAVE_DEBOUNCE_MS)
    })

    return () => {
      unsubscribe()
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])
}

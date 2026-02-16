"use client"

import { useEffect, useRef } from "react"
import { useInsightsStore } from "@/stores/insights-store"
import { useSessionStore } from "@/stores/session-store"

const AUTO_SAVE_DEBOUNCE_MS = 2000

export function useInsightsAutoSave() {
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const unsubscribe = useInsightsStore.subscribe((state, prevState) => {
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
        const currentState = useInsightsStore.getState()
        if (!currentSession || currentSession.id !== scheduledSessionId) return

        fetch(`/api/sessions/${currentSession.id}/insights`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: currentState.summary,
            keyFindings: currentState.keyFindings,
            redFlags: currentState.redFlags,
            checklistItems: currentState.checklistItems.map((item) => ({
              id: item.id,
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
    })

    return () => {
      unsubscribe()
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])
}

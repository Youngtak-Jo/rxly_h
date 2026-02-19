"use client"

import { useEffect, useRef } from "react"
import { usePatientHandoutStore } from "@/stores/patient-handout-store"
import { useSessionStore } from "@/stores/session-store"

const AUTO_SAVE_DEBOUNCE_MS = 2000

export function usePatientHandoutAutoSave() {
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const unsubscribe = usePatientHandoutStore.subscribe((state, prevState) => {
      if (state.lastUpdated === prevState.lastUpdated) return

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }

      const session = useSessionStore.getState().activeSession
      if (!session || !state.lastUpdated || !state.document) return

      const scheduledSessionId = session.id

      autoSaveTimerRef.current = setTimeout(() => {
        const currentSession = useSessionStore.getState().activeSession
        const currentDocument = usePatientHandoutStore.getState().document
        if (!currentSession || !currentDocument || currentSession.id !== scheduledSessionId) {
          return
        }

        fetch(`/api/sessions/${currentSession.id}/patient-handout`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: currentDocument.language,
            conditions: currentDocument.conditions,
            entries: currentDocument.entries,
            generatedAt: currentDocument.generatedAt,
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

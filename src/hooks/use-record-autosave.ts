"use client"

import { useEffect, useRef } from "react"
import { useRecordStore } from "@/stores/record-store"
import { useSessionStore } from "@/stores/session-store"

const AUTO_SAVE_DEBOUNCE_MS = 2000

export function useRecordAutoSave() {
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const unsubscribe = useRecordStore.subscribe((state, prevState) => {
      if (state.lastUpdated === prevState.lastUpdated) return

      // Always clear pending timer first (even on reset) to prevent
      // stale saves after session switch
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
        autoSaveTimerRef.current = null
      }

      const session = useSessionStore.getState().activeSession
      if (!session || !state.lastUpdated || !state.record) return

      const scheduledSessionId = session.id

      autoSaveTimerRef.current = setTimeout(() => {
        const currentSession = useSessionStore.getState().activeSession
        const currentRecord = useRecordStore.getState().record
        if (!currentRecord || !currentSession || currentSession.id !== scheduledSessionId) return

        fetch(`/api/sessions/${currentSession.id}/record`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientName: currentRecord.patientName,
            chiefComplaint: currentRecord.chiefComplaint,
            hpiText: currentRecord.hpiText,
            medications: currentRecord.medications,
            rosText: currentRecord.rosText,
            pmh: currentRecord.pmh,
            socialHistory: currentRecord.socialHistory,
            familyHistory: currentRecord.familyHistory,
            vitals: currentRecord.vitals,
            physicalExam: currentRecord.physicalExam,
            labsStudies: currentRecord.labsStudies,
            assessment: currentRecord.assessment,
            plan: currentRecord.plan,
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

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

      const session = useSessionStore.getState().activeSession
      if (!session || !state.lastUpdated || !state.record) return

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      autoSaveTimerRef.current = setTimeout(() => {
        const currentRecord = useRecordStore.getState().record
        if (!currentRecord) return

        fetch(`/api/sessions/${session.id}/record`, {
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

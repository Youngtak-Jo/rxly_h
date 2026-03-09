"use client"

import { useEffect, useRef } from "react"
import {
  computeRecordFingerprint,
  useRecordStore,
} from "@/stores/record-store"
import { useSessionStore } from "@/stores/session-store"
import { deleteCachedSession } from "@/hooks/use-session-loader"
import { useDocumentWorkspaceStore } from "@/stores/document-workspace-store"
import { BUILT_IN_RECORD_TEMPLATE_ID } from "@/lib/documents/constants"

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

      const workspaceState = useDocumentWorkspaceStore.getState()
      if (
        workspaceState.hasLoaded &&
        !workspaceState.isDocumentInstalled(BUILT_IN_RECORD_TEMPLATE_ID)
      ) {
        return
      }

      const scheduledSessionId = session.id

      autoSaveTimerRef.current = setTimeout(() => {
        const currentSession = useSessionStore.getState().activeSession
        const {
          record,
          lastPersistedFingerprint,
          setLastPersistedFingerprint,
        } = useRecordStore.getState()
        if (!record || !currentSession || currentSession.id !== scheduledSessionId) return

        const currentFingerprint = computeRecordFingerprint(record)
        if (!currentFingerprint || currentFingerprint === lastPersistedFingerprint) {
          return
        }

        fetch(`/api/sessions/${currentSession.id}/record`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientName: record.patientName,
            chiefComplaint: record.chiefComplaint,
            hpiText: record.hpiText,
            medications: record.medications,
            rosText: record.rosText,
            pmh: record.pmh,
            socialHistory: record.socialHistory,
            familyHistory: record.familyHistory,
            vitals: record.vitals,
            physicalExam: record.physicalExam,
            labsStudies: record.labsStudies,
            assessment: record.assessment,
            plan: record.plan,
            documentJson: record.documentJson ?? null,
          }),
        })
          .then((res) => {
            if (res.ok) {
              deleteCachedSession(currentSession.id)
              setLastPersistedFingerprint(currentFingerprint)
            }
          })
          .catch(console.error)
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

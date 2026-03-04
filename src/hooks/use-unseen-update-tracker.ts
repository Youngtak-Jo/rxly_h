"use client"

import { useEffect } from "react"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useDdxStore } from "@/stores/ddx-store"
import { useRecordStore } from "@/stores/record-store"
import { useResearchStore } from "@/stores/research-store"
import { usePatientHandoutStore } from "@/stores/patient-handout-store"
import {
  BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID,
  BUILT_IN_RECORD_TEMPLATE_ID,
  buildDocumentTabId,
} from "@/lib/documents/constants"

export function useUnseenUpdateTracker() {
  useEffect(() => {
    const { markTabUpdated } = useConsultationTabStore.getState()

    const unsubInsights = useInsightsStore.subscribe((state, prev) => {
      if (prev.isProcessing && !state.isProcessing) {
        markTabUpdated("insights")
      }
    })

    const unsubDdx = useDdxStore.subscribe((state, prev) => {
      if (prev.isProcessing && !state.isProcessing) {
        markTabUpdated("ddx")
      }
    })

    const unsubRecord = useRecordStore.subscribe((state, prev) => {
      if (prev.isGenerating && !state.isGenerating) {
        markTabUpdated(buildDocumentTabId(BUILT_IN_RECORD_TEMPLATE_ID))
      }
    })

    const unsubResearch = useResearchStore.subscribe((state, prev) => {
      if (prev.isStreaming && !state.isStreaming) {
        markTabUpdated("research")
      }
    })

    const unsubPatientHandout = usePatientHandoutStore.subscribe((state, prev) => {
      if (prev.isGenerating && !state.isGenerating) {
        markTabUpdated(
          buildDocumentTabId(BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID)
        )
      }
    })

    return () => {
      unsubInsights()
      unsubDdx()
      unsubRecord()
      unsubResearch()
      unsubPatientHandout()
    }
  }, [])
}

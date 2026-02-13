"use client"

import { useEffect } from "react"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useDdxStore } from "@/stores/ddx-store"
import { useRecordStore } from "@/stores/record-store"
import { useResearchStore } from "@/stores/research-store"

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
        markTabUpdated("record")
      }
    })

    const unsubResearch = useResearchStore.subscribe((state, prev) => {
      if (prev.isStreaming && !state.isStreaming) {
        markTabUpdated("research")
      }
    })

    return () => {
      unsubInsights()
      unsubDdx()
      unsubRecord()
      unsubResearch()
    }
  }, [])
}

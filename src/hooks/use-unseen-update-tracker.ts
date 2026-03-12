"use client"

import { useEffect } from "react"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useDdxStore } from "@/stores/ddx-store"
import { useResearchStore } from "@/stores/research-store"
import { useSessionDocumentStore } from "@/stores/session-document-store"

function hasAnyDocumentWork(
  uiStateBySessionId: ReturnType<
    typeof useSessionDocumentStore.getState
  >["uiStateBySessionId"]
) {
  return Object.values(uiStateBySessionId).some((sessionUiState) =>
    Object.values(sessionUiState).some(
      (documentUiState) =>
        documentUiState.isGenerating || documentUiState.isSaving
    )
  )
}

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

    const unsubResearch = useResearchStore.subscribe((state, prev) => {
      if (prev.isStreaming && !state.isStreaming) {
        markTabUpdated("research")
      }
    })
    const unsubDocuments = useSessionDocumentStore.subscribe((state, prev) => {
      if (
        hasAnyDocumentWork(prev.uiStateBySessionId) &&
        !hasAnyDocumentWork(state.uiStateBySessionId)
      ) {
        markTabUpdated("documents")
      }
    })

    return () => {
      unsubInsights()
      unsubDdx()
      unsubResearch()
      unsubDocuments()
    }
  }, [])
}

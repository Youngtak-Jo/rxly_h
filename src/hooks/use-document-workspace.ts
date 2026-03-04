"use client"

import { useEffect } from "react"
import { useDocumentWorkspaceStore } from "@/stores/document-workspace-store"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"

export function useDocumentWorkspaceLoader(enabled = true) {
  const hasLoaded = useDocumentWorkspaceStore((state) => state.hasLoaded)
  const loadWorkspaceSnapshot = useDocumentWorkspaceStore(
    (state) => state.loadWorkspaceSnapshot
  )

  useEffect(() => {
    if (!enabled) return
    if (hasLoaded) return
    void loadWorkspaceSnapshot().catch(() => {
      // The store keeps the error state; avoid surfacing this as an unhandled rejection.
    })
  }, [enabled, hasLoaded, loadWorkspaceSnapshot])
}

export function useWorkspaceTabReconciliation() {
  const tabOrder = useDocumentWorkspaceStore((state) => state.tabOrder)
  const syncWithTabOrder = useConsultationTabStore(
    (state) => state.syncWithTabOrder
  )

  useEffect(() => {
    if (tabOrder.length === 0) return
    syncWithTabOrder(tabOrder)
  }, [syncWithTabOrder, tabOrder])
}

"use client"

import { useEffect } from "react"
import { useLocale } from "next-intl"
import { useDocumentWorkspaceStore } from "@/stores/document-workspace-store"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"

export function useDocumentWorkspaceLoader(enabled = true) {
  const locale = useLocale()
  const hasLoaded = useDocumentWorkspaceStore((state) => state.hasLoaded)
  const loadWorkspaceSnapshot = useDocumentWorkspaceStore(
    (state) => state.loadWorkspaceSnapshot
  )

  useEffect(() => {
    if (!enabled) return
    void loadWorkspaceSnapshot({ locale }).catch(() => {
      // The store keeps the error state; avoid surfacing this as an unhandled rejection.
    })
  }, [enabled, hasLoaded, loadWorkspaceSnapshot, locale])
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

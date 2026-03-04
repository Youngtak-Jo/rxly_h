"use client"

import { create } from "zustand"

interface DocumentCatalogStoreState {
  refreshKey: number
  invalidateCatalog: () => void
}

export const useDocumentCatalogStore = create<DocumentCatalogStoreState>(
  (set) => ({
    refreshKey: 0,
    invalidateCatalog: () =>
      set((state) => ({
        refreshKey: state.refreshKey + 1,
      })),
  })
)

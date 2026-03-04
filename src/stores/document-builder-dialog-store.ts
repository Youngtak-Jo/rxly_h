"use client"

import { create } from "zustand"
import type { DocumentBuilderDialogMode } from "@/types/document"

interface DocumentBuilderDialogState {
  open: boolean
  mode: DocumentBuilderDialogMode
  templateId: string | null
  routeBacked: boolean
  openCreate: (options?: { routeBacked?: boolean }) => void
  openEdit: (
    templateId: string,
    options?: { routeBacked?: boolean }
  ) => void
  close: () => void
  reset: () => void
}

const DEFAULT_STATE = {
  open: false,
  mode: "create" as const,
  templateId: null,
  routeBacked: false,
}

export const useDocumentBuilderDialogStore =
  create<DocumentBuilderDialogState>((set) => ({
    ...DEFAULT_STATE,

    openCreate: (options) =>
      set({
        open: true,
        mode: "create",
        templateId: null,
        routeBacked: options?.routeBacked ?? false,
      }),

    openEdit: (templateId, options) =>
      set({
        open: true,
        mode: "edit",
        templateId,
        routeBacked: options?.routeBacked ?? false,
      }),

    close: () =>
      set((state) => ({
        ...state,
        open: false,
      })),

    reset: () => set(DEFAULT_STATE),
  }))

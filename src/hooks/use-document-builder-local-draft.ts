"use client"

import { useCallback, useMemo } from "react"
import { sanitizeDocumentBuilderLocalSnapshot } from "@/lib/documents/schema"
import type {
  DocumentBuilderDialogMode,
  DocumentBuilderLocalSnapshot,
} from "@/types/document"

function getCreateDraftStorageKey() {
  return "document-builder:create"
}

function getEditDraftStorageKey(templateId: string) {
  return `document-builder:edit:${templateId}`
}

function readSnapshotFromStorage(
  key: string
): DocumentBuilderLocalSnapshot | null {
  if (typeof window === "undefined") return null

  try {
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return null
    return sanitizeDocumentBuilderLocalSnapshot(JSON.parse(raw))
  } catch {
    return null
  }
}

function writeSnapshotToStorage(
  key: string,
  snapshot: DocumentBuilderLocalSnapshot
) {
  if (typeof window === "undefined") return

  try {
    window.sessionStorage.setItem(key, JSON.stringify(snapshot))
  } catch {
    // sessionStorage unavailable/full; ignore local draft persistence.
  }
}

function removeSnapshotFromStorage(key: string) {
  if (typeof window === "undefined") return

  try {
    window.sessionStorage.removeItem(key)
  } catch {
    // Ignore sessionStorage cleanup failures.
  }
}

export function useDocumentBuilderLocalDraft(options: {
  mode: DocumentBuilderDialogMode
  templateId: string | null
  resolvedTemplateId: string | null
}) {
  const activeStorageKey = useMemo(() => {
    if (options.resolvedTemplateId) {
      return getEditDraftStorageKey(options.resolvedTemplateId)
    }

    if (options.mode === "edit" && options.templateId) {
      return getEditDraftStorageKey(options.templateId)
    }

    return getCreateDraftStorageKey()
  }, [options.mode, options.resolvedTemplateId, options.templateId])

  const readInitialSnapshot = useCallback(() => {
    if (options.mode === "edit" && options.templateId) {
      return readSnapshotFromStorage(getEditDraftStorageKey(options.templateId))
    }

    return readSnapshotFromStorage(getCreateDraftStorageKey())
  }, [options.mode, options.templateId])

  const persistSnapshot = useCallback(
    (snapshot: DocumentBuilderLocalSnapshot) => {
      writeSnapshotToStorage(activeStorageKey, snapshot)
    },
    [activeStorageKey]
  )

  const discardSnapshot = useCallback(() => {
    removeSnapshotFromStorage(activeStorageKey)
  }, [activeStorageKey])

  const replaceWithResolvedTemplate = useCallback(
    (templateId: string, snapshot: DocumentBuilderLocalSnapshot) => {
      removeSnapshotFromStorage(getCreateDraftStorageKey())
      writeSnapshotToStorage(getEditDraftStorageKey(templateId), {
        ...snapshot,
        templateId,
        resolvedTemplateId: templateId,
      })
    },
    []
  )

  const resetToServerVersion = useCallback((templateId: string) => {
    removeSnapshotFromStorage(getEditDraftStorageKey(templateId))
  }, [])

  return {
    activeStorageKey,
    discardSnapshot,
    persistSnapshot,
    readInitialSnapshot,
    replaceWithResolvedTemplate,
    resetToServerVersion,
  }
}

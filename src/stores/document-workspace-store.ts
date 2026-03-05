import { create } from "zustand"
import type {
  DocumentWorkspaceSnapshot,
  InstalledDocumentSummary,
  WorkspaceTabId,
} from "@/types/document"
import { buildDocumentTabId } from "@/lib/documents/constants"

let inFlightWorkspaceRequest: Promise<DocumentWorkspaceSnapshot | null> | null = null

async function readErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string }
    if (typeof payload?.error === "string" && payload.error.trim()) {
      return payload.error
    }
  } catch {
    // Ignore malformed error bodies and fall back to the provided message.
  }

  return `${fallback} (${response.status})`
}

interface DocumentWorkspaceState {
  tabOrder: WorkspaceTabId[]
  installedDocuments: InstalledDocumentSummary[]
  defaultTemplateIds: string[]
  isLoading: boolean
  hasLoaded: boolean
  error: string | null
  setWorkspaceSnapshot: (snapshot: DocumentWorkspaceSnapshot) => void
  loadWorkspaceSnapshot: (options?: {
    force?: boolean
  }) => Promise<DocumentWorkspaceSnapshot | null>
  refreshWorkspaceSnapshot: () => Promise<DocumentWorkspaceSnapshot | null>
  installDocument: (
    templateId: string,
    versionId?: string | null
  ) => Promise<DocumentWorkspaceSnapshot>
  uninstallDocument: (templateId: string) => Promise<DocumentWorkspaceSnapshot>
  persistTabOrder: (
    tabOrder: WorkspaceTabId[]
  ) => Promise<DocumentWorkspaceSnapshot>
  setDocumentTabEnabled: (
    templateId: string,
    enabled: boolean
  ) => Promise<DocumentWorkspaceSnapshot>
  getInstalledDocument: (templateId: string) => InstalledDocumentSummary | null
  isDocumentInstalled: (templateId: string) => boolean
  reset: () => void
}

function getCurrentSnapshot(state: DocumentWorkspaceState): DocumentWorkspaceSnapshot {
  return {
    tabOrder: state.tabOrder,
    installedDocuments: state.installedDocuments,
    defaultTemplateIds: state.defaultTemplateIds,
  }
}

function applySnapshot(set: (partial: Partial<DocumentWorkspaceState>) => void, snapshot: DocumentWorkspaceSnapshot) {
  set({
    tabOrder: snapshot.tabOrder,
    installedDocuments: snapshot.installedDocuments,
    defaultTemplateIds: snapshot.defaultTemplateIds,
    hasLoaded: true,
    isLoading: false,
    error: null,
  })
}

export const useDocumentWorkspaceStore = create<DocumentWorkspaceState>(
  (set, get) => ({
    tabOrder: [],
    installedDocuments: [],
    defaultTemplateIds: [],
    isLoading: false,
    hasLoaded: false,
    error: null,

    setWorkspaceSnapshot: (snapshot) => applySnapshot(set, snapshot),

    loadWorkspaceSnapshot: async (options) => {
      const force = options?.force ?? false
      if (!force && get().hasLoaded) {
        return {
          tabOrder: get().tabOrder,
          installedDocuments: get().installedDocuments,
          defaultTemplateIds: get().defaultTemplateIds,
        }
      }

      if (!force && inFlightWorkspaceRequest) {
        return inFlightWorkspaceRequest
      }

      set({ isLoading: true, error: null })

      const request = (async () => {
        const response = await fetch("/api/documents/workspace")
        if (!response.ok) {
          throw new Error(
            await readErrorMessage(response, "Failed to fetch document workspace")
          )
        }

        const snapshot = (await response.json()) as DocumentWorkspaceSnapshot
        applySnapshot(set, snapshot)
        return snapshot
      })()
        .catch((error) => {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Unknown error",
          })
          throw error
        })
        .finally(() => {
          if (inFlightWorkspaceRequest === request) {
            inFlightWorkspaceRequest = null
          }
        })

      inFlightWorkspaceRequest = request
      return request
    },

    refreshWorkspaceSnapshot: () => get().loadWorkspaceSnapshot({ force: true }),

    installDocument: async (templateId, versionId) => {
      const response = await fetch(`/api/documents/${templateId}/install`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          versionId ? { versionId } : {}
        ),
      })
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "Failed to install document"))
      }

      const snapshot = (await response.json()) as DocumentWorkspaceSnapshot
      applySnapshot(set, snapshot)
      return snapshot
    },

    uninstallDocument: async (templateId) => {
      const response = await fetch(`/api/documents/${templateId}/install`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to uninstall document")
        )
      }

      const snapshot = (await response.json()) as DocumentWorkspaceSnapshot
      applySnapshot(set, snapshot)
      return snapshot
    },

    persistTabOrder: async (tabOrder) => {
      const response = await fetch("/api/documents/workspace/layout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tabOrder }),
      })
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(
            response,
            "Failed to save document workspace layout"
          )
        )
      }

      const snapshot = (await response.json()) as DocumentWorkspaceSnapshot
      applySnapshot(set, snapshot)
      return snapshot
    },

    setDocumentTabEnabled: async (templateId, enabled) => {
      const current = getCurrentSnapshot(get())
      const targetTabId = buildDocumentTabId(templateId)
      const hasTab = current.tabOrder.includes(targetTabId)

      if (enabled && hasTab) return current
      if (!enabled && !hasTab) return current

      const nextTabOrder = enabled
        ? [...current.tabOrder, targetTabId]
        : current.tabOrder.filter((tabId) => tabId !== targetTabId)

      return get().persistTabOrder(nextTabOrder)
    },

    getInstalledDocument: (templateId) =>
      get().installedDocuments.find((document) => document.templateId === templateId) ??
      null,

    isDocumentInstalled: (templateId) =>
      get().installedDocuments.some((document) => document.templateId === templateId),

    reset: () =>
      set({
        tabOrder: [],
        installedDocuments: [],
        defaultTemplateIds: [],
        isLoading: false,
        hasLoaded: false,
        error: null,
      }),
  })
)

import { create } from "zustand"
import type {
  DocumentWorkspaceSnapshot,
  InstalledDocumentSummary,
  WorkspaceTabId,
} from "@/types/document"
import { buildDocumentTabId } from "@/lib/documents/constants"
import type { UiLocale } from "@/i18n/config"

const inFlightWorkspaceRequests = new Map<
  UiLocale,
  Promise<DocumentWorkspaceSnapshot | null>
>()

function normalizeWorkspaceLocale(locale?: string | null): UiLocale {
  return locale?.toLowerCase().startsWith("ko") ? "ko" : "en"
}

function withLocale(path: string, locale?: string | null): string {
  const normalizedLocale = normalizeWorkspaceLocale(locale)
  const url = new URL(path, "http://localhost")
  url.searchParams.set("locale", normalizedLocale)
  return `${url.pathname}${url.search}`
}

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
  loadedLocale: UiLocale | null
  isLoading: boolean
  hasLoaded: boolean
  error: string | null
  setWorkspaceSnapshot: (snapshot: DocumentWorkspaceSnapshot) => void
  loadWorkspaceSnapshot: (options?: {
    force?: boolean
    locale?: string | null
  }) => Promise<DocumentWorkspaceSnapshot | null>
  refreshWorkspaceSnapshot: (options?: {
    locale?: string | null
  }) => Promise<DocumentWorkspaceSnapshot | null>
  installDocument: (
    templateId: string,
    versionId?: string | null,
    locale?: string | null
  ) => Promise<DocumentWorkspaceSnapshot>
  uninstallDocument: (
    templateId: string,
    locale?: string | null
  ) => Promise<DocumentWorkspaceSnapshot>
  persistTabOrder: (
    tabOrder: WorkspaceTabId[],
    locale?: string | null
  ) => Promise<DocumentWorkspaceSnapshot>
  setDocumentTabEnabled: (
    templateId: string,
    enabled: boolean,
    locale?: string | null
  ) => Promise<DocumentWorkspaceSnapshot>
  getInstalledDocument: (templateId: string) => InstalledDocumentSummary | null
  isDocumentInstalled: (templateId: string) => boolean
  reset: () => void
}

function getCurrentSnapshot(
  state: DocumentWorkspaceState
): DocumentWorkspaceSnapshot {
  return {
    tabOrder: state.tabOrder,
    installedDocuments: state.installedDocuments,
    defaultTemplateIds: state.defaultTemplateIds,
  }
}

function applySnapshot(
  set: (partial: Partial<DocumentWorkspaceState>) => void,
  snapshot: DocumentWorkspaceSnapshot
) {
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
    loadedLocale: null,
    isLoading: false,
    hasLoaded: false,
    error: null,

    setWorkspaceSnapshot: (snapshot) => applySnapshot(set, snapshot),

    loadWorkspaceSnapshot: async (options) => {
      const force = options?.force ?? false
      const locale = normalizeWorkspaceLocale(options?.locale)
      const state = get()

      if (!force && state.hasLoaded && state.loadedLocale === locale) {
        return {
          tabOrder: state.tabOrder,
          installedDocuments: state.installedDocuments,
          defaultTemplateIds: state.defaultTemplateIds,
        }
      }

      if (!force) {
        const inFlight = inFlightWorkspaceRequests.get(locale)
        if (inFlight) {
          return inFlight
        }
      }

      set({ isLoading: true, error: null })

      const request = (async () => {
        const response = await fetch(withLocale("/api/documents/workspace", locale))
        if (!response.ok) {
          throw new Error(
            await readErrorMessage(response, "Failed to fetch document workspace")
          )
        }

        const snapshot = (await response.json()) as DocumentWorkspaceSnapshot
        applySnapshot(set, snapshot)
        set({ loadedLocale: locale })
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
          if (inFlightWorkspaceRequests.get(locale) === request) {
            inFlightWorkspaceRequests.delete(locale)
          }
        })

      inFlightWorkspaceRequests.set(locale, request)
      return request
    },

    refreshWorkspaceSnapshot: (options) =>
      get().loadWorkspaceSnapshot({
        force: true,
        locale: options?.locale,
      }),

    installDocument: async (templateId, versionId, locale) => {
      const response = await fetch(
        withLocale(`/api/documents/${templateId}/install`, locale),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(versionId ? { versionId } : {}),
        }
      )
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to install document")
        )
      }

      const snapshot = (await response.json()) as DocumentWorkspaceSnapshot
      applySnapshot(set, snapshot)
      set({ loadedLocale: normalizeWorkspaceLocale(locale) })
      return snapshot
    },

    uninstallDocument: async (templateId, locale) => {
      const response = await fetch(
        withLocale(`/api/documents/${templateId}/install`, locale),
        {
          method: "DELETE",
        }
      )
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, "Failed to uninstall document")
        )
      }

      const snapshot = (await response.json()) as DocumentWorkspaceSnapshot
      applySnapshot(set, snapshot)
      set({ loadedLocale: normalizeWorkspaceLocale(locale) })
      return snapshot
    },

    persistTabOrder: async (tabOrder, locale) => {
      const response = await fetch(
        withLocale("/api/documents/workspace/layout", locale),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tabOrder }),
        }
      )
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
      set({ loadedLocale: normalizeWorkspaceLocale(locale) })
      return snapshot
    },

    setDocumentTabEnabled: async (templateId, enabled, locale) => {
      const current = getCurrentSnapshot(get())
      const targetTabId = buildDocumentTabId(templateId)
      const hasTab = current.tabOrder.includes(targetTabId)

      if (enabled && hasTab) return current
      if (!enabled && !hasTab) return current

      const nextTabOrder = enabled
        ? [...current.tabOrder, targetTabId]
        : current.tabOrder.filter((tabId) => tabId !== targetTabId)

      return get().persistTabOrder(nextTabOrder, locale)
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
        loadedLocale: null,
        isLoading: false,
        hasLoaded: false,
        error: null,
      }),
  })
)

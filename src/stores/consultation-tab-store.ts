import { create } from "zustand"
import { useSessionStore } from "@/stores/session-store"
import { trackClientEvent } from "@/lib/telemetry/client-events"
import type { WorkspaceTabId } from "@/types/document"
import {
  getTemplateIdFromTabId,
  isDocumentTabId,
} from "@/lib/documents/constants"
import { useConsultationDocumentsStore } from "@/stores/consultation-documents-store"
import { useSessionDocumentStore } from "@/stores/session-document-store"

export type ConsultationTabId = WorkspaceTabId

function normalizeConsultationTabId(tab: ConsultationTabId): WorkspaceTabId {
  return isDocumentTabId(tab) ? "documents" : tab
}

function syncDocumentHubSelection(tab: ConsultationTabId) {
  if (!isDocumentTabId(tab)) return

  const templateId = getTemplateIdFromTabId(tab)
  const sessionId = useSessionStore.getState().activeSession?.id
  if (!templateId || !sessionId) return

  const defaultDocument = useSessionDocumentStore
    .getState()
    .getDefaultSessionDocument(sessionId, templateId)

  if (defaultDocument) {
    useConsultationDocumentsStore.getState().openDocument(sessionId, defaultDocument.id)
    return
  }

  useConsultationDocumentsStore.getState().openPicker(sessionId)
}

interface ConsultationTabState {
  activeTab: WorkspaceTabId
  lastNonResearchTab: WorkspaceTabId
  setActiveTab: (tab: ConsultationTabId) => void

  unseenUpdates: Record<string, boolean>
  visitedTabs: Record<string, boolean>
  markTabUpdated: (tab: ConsultationTabId) => void
  clearAllUnseenUpdates: () => void
  syncWithTabOrder: (tabOrder: WorkspaceTabId[]) => void

  isTranscriptCollapsed: boolean
  setTranscriptCollapsed: (collapsed: boolean) => void
  _toggleTranscript: (() => void) | null
  setToggleTranscript: (fn: (() => void) | null) => void

  isMobileTranscriptOpen: boolean
  setMobileTranscriptOpen: (open: boolean) => void
  toggleMobileTranscript: () => void
}

export const useConsultationTabStore = create<ConsultationTabState>(
  (set) => ({
    activeTab: "insights",
    lastNonResearchTab: "insights",
    setActiveTab: (tab) =>
      set((state) => {
        syncDocumentHubSelection(tab)
        const normalizedTab = normalizeConsultationTabId(tab)

        if (state.activeTab !== normalizedTab) {
          trackClientEvent({
            eventType: "tab_switched",
            feature: normalizedTab,
            sessionId: useSessionStore.getState().activeSession?.id ?? null,
            metadata: {
              from: state.activeTab,
              to: normalizedTab,
            },
          })
        }
        return {
          activeTab: normalizedTab,
          lastNonResearchTab:
            normalizedTab === "research"
              ? state.lastNonResearchTab
              : normalizedTab,
          unseenUpdates: { ...state.unseenUpdates, [normalizedTab]: false },
          visitedTabs: { ...state.visitedTabs, [normalizedTab]: true },
        }
      }),

    unseenUpdates: {},
    visitedTabs: { insights: true },
    markTabUpdated: (tab) =>
      set((state) => {
        const normalizedTab = normalizeConsultationTabId(tab)
        if (state.activeTab === normalizedTab) return state
        return {
          unseenUpdates: { ...state.unseenUpdates, [normalizedTab]: true },
        }
      }),
    clearAllUnseenUpdates: () => set({ unseenUpdates: {} }),
    syncWithTabOrder: (tabOrder) =>
      set((state) => {
        const normalizedTabOrder = Array.from(
          new Set(tabOrder.map((tabId) => normalizeConsultationTabId(tabId)))
        )
        const nextActiveTab = normalizedTabOrder.includes(state.activeTab)
          ? state.activeTab
          : (normalizedTabOrder[0] ?? "insights")
        const nextLastNonResearchTab =
          state.lastNonResearchTab !== "research" &&
          normalizedTabOrder.includes(state.lastNonResearchTab)
            ? state.lastNonResearchTab
            : nextActiveTab === "research"
              ? (normalizedTabOrder.find((tab) => tab !== "research") ?? "insights")
              : nextActiveTab

        const nextUnseenUpdates = Object.fromEntries(
          normalizedTabOrder.map((tab) => [tab, state.unseenUpdates[tab] ?? false])
        )
        const nextVisitedTabs = Object.fromEntries(
          normalizedTabOrder.map((tab) => [
            tab,
            state.visitedTabs[tab] ?? tab === nextActiveTab,
          ])
        )
        const currentUnseenKeys = Object.keys(state.unseenUpdates)
        const hasSameUnseenKeys =
          currentUnseenKeys.length === normalizedTabOrder.length &&
          currentUnseenKeys.every((key) =>
            normalizedTabOrder.includes(key as WorkspaceTabId)
          )
        const hasSameUnseenValues =
          hasSameUnseenKeys &&
          normalizedTabOrder.every(
            (tab) => state.unseenUpdates[tab] === nextUnseenUpdates[tab]
          )
        const currentVisitedKeys = Object.keys(state.visitedTabs)
        const hasSameVisitedKeys =
          currentVisitedKeys.length === normalizedTabOrder.length &&
          currentVisitedKeys.every((key) =>
            normalizedTabOrder.includes(key as WorkspaceTabId)
          )
        const hasSameVisitedValues =
          hasSameVisitedKeys &&
          normalizedTabOrder.every(
            (tab) => state.visitedTabs[tab] === nextVisitedTabs[tab]
          )

        if (
          state.activeTab === nextActiveTab &&
          state.lastNonResearchTab === nextLastNonResearchTab &&
          hasSameUnseenValues &&
          hasSameVisitedValues
        ) {
          return state
        }

        return {
          activeTab: nextActiveTab,
          lastNonResearchTab: nextLastNonResearchTab,
          unseenUpdates: nextUnseenUpdates,
          visitedTabs: nextVisitedTabs,
        }
      }),

    isTranscriptCollapsed: false,
    setTranscriptCollapsed: (collapsed) =>
      set({ isTranscriptCollapsed: collapsed }),
    _toggleTranscript: null,
    setToggleTranscript: (fn) => set({ _toggleTranscript: fn }),

    isMobileTranscriptOpen: false,
    setMobileTranscriptOpen: (open) => set({ isMobileTranscriptOpen: open }),
    toggleMobileTranscript: () =>
      set((state) => ({ isMobileTranscriptOpen: !state.isMobileTranscriptOpen })),
  })
)

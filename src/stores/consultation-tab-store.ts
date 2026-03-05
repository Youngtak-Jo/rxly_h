import { create } from "zustand"
import { useSessionStore } from "@/stores/session-store"
import { trackClientEvent } from "@/lib/telemetry/client-events"
import type { WorkspaceTabId } from "@/types/document"

export type ConsultationTabId = WorkspaceTabId

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
}

export const useConsultationTabStore = create<ConsultationTabState>(
  (set) => ({
    activeTab: "insights",
    lastNonResearchTab: "insights",
    setActiveTab: (tab) =>
      set((state) => {
        if (state.activeTab !== tab) {
          trackClientEvent({
            eventType: "tab_switched",
            feature: tab,
            sessionId: useSessionStore.getState().activeSession?.id ?? null,
            metadata: {
              from: state.activeTab,
              to: tab,
            },
          })
        }
        return {
          activeTab: tab,
          lastNonResearchTab:
            tab === "research" ? state.lastNonResearchTab : tab,
          unseenUpdates: { ...state.unseenUpdates, [tab]: false },
          visitedTabs: { ...state.visitedTabs, [tab]: true },
        }
      }),

    unseenUpdates: {},
    visitedTabs: { insights: true },
    markTabUpdated: (tab) =>
      set((state) => {
        if (state.activeTab === tab) return state
        return { unseenUpdates: { ...state.unseenUpdates, [tab]: true } }
      }),
    clearAllUnseenUpdates: () => set({ unseenUpdates: {} }),
    syncWithTabOrder: (tabOrder) =>
      set((state) => {
        const nextActiveTab = tabOrder.includes(state.activeTab)
          ? state.activeTab
          : (tabOrder[0] ?? "insights")
        const nextLastNonResearchTab =
          state.lastNonResearchTab !== "research" &&
          tabOrder.includes(state.lastNonResearchTab)
            ? state.lastNonResearchTab
            : nextActiveTab === "research"
              ? (tabOrder.find((tab) => tab !== "research") ?? "insights")
              : nextActiveTab

        const nextUnseenUpdates = Object.fromEntries(
          tabOrder.map((tab) => [tab, state.unseenUpdates[tab] ?? false])
        )
        const nextVisitedTabs = Object.fromEntries(
          tabOrder.map((tab) => [tab, state.visitedTabs[tab] ?? tab === nextActiveTab])
        )
        const currentUnseenKeys = Object.keys(state.unseenUpdates)
        const hasSameUnseenKeys =
          currentUnseenKeys.length === tabOrder.length &&
          currentUnseenKeys.every((key) =>
            tabOrder.includes(key as WorkspaceTabId)
          )
        const hasSameUnseenValues =
          hasSameUnseenKeys &&
          tabOrder.every(
            (tab) => state.unseenUpdates[tab] === nextUnseenUpdates[tab]
          )
        const currentVisitedKeys = Object.keys(state.visitedTabs)
        const hasSameVisitedKeys =
          currentVisitedKeys.length === tabOrder.length &&
          currentVisitedKeys.every((key) =>
            tabOrder.includes(key as WorkspaceTabId)
          )
        const hasSameVisitedValues =
          hasSameVisitedKeys &&
          tabOrder.every((tab) => state.visitedTabs[tab] === nextVisitedTabs[tab])

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
  })
)

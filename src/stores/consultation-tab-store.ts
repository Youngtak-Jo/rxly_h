import { create } from "zustand"
import { useSessionStore } from "@/stores/session-store"
import { trackClientEvent } from "@/lib/telemetry/client-events"

export type ConsultationTabId =
  | "insights"
  | "ddx"
  | "record"
  | "research"
  | "patientHandout"

export const CONSULTATION_TABS: ConsultationTabId[] = [
  "insights",
  "ddx",
  "record",
  "research",
  "patientHandout",
]

const NO_UNSEEN: Record<ConsultationTabId, boolean> = {
  insights: false,
  ddx: false,
  record: false,
  research: false,
  patientHandout: false,
}

interface ConsultationTabState {
  activeTab: ConsultationTabId
  lastNonResearchTab: ConsultationTabId
  setActiveTab: (tab: ConsultationTabId) => void

  unseenUpdates: Record<ConsultationTabId, boolean>
  markTabUpdated: (tab: ConsultationTabId) => void
  clearAllUnseenUpdates: () => void

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
        }
      }),

    unseenUpdates: { ...NO_UNSEEN },
    markTabUpdated: (tab) =>
      set((state) => {
        if (state.activeTab === tab) return state
        return { unseenUpdates: { ...state.unseenUpdates, [tab]: true } }
      }),
    clearAllUnseenUpdates: () => set({ unseenUpdates: { ...NO_UNSEEN } }),

    isTranscriptCollapsed: false,
    setTranscriptCollapsed: (collapsed) =>
      set({ isTranscriptCollapsed: collapsed }),
    _toggleTranscript: null,
    setToggleTranscript: (fn) => set({ _toggleTranscript: fn }),
  })
)

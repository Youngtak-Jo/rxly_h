import { create } from "zustand"

type Tab = "insights" | "ddx" | "record" | "research" | "patientHandout"

const NO_UNSEEN: Record<Tab, boolean> = {
  insights: false,
  ddx: false,
  record: false,
  research: false,
  patientHandout: false,
}

interface ConsultationTabState {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void

  unseenUpdates: Record<Tab, boolean>
  markTabUpdated: (tab: Tab) => void
  clearAllUnseenUpdates: () => void

  isTranscriptCollapsed: boolean
  setTranscriptCollapsed: (collapsed: boolean) => void
  _toggleTranscript: (() => void) | null
  setToggleTranscript: (fn: (() => void) | null) => void
}

export const useConsultationTabStore = create<ConsultationTabState>(
  (set, get) => ({
    activeTab: "insights",
    setActiveTab: (tab) =>
      set({
        activeTab: tab,
        unseenUpdates: { ...get().unseenUpdates, [tab]: false },
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

import { create } from "zustand"

type Tab = "insights" | "record"

interface ConsultationTabState {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void

  isTranscriptCollapsed: boolean
  setTranscriptCollapsed: (collapsed: boolean) => void
  _toggleTranscript: (() => void) | null
  setToggleTranscript: (fn: (() => void) | null) => void
}

export const useConsultationTabStore = create<ConsultationTabState>((set) => ({
  activeTab: "insights",
  setActiveTab: (tab) => set({ activeTab: tab }),

  isTranscriptCollapsed: false,
  setTranscriptCollapsed: (collapsed) =>
    set({ isTranscriptCollapsed: collapsed }),
  _toggleTranscript: null,
  setToggleTranscript: (fn) => set({ _toggleTranscript: fn }),
}))

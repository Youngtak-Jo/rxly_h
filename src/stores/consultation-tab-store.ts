import { create } from "zustand"

type Tab = "insights" | "record"

interface ConsultationTabState {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
}

export const useConsultationTabStore = create<ConsultationTabState>((set) => ({
  activeTab: "insights",
  setActiveTab: (tab) => set({ activeTab: tab }),
}))

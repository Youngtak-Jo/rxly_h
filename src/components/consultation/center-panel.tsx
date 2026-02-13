"use client"

import { InsightsContainer } from "./insights/insights-container"
import { RecordContainer } from "./record/record-container"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"

export function CenterPanel() {
  const activeTab = useConsultationTabStore((s) => s.activeTab)

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 overflow-y-auto">
        <div className="p-4 min-w-0">
          {activeTab === "insights" ? (
            <InsightsContainer />
          ) : (
            <RecordContainer />
          )}
        </div>
      </div>
    </div>
  )
}

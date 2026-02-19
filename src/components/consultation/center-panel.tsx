"use client"

import { InsightsContainer } from "./insights/insights-container"
import { DdxContainer } from "./ddx/ddx-container"
import { RecordContainer } from "./record/record-container"
import { ResearchContainer } from "./research/research-container"
import { PatientHandoutContainer } from "./patient-handout/patient-handout-container"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"

export function CenterPanel() {
  const activeTab = useConsultationTabStore((s) => s.activeTab)

  return (
    <div className="relative h-full w-full">
      {activeTab === "research" ? (
        <div className="absolute inset-0">
          <ResearchContainer />
        </div>
      ) : (
        <div className="absolute inset-0 overflow-y-auto">
          <div className="p-4 min-w-0" key={activeTab}>
            {activeTab === "insights" ? (
              <InsightsContainer />
            ) : activeTab === "ddx" ? (
              <DdxContainer />
            ) : activeTab === "patientHandout" ? (
              <PatientHandoutContainer />
            ) : (
              <RecordContainer />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

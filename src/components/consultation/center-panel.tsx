"use client"

import dynamic from "next/dynamic"

const InsightsContainer = dynamic(() => import("./insights/insights-container").then(mod => mod.InsightsContainer))
const DdxContainer = dynamic(() => import("./ddx/ddx-container").then(mod => mod.DdxContainer))
const RecordContainer = dynamic(() => import("./record/record-container").then(mod => mod.RecordContainer))
const ResearchContainer = dynamic(() => import("./research/research-container").then(mod => mod.ResearchContainer))
const PatientHandoutContainer = dynamic(() => import("./patient-handout/patient-handout-container").then(mod => mod.PatientHandoutContainer))
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

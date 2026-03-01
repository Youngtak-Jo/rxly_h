"use client"

import type { ReactNode } from "react"
import dynamic from "next/dynamic"

const InsightsContainer = dynamic(() => import("./insights/insights-container").then(mod => mod.InsightsContainer))
const DdxContainer = dynamic(() => import("./ddx/ddx-container").then(mod => mod.DdxContainer))
const RecordContainer = dynamic(() => import("./record/record-container").then(mod => mod.RecordContainer))
const ResearchContainer = dynamic(() => import("./research/research-container").then(mod => mod.ResearchContainer))
const PatientHandoutContainer = dynamic(() => import("./patient-handout/patient-handout-container").then(mod => mod.PatientHandoutContainer))
import {
  type ConsultationTabId,
  useConsultationTabStore,
} from "@/stores/consultation-tab-store"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { ConsultationWorkspaceTabs } from "./consultation-workspace-tabs"

function DocumentTabContent({ children }: { children: ReactNode }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="min-w-0 p-4">{children}</div>
    </div>
  )
}

export function CenterPanel() {
  const activeTab = useConsultationTabStore((s) => s.activeTab)
  const setActiveTab = useConsultationTabStore((s) => s.setActiveTab)

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as ConsultationTabId)}
      className="h-full gap-0"
    >
      <ConsultationWorkspaceTabs />

      <TabsContent value="insights" className="mt-0 min-h-0">
        <DocumentTabContent>
          <InsightsContainer />
        </DocumentTabContent>
      </TabsContent>

      <TabsContent value="ddx" className="mt-0 min-h-0">
        <DocumentTabContent>
          <DdxContainer />
        </DocumentTabContent>
      </TabsContent>

      <TabsContent value="record" className="mt-0 min-h-0">
        <DocumentTabContent>
          <RecordContainer />
        </DocumentTabContent>
      </TabsContent>

      <TabsContent value="research" className="mt-0 min-h-0">
        <div className="h-full min-h-0">
          <ResearchContainer />
        </div>
      </TabsContent>

      <TabsContent value="patientHandout" className="mt-0 min-h-0">
        <DocumentTabContent>
          <PatientHandoutContainer />
        </DocumentTabContent>
      </TabsContent>
    </Tabs>
  )
}

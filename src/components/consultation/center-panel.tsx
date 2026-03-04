"use client"

import type { ReactNode } from "react"
import dynamic from "next/dynamic"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import {
  type ConsultationTabId,
  useConsultationTabStore,
} from "@/stores/consultation-tab-store"
import { ConsultationWorkspaceTabs } from "./consultation-workspace-tabs"

const InsightsContainer = dynamic(() => import("./insights/insights-container").then(mod => mod.InsightsContainer))
const DdxContainer = dynamic(() => import("./ddx/ddx-container").then(mod => mod.DdxContainer))
const RecordContainer = dynamic(() => import("./record/record-container").then(mod => mod.RecordContainer))
const ResearchContainer = dynamic(() => import("./research/research-container").then(mod => mod.ResearchContainer))
const PatientHandoutContainer = dynamic(() => import("./patient-handout/patient-handout-container").then(mod => mod.PatientHandoutContainer))
const TAB_CONTENT_CLASS_NAME = "mt-0 min-h-0 overflow-hidden"

function DocumentTabContent({ children }: { children: ReactNode }) {
  return (
    <div className="consultation-center-scroll h-full overflow-y-auto">
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
      className="flex h-full min-h-0 flex-col gap-0 overflow-hidden"
    >
      <div className="shrink-0">
        <ConsultationWorkspaceTabs />
      </div>

      <TabsContent value="insights" className={TAB_CONTENT_CLASS_NAME}>
        <DocumentTabContent>
          <InsightsContainer />
        </DocumentTabContent>
      </TabsContent>

      <TabsContent value="ddx" className={TAB_CONTENT_CLASS_NAME}>
        <DocumentTabContent>
          <DdxContainer />
        </DocumentTabContent>
      </TabsContent>

      <TabsContent value="record" className={TAB_CONTENT_CLASS_NAME}>
        <DocumentTabContent>
          <RecordContainer />
        </DocumentTabContent>
      </TabsContent>

      <TabsContent value="research" className={TAB_CONTENT_CLASS_NAME}>
        <div className="h-full min-h-0">
          <ResearchContainer />
        </div>
      </TabsContent>

      <TabsContent value="patientHandout" className={TAB_CONTENT_CLASS_NAME}>
        <DocumentTabContent>
          <PatientHandoutContainer />
        </DocumentTabContent>
      </TabsContent>
    </Tabs>
  )
}

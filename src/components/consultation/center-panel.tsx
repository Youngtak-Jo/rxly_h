"use client"

import type { ReactNode } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  type ConsultationTabId,
  useConsultationTabStore,
} from "@/stores/consultation-tab-store"
import { ConsultationWorkspaceTabs } from "./consultation-workspace-tabs"
import { InsightsContainer } from "./insights/insights-container"
import { DdxContainer } from "./ddx/ddx-container"
import { RecordContainer } from "./record/record-container"
import { ResearchContainer } from "./research/research-container"
import { PatientHandoutContainer } from "./patient-handout/patient-handout-container"

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

      <TabsContent value="insights" forceMount className={cn(TAB_CONTENT_CLASS_NAME, activeTab !== "insights" && "hidden")}>
        <DocumentTabContent>
          <InsightsContainer />
        </DocumentTabContent>
      </TabsContent>

      <TabsContent value="ddx" forceMount className={cn(TAB_CONTENT_CLASS_NAME, activeTab !== "ddx" && "hidden")}>
        <DocumentTabContent>
          <DdxContainer />
        </DocumentTabContent>
      </TabsContent>

      <TabsContent value="record" forceMount className={cn(TAB_CONTENT_CLASS_NAME, activeTab !== "record" && "hidden")}>
        <DocumentTabContent>
          <RecordContainer />
        </DocumentTabContent>
      </TabsContent>

      <TabsContent value="research" forceMount className={cn(TAB_CONTENT_CLASS_NAME, activeTab !== "research" && "hidden")}>
        <div className="h-full min-h-0">
          <ResearchContainer />
        </div>
      </TabsContent>

      <TabsContent value="patientHandout" forceMount className={cn(TAB_CONTENT_CLASS_NAME, activeTab !== "patientHandout" && "hidden")}>
        <DocumentTabContent>
          <PatientHandoutContainer />
        </DocumentTabContent>
      </TabsContent>
    </Tabs>
  )
}

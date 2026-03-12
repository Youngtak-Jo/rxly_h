"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { ConsultationWorkspaceTabs } from "./consultation-workspace-tabs"
import { DdxContainer } from "./ddx/ddx-container"
import { InsightsContainer } from "./insights/insights-container"
import { ResearchContainer } from "./research/research-container"
import { DocumentsHub } from "./documents/documents-hub"

const TAB_CONTENT_CLASS_NAME = "mt-0 min-h-0 overflow-hidden"

function DocumentTabContent({ children }: { children: ReactNode }) {
  return (
    <div className="consultation-center-scroll h-full overflow-y-auto">
      <div className="min-w-0 p-4">{children}</div>
    </div>
  )
}

function DocumentsTabContent({ children }: { children: ReactNode }) {
  return (
    <div className="consultation-center-scroll h-full overflow-y-auto">
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function renderTabContent(activeTab: string): ReactNode {
  switch (activeTab) {
    case "insights":
      return <InsightsContainer />
    case "ddx":
      return <DdxContainer />
    case "documents":
      return <DocumentsHub />
    case "research":
      return <ResearchContainer />
    default:
      return null
  }
}

export function CenterPanel() {
  const activeTab = useConsultationTabStore((state) => state.activeTab)
  const content = renderTabContent(activeTab)

  return (
    <div className="flex h-full min-h-0 flex-col gap-0 overflow-hidden">
      <div className="shrink-0">
        <ConsultationWorkspaceTabs />
      </div>

      <div className={cn(TAB_CONTENT_CLASS_NAME, "flex-1")}>
        {activeTab === "research" ? (
          <div className="h-full min-h-0">{content}</div>
        ) : activeTab === "documents" ? (
          <DocumentsTabContent>{content}</DocumentsTabContent>
        ) : (
          <DocumentTabContent>{content}</DocumentTabContent>
        )}
      </div>
    </div>
  )
}

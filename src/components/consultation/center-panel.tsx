"use client"

import type { ReactNode } from "react"
import { IconLoader2 } from "@tabler/icons-react"
import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { ConsultationWorkspaceTabs } from "./consultation-workspace-tabs"
import { InsightsContainer } from "./insights/insights-container"
import { DdxContainer } from "./ddx/ddx-container"
import { RecordContainer } from "./record/record-container"
import { ResearchContainer } from "./research/research-container"
import { PatientHandoutContainer } from "./patient-handout/patient-handout-container"
import { useDocumentWorkspaceStore } from "@/stores/document-workspace-store"
import { resolveWorkspaceTabDefinition } from "@/lib/documents/workspace"
import { StructuredDocumentContainer } from "./documents/structured-document-container"

const TAB_CONTENT_CLASS_NAME = "mt-0 min-h-0 overflow-hidden"

function DocumentTabContent({ children }: { children: ReactNode }) {
  return (
    <div className="consultation-center-scroll h-full overflow-y-auto">
      <div className="min-w-0 p-4">{children}</div>
    </div>
  )
}

export function CenterPanel() {
  const tTabs = useTranslations("ConsultationTabs")
  const activeTab = useConsultationTabStore((state) => state.activeTab)
  const tabOrder = useDocumentWorkspaceStore((state) => state.tabOrder)
  const installedDocuments = useDocumentWorkspaceStore(
    (state) => state.installedDocuments
  )
  const isWorkspaceLoading = useDocumentWorkspaceStore((state) => state.isLoading)

  const systemLabels = {
    insights: tTabs("insights"),
    ddx: tTabs("ddx"),
    research: tTabs("research"),
  }

  const activeDefinition =
    resolveWorkspaceTabDefinition(activeTab, installedDocuments, systemLabels) ??
    (tabOrder[0]
      ? resolveWorkspaceTabDefinition(tabOrder[0], installedDocuments, systemLabels)
      : null)

  let content: ReactNode = null

  switch (activeDefinition?.kind === "document"
    ? activeDefinition.renderer
    : activeDefinition?.id) {
    case "insights":
      content = <InsightsContainer />
      break
    case "ddx":
      content = <DdxContainer />
      break
    case "research":
      content = (
        <div className="h-full min-h-0">
          <ResearchContainer />
        </div>
      )
      break
    case "BUILT_IN_RECORD":
      content = <RecordContainer />
      break
    case "BUILT_IN_PATIENT_HANDOUT":
      content = <PatientHandoutContainer />
      break
    case "GENERIC_STRUCTURED":
      content = activeDefinition?.templateId ? (
        <StructuredDocumentContainer templateId={activeDefinition.templateId} />
      ) : null
      break
    default:
      content = null
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-0 overflow-hidden">
      <div className="shrink-0">
        <ConsultationWorkspaceTabs />
      </div>

      <div className={cn(TAB_CONTENT_CLASS_NAME, "flex-1")}>
        {isWorkspaceLoading && !activeDefinition ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
            <IconLoader2 className="size-4 animate-spin" />
            Loading workspace
          </div>
        ) : activeDefinition?.id === "research" ? (
          content
        ) : content ? (
          <DocumentTabContent>{content}</DocumentTabContent>
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-sm text-muted-foreground">
            No document is available in this workspace.
          </div>
        )}
      </div>
    </div>
  )
}

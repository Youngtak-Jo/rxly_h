"use client"

import { useMemo, type ReactNode } from "react"
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
import {
  resolveWorkspaceTabDefinition,
  type WorkspaceTabDefinition,
} from "@/lib/documents/workspace"
import { StructuredDocumentContainer } from "./documents/structured-document-container"
import {
  BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID,
  BUILT_IN_RECORD_TEMPLATE_ID,
  buildDocumentTabId,
} from "@/lib/documents/constants"
import type { WorkspaceTabId } from "@/types/document"

const TAB_CONTENT_CLASS_NAME = "mt-0 min-h-0 overflow-hidden"
const PRELOADED_WORKSPACE_TAB_IDS = new Set<WorkspaceTabId>([
  "insights",
  "ddx",
  "research",
  buildDocumentTabId(BUILT_IN_RECORD_TEMPLATE_ID),
  buildDocumentTabId(BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID),
])

function DocumentTabContent({ children }: { children: ReactNode }) {
  return (
    <div className="consultation-center-scroll h-full overflow-y-auto">
      <div className="min-w-0 p-4">{children}</div>
    </div>
  )
}

function renderTabContent(definition: WorkspaceTabDefinition): ReactNode {
  switch (
    definition.kind === "document" ? definition.renderer : definition.id
  ) {
    case "insights":
      return <InsightsContainer />
    case "ddx":
      return <DdxContainer />
    case "research":
      return <ResearchContainer />
    case "BUILT_IN_RECORD":
      return <RecordContainer />
    case "BUILT_IN_PATIENT_HANDOUT":
      return <PatientHandoutContainer />
    case "GENERIC_STRUCTURED":
      return definition.templateId ? (
        <StructuredDocumentContainer templateId={definition.templateId} />
      ) : null
    default:
      return null
  }
}

export function CenterPanel() {
  const tTabs = useTranslations("ConsultationTabs")
  const activeTab = useConsultationTabStore((state) => state.activeTab)
  const visitedTabs = useConsultationTabStore((state) => state.visitedTabs)
  const tabOrder = useDocumentWorkspaceStore((state) => state.tabOrder)
  const installedDocuments = useDocumentWorkspaceStore(
    (state) => state.installedDocuments
  )
  const isWorkspaceLoading = useDocumentWorkspaceStore((state) => state.isLoading)

  const systemLabels = useMemo(
    () => ({
      insights: tTabs("insights"),
      ddx: tTabs("ddx"),
      research: tTabs("research"),
    }),
    [tTabs]
  )

  const tabDefinitions = useMemo(
    () =>
      tabOrder
        .map((tabId) =>
          resolveWorkspaceTabDefinition(tabId, installedDocuments, systemLabels)
        )
        .filter(
          (definition): definition is WorkspaceTabDefinition => !!definition
        ),
    [installedDocuments, systemLabels, tabOrder]
  )
  const tabDefinitionById = useMemo(
    () => new Map(tabDefinitions.map((definition) => [definition.id, definition])),
    [tabDefinitions]
  )

  const activeDefinition =
    tabDefinitionById.get(activeTab) ?? tabDefinitions[0] ?? null
  const mountedTabIds = useMemo(() => {
    if (tabDefinitions.length === 0) {
      return []
    }

    const availableTabIds = new Set(
      tabDefinitions.map((definition) => definition.id)
    )
    const selectedTabIds = new Set<WorkspaceTabId>()

    for (const tabId of PRELOADED_WORKSPACE_TAB_IDS) {
      if (availableTabIds.has(tabId)) {
        selectedTabIds.add(tabId)
      }
    }

    for (const tabId of tabOrder) {
      if (availableTabIds.has(tabId) && visitedTabs[tabId]) {
        selectedTabIds.add(tabId)
      }
    }

    if (activeDefinition && availableTabIds.has(activeDefinition.id)) {
      selectedTabIds.add(activeDefinition.id)
    }

    const next = tabOrder.filter(
      (tabId) => availableTabIds.has(tabId) && selectedTabIds.has(tabId)
    )

    if (next.length === 0 && tabDefinitions[0]) {
      return [tabDefinitions[0].id]
    }

    return next
  }, [activeDefinition, tabDefinitions, tabOrder, visitedTabs])

  const mountedDefinitions = mountedTabIds
    .map((tabId) => tabDefinitionById.get(tabId))
    .filter((definition): definition is WorkspaceTabDefinition => !!definition)
  const visibleDefinitions =
    mountedDefinitions.length > 0
      ? mountedDefinitions
      : activeDefinition
        ? [activeDefinition]
        : []

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
        ) : visibleDefinitions.length > 0 ? (
          visibleDefinitions.map((definition) => {
            const content = renderTabContent(definition)
            if (!content) return null

            const isActive = activeDefinition?.id === definition.id

            return (
              <div
                key={definition.id}
                className={cn("h-full min-h-0", !isActive && "hidden")}
                aria-hidden={!isActive}
              >
                {definition.id === "research" ? (
                  <div className="h-full min-h-0">{content}</div>
                ) : (
                  <DocumentTabContent>{content}</DocumentTabContent>
                )}
              </div>
            )
          })
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-sm text-muted-foreground">
            No document is available in this workspace.
          </div>
        )}
      </div>
    </div>
  )
}

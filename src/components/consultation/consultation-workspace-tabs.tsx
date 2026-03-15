"use client"

import { IconLayoutSidebarRightExpand, IconLoader2 } from "@tabler/icons-react"
import { useTranslations } from "next-intl"

import {
  ConsultationTopRail,
  TOP_RAIL_SCROLL_CLASS,
} from "./consultation-top-chrome"
import {
  type ConsultationTabId,
  useConsultationTabStore,
} from "@/stores/consultation-tab-store"
import { useDdxStore } from "@/stores/ddx-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useResearchStore } from "@/stores/research-store"
import { useSessionDocumentStore } from "@/stores/session-document-store"
import { useSessionStore } from "@/stores/session-store"
import { cn } from "@/lib/utils"

type Translator = (...args: never[]) => string

function getTabAriaLabel(
  label: string,
  opts: {
    isProcessing: boolean
    hasUnseenUpdate: boolean
    diagnosisCount: number
  },
  t: Translator
) {
  const translate = t as unknown as (
    key: string,
    values?: Record<string, unknown>
  ) => string
  const parts = [label]

  if (opts.isProcessing) {
    parts.push(translate("status.updating"))
  }

  if (opts.hasUnseenUpdate) {
    parts.push(translate("status.newResults"))
  }

  if (opts.diagnosisCount > 0) {
    parts.push(translate("status.diagnosisCount", { count: opts.diagnosisCount }))
  }

  return parts.join(", ")
}

const WORKSPACE_TAB_BUTTON_CLASS_NAME = cn(
  "inline-flex h-7 items-center rounded-lg border-0 px-2.5 text-[12px] font-medium shadow-none outline-none transition-colors sm:h-8 sm:px-3 sm:text-[14px]",
  "bg-transparent text-foreground/68 hover:bg-transparent hover:text-foreground",
  "focus-visible:ring-2 focus-visible:ring-ring/40",
  "aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
)

const WORKSPACE_ACTION_BUTTON_CLASS_NAME = cn(
  "inline-flex h-7 items-center rounded-lg border-0 px-2.5 text-[12px] font-medium shadow-none outline-none transition-colors sm:h-8 sm:px-3 sm:text-[14px]",
  "bg-transparent text-foreground/68 hover:bg-transparent hover:text-foreground",
  "focus-visible:ring-2 focus-visible:ring-ring/40"
)

const TOP_LEVEL_TABS: ConsultationTabId[] = [
  "insights",
  "ddx",
  "documents",
  "research",
]

export function ConsultationWorkspaceTabs() {
  const t = useTranslations("ConsultationTabs")
  const tTranscript = useTranslations("TranscriptViewer")
  const tHeader = useTranslations("SiteHeader")
  const activeTab = useConsultationTabStore((state) => state.activeTab)
  const setActiveTab = useConsultationTabStore((state) => state.setActiveTab)
  const unseenUpdates = useConsultationTabStore((state) => state.unseenUpdates)
  const isTranscriptCollapsed = useConsultationTabStore(
    (state) => state.isTranscriptCollapsed
  )
  const toggleTranscript = useConsultationTabStore((state) => state._toggleTranscript)
  const activeSessionId = useSessionStore((state) => state.activeSession?.id ?? null)

  const diagnosisCount = useDdxStore((state) => state.diagnoses.length)
  const isDdxProcessing = useDdxStore((state) => state.isProcessing)
  const isInsightsProcessing = useInsightsStore((state) => state.isProcessing)
  const isResearchStreaming = useResearchStore((state) => state.isStreaming)
  const documentUiState = useSessionDocumentStore((state) =>
    state.getSessionDocumentUiStates(activeSessionId)
  )
  const isAnyDocumentProcessing = Object.values(documentUiState).some(
    (uiState) => uiState.isGenerating || uiState.isSaving
  )
  const showTranscriptToggle = !!toggleTranscript && isTranscriptCollapsed

  const tabs = TOP_LEVEL_TABS.map((tabId) => {
    const label =
      tabId === "documents"
        ? t("documents")
        : t(tabId as "insights" | "ddx" | "research")
    const isProcessing =
      tabId === "insights"
        ? isInsightsProcessing
        : tabId === "ddx"
          ? isDdxProcessing
          : tabId === "research"
            ? isResearchStreaming
            : isAnyDocumentProcessing
    const hasUnseenUpdate = !!unseenUpdates[tabId] && activeTab !== tabId
    const showDiagnosisCount = tabId === "ddx" && diagnosisCount > 0

    return {
      id: tabId,
      label,
      isProcessing,
      hasUnseenUpdate,
      diagnosisCount: showDiagnosisCount ? diagnosisCount : null,
      ariaLabel: getTabAriaLabel(
        label,
        {
          isProcessing,
          hasUnseenUpdate,
          diagnosisCount: showDiagnosisCount ? diagnosisCount : 0,
        },
        t
      ),
    }
  })

  return (
    <ConsultationTopRail className="h-auto min-h-0 items-center overflow-visible border-0 bg-transparent px-1.5 py-1.5 sm:px-2 sm:py-2">
      <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className={cn(TOP_RAIL_SCROLL_CLASS, "h-auto min-h-0 items-center gap-0.5 sm:gap-1")}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-current={activeTab === tab.id ? "page" : undefined}
              aria-label={tab.ariaLabel}
              onClick={() => setActiveTab(tab.id)}
              className={WORKSPACE_TAB_BUTTON_CLASS_NAME}
            >
              <span className="truncate">{tab.label}</span>
              {(tab.isProcessing ||
                tab.hasUnseenUpdate ||
                tab.diagnosisCount !== null) && (
                <span className="ml-1 flex items-center gap-1 sm:ml-1.5 sm:gap-1.5">
                  {tab.isProcessing ? (
                    <IconLoader2
                      className={cn(
                        "size-3 animate-spin",
                        activeTab === tab.id
                          ? "text-foreground/70"
                          : "text-muted-foreground"
                      )}
                    />
                  ) : tab.hasUnseenUpdate ? (
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                  ) : null}
                  {tab.diagnosisCount !== null ? (
                    <span
                      className={cn(
                        "inline-flex min-w-3.5 items-center justify-center rounded-sm px-1 py-0.5 text-[9px] tabular-nums sm:min-w-4 sm:text-[10px]",
                        activeTab === tab.id
                          ? "bg-muted text-foreground"
                          : "bg-background/65 text-muted-foreground"
                      )}
                    >
                      {tab.diagnosisCount}
                    </span>
                  ) : null}
                </span>
              )}
            </button>
          ))}

          {showTranscriptToggle ? (
            <button
              type="button"
              onClick={toggleTranscript ?? undefined}
              aria-label={tHeader("showTranscript")}
              title={tHeader("showTranscript")}
              className={cn("2xl:hidden", WORKSPACE_ACTION_BUTTON_CLASS_NAME)}
            >
              <span className="truncate">{tTranscript("headerTranscript")}</span>
            </button>
          ) : null}
        </div>
      </div>

      {showTranscriptToggle ? (
        <button
          type="button"
          onClick={toggleTranscript ?? undefined}
          aria-label={tHeader("showTranscript")}
          title={tHeader("showTranscript")}
          className={cn(
            "hidden 2xl:inline-flex",
            WORKSPACE_ACTION_BUTTON_CLASS_NAME
          )}
        >
          <IconLayoutSidebarRightExpand className="size-4" />
          <span className="truncate">{tTranscript("headerTranscript")}</span>
        </button>
      ) : null}
    </ConsultationTopRail>
  )
}

"use client"

import {
  IconLayoutSidebarRightExpand,
  IconLoader2,
} from "@tabler/icons-react"
import { useTranslations } from "next-intl"

import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  ConsultationTopRail,
  ConsultationTopRailAction,
  TOP_RAIL_SCROLL_CLASS,
  consultationSegmentClassName,
} from "./consultation-top-chrome"
import {
  CONSULTATION_TABS,
  type ConsultationTabId,
  useConsultationTabStore,
} from "@/stores/consultation-tab-store"
import { useDdxStore } from "@/stores/ddx-store"
import { useInsightsStore } from "@/stores/insights-store"
import { usePatientHandoutStore } from "@/stores/patient-handout-store"
import { useRecordStore } from "@/stores/record-store"
import { useResearchStore } from "@/stores/research-store"

function getTabAriaLabel(
  tab: ConsultationTabId,
  label: string,
  opts: {
    isProcessing: boolean
    hasUnseenUpdate: boolean
    diagnosisCount: number
  },
  t: (key: string, values?: Record<string, unknown>) => string
) {
  const parts = [label]

  if (opts.isProcessing) {
    parts.push(t("status.updating"))
  }

  if (opts.hasUnseenUpdate) {
    parts.push(t("status.newResults"))
  }

  if (tab === "ddx" && opts.diagnosisCount > 0) {
    parts.push(t("status.diagnosisCount", { count: opts.diagnosisCount }))
  }

  return parts.join(", ")
}

type TabViewModel = {
  value: ConsultationTabId
  label: string
  ariaLabel: string
  isActive: boolean
  isProcessing: boolean
  hasUnseenUpdate: boolean
  diagnosisCount: number | null
}

export function ConsultationWorkspaceTabs() {
  const t = useTranslations("ConsultationTabs")
  const tTranscript = useTranslations("TranscriptViewer")
  const tHeader = useTranslations("SiteHeader")
  const activeTab = useConsultationTabStore((s) => s.activeTab)
  const unseenUpdates = useConsultationTabStore((s) => s.unseenUpdates)
  const isTranscriptCollapsed = useConsultationTabStore((s) => s.isTranscriptCollapsed)
  const toggleTranscript = useConsultationTabStore((s) => s._toggleTranscript)

  const diagnosisCount = useDdxStore((s) => s.diagnoses.length)
  const isDdxProcessing = useDdxStore((s) => s.isProcessing)
  const isInsightsProcessing = useInsightsStore((s) => s.isProcessing)
  const isRecordGenerating = useRecordStore((s) => s.isGenerating)
  const isResearchStreaming = useResearchStore((s) => s.isStreaming)
  const isPatientHandoutGenerating = usePatientHandoutStore((s) => s.isGenerating)

  const processingByTab: Record<ConsultationTabId, boolean> = {
    insights: isInsightsProcessing,
    ddx: isDdxProcessing,
    record: isRecordGenerating,
    research: isResearchStreaming,
    patientHandout: isPatientHandoutGenerating,
  }

  const showTranscriptToggle = !!toggleTranscript && isTranscriptCollapsed
  const tabViewModels: TabViewModel[] = CONSULTATION_TABS.map((tab) => {
    const label = t(tab)
    const isProcessing = processingByTab[tab]
    const hasUnseenUpdate = unseenUpdates[tab] && activeTab !== tab
    const showDiagnosisCount = tab === "ddx" && diagnosisCount > 0

    return {
      value: tab,
      label,
      ariaLabel: getTabAriaLabel(
        tab,
        label,
        {
          isProcessing,
          hasUnseenUpdate,
          diagnosisCount,
        },
        t
      ),
      isActive: activeTab === tab,
      isProcessing,
      hasUnseenUpdate,
      diagnosisCount: showDiagnosisCount ? diagnosisCount : null,
    }
  })

  return (
    <ConsultationTopRail>
      <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <TabsList
          variant="line"
          className={TOP_RAIL_SCROLL_CLASS}
        >
          {tabViewModels.map((tab) => {
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                aria-label={tab.ariaLabel}
                className={consultationSegmentClassName({
                  active: tab.isActive,
                })}
              >
                <span className="truncate">{tab.label}</span>
                {(tab.isProcessing || tab.hasUnseenUpdate || tab.diagnosisCount !== null) && (
                  <span className="ml-1.5 flex items-center gap-1.5">
                    {tab.isProcessing ? (
                      <IconLoader2
                        className={cn(
                          "size-3 animate-spin",
                          tab.isActive ? "text-foreground/70" : "text-muted-foreground"
                        )}
                      />
                    ) : tab.hasUnseenUpdate ? (
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                    ) : null}
                    {tab.diagnosisCount !== null ? (
                      <span
                        className={cn(
                          "inline-flex min-w-5 items-center justify-center rounded-sm px-1.5 py-0.5 text-[11px] tabular-nums",
                          tab.isActive
                            ? "bg-muted text-foreground"
                            : "bg-background/65 text-muted-foreground"
                        )}
                      >
                        {tab.diagnosisCount}
                      </span>
                    ) : null}
                  </span>
                )}
              </TabsTrigger>
            )
          })}

          {showTranscriptToggle && (
            <ConsultationTopRailAction
              onClick={toggleTranscript ?? undefined}
              aria-label={tHeader("showTranscript")}
              title={tHeader("showTranscript")}
              className="2xl:hidden"
            >
              <span className="truncate">{tTranscript("headerTranscript")}</span>
            </ConsultationTopRailAction>
          )}
        </TabsList>
      </div>

      {showTranscriptToggle && (
        <ConsultationTopRailAction
          onClick={toggleTranscript ?? undefined}
          aria-label={tHeader("showTranscript")}
          title={tHeader("showTranscript")}
          className="hidden 2xl:inline-flex"
        >
          <IconLayoutSidebarRightExpand className="size-4" />
          <span className="truncate">{tTranscript("headerTranscript")}</span>
        </ConsultationTopRailAction>
      )}
    </ConsultationTopRail>
  )
}

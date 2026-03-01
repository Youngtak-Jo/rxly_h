"use client"

import { IconLoader2 } from "@tabler/icons-react"
import { useTranslations } from "next-intl"

import { TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export function ConsultationWorkspaceTabs() {
  const t = useTranslations("ConsultationTabs")
  const activeTab = useConsultationTabStore((s) => s.activeTab)
  const unseenUpdates = useConsultationTabStore((s) => s.unseenUpdates)

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

  return (
    <TabsList
      variant="line"
      className="h-11 w-full justify-start gap-0 overflow-x-auto rounded-none border-b bg-transparent p-0"
    >
      {CONSULTATION_TABS.map((tab) => {
        const label = t(tab)
        const isProcessing = processingByTab[tab]
        const hasUnseenUpdate = unseenUpdates[tab] && activeTab !== tab
        const showDiagnosisCount = tab === "ddx" && diagnosisCount > 0

        return (
          <TabsTrigger
            key={tab}
            value={tab}
            aria-label={getTabAriaLabel(
              tab,
              label,
              {
                isProcessing,
                hasUnseenUpdate,
                diagnosisCount,
              },
              t
            )}
            className="group h-11 flex-none shrink-0 rounded-none border-x border-t border-transparent border-b border-b-border bg-muted/80 px-3.5 text-sm font-medium text-muted-foreground shadow-none after:hidden hover:bg-muted hover:text-foreground data-[state=active]:-mb-px data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:bg-background data-[state=active]:text-foreground"
          >
            <span className="truncate">{label}</span>
            {(isProcessing || hasUnseenUpdate || showDiagnosisCount) && (
              <span className="ml-1.5 flex items-center gap-1.5">
                {isProcessing ? (
                  <IconLoader2 className="size-3 animate-spin text-muted-foreground" />
                ) : hasUnseenUpdate ? (
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                ) : null}
                {showDiagnosisCount ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-none bg-muted px-1.5 py-0.5 text-[11px] tabular-nums text-muted-foreground group-data-[state=active]:bg-muted/80 group-data-[state=active]:text-foreground">
                    {diagnosisCount}
                  </span>
                ) : null}
              </span>
            )}
          </TabsTrigger>
        )
      })}
    </TabsList>
  )
}

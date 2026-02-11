"use client"

import { SummaryCard } from "./summary-card"
import { KeyFindingsCard } from "./key-findings-card"
import { RedFlagsCard } from "./red-flags-card"
import { ChecklistCard } from "./checklist-card"
import { useInsightsStore } from "@/stores/insights-store"

export function InsightsContainer() {
  const { summary, keyFindings, redFlags, isProcessing } = useInsightsStore()
  const hasContent = summary || keyFindings.length > 0 || redFlags.length > 0

  return (
    <div className="space-y-4">
      {isProcessing && !hasContent && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          Analyzing conversation...
        </div>
      )}

      <SummaryCard />
      <KeyFindingsCard />
      <RedFlagsCard />
      <ChecklistCard />
    </div>
  )
}

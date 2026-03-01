"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useInsightsStore } from "@/stores/insights-store"
import { IconFileText } from "@tabler/icons-react"

export function SummaryCard() {
  const t = useTranslations("InsightsPanel")
  const summary = useInsightsStore((s) => s.summary)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <IconFileText className="size-4 text-blue-500" />
          {t("summary")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {summary ? (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {summary}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic">
            {t("summaryEmpty")}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

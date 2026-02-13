"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useInsightsStore } from "@/stores/insights-store"
import { IconAlertTriangle } from "@tabler/icons-react"

export function RedFlagsCard() {
  const redFlags = useInsightsStore((s) => s.redFlags)

  if (redFlags.length === 0) return null

  return (
    <Card className="border-red-200 dark:border-red-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
          <IconAlertTriangle className="size-4" />
          Red Flags
          <Badge
            variant="destructive"
            className="ml-auto text-[10px]"
          >
            {redFlags.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5">
          {redFlags.map((flag, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
              {flag}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

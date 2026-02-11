"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useInsightsStore } from "@/stores/insights-store"
import { IconSearch } from "@tabler/icons-react"

export function KeyFindingsCard() {
  const keyFindings = useInsightsStore((s) => s.keyFindings)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <IconSearch className="size-4 text-emerald-500" />
          Key Findings
          {keyFindings.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {keyFindings.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {keyFindings.length > 0 ? (
          <ul className="space-y-1.5">
            {keyFindings.map((finding, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {finding}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic">
            Key findings will be identified as the conversation progresses...
          </p>
        )}
      </CardContent>
    </Card>
  )
}

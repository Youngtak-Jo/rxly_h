import type {
  AdminAiOpsResponse,
  AdminAiOpsRow,
  AdminAiOverview,
  AdminFeature,
  AdminMode,
} from "@/types/admin"
import { prisma } from "@/lib/prisma"
import { matchesAiUsageFeature } from "@/lib/admin/feature"
import { percentile } from "@/lib/admin/metrics"

export type AdminAiUsageEventRow = {
  feature: string
  model: string
  status: string
  latencyMs: number | null
  costUsd: number | null
}

export async function loadAdminAiUsageEvents(input: {
  from: Date
  to: Date
  mode?: AdminMode | null
}): Promise<AdminAiUsageEventRow[]> {
  return prisma.aiUsageEvent.findMany({
    where: {
      createdAt: {
        gte: input.from,
        lte: input.to,
      },
      ...(input.mode && input.mode !== "ALL"
        ? {
            session: {
              mode: input.mode,
            },
          }
        : {}),
    },
    select: {
      feature: true,
      model: true,
      status: true,
      latencyMs: true,
      costUsd: true,
    },
  })
}

export function buildAdminAiOpsRows(
  events: AdminAiUsageEventRow[],
  selectedFeature: AdminFeature = "all"
): AdminAiOpsRow[] {
  const grouped = new Map<
    string,
    {
      feature: string
      model: string
      calls: number
      successCount: number
      failureCount: number
      latencies: number[]
      costUsd: number
    }
  >()

  for (const event of events) {
    if (!matchesAiUsageFeature(selectedFeature, event.feature)) continue

    const key = `${event.feature}::${event.model}`
    const current = grouped.get(key) || {
      feature: event.feature,
      model: event.model,
      calls: 0,
      successCount: 0,
      failureCount: 0,
      latencies: [],
      costUsd: 0,
    }

    current.calls += 1
    if (event.status === "success") {
      current.successCount += 1
    } else {
      current.failureCount += 1
    }
    if ((event.latencyMs ?? 0) > 0) {
      current.latencies.push(event.latencyMs as number)
    }
    current.costUsd += event.costUsd ?? 0

    grouped.set(key, current)
  }

  return Array.from(grouped.values())
    .map((row) => ({
      feature: row.feature,
      model: row.model,
      calls: row.calls,
      successCount: row.successCount,
      failureCount: row.failureCount,
      failureRate: row.calls > 0 ? row.failureCount / row.calls : 0,
      p50LatencyMs: percentile(row.latencies, 50),
      p95LatencyMs: percentile(row.latencies, 95),
      costUsd: Number(row.costUsd.toFixed(6)),
    }))
    .sort((a, b) => {
      if (b.calls !== a.calls) return b.calls - a.calls
      return b.failureRate - a.failureRate
    })
}

export function buildAdminAiOverview(input: {
  events: AdminAiUsageEventRow[]
  sessionCount: number
  selectedFeature?: AdminFeature
}): AdminAiOverview {
  const selectedFeature = input.selectedFeature || "all"
  const rows = buildAdminAiOpsRows(input.events, selectedFeature)
  const filteredEvents = input.events.filter((event) =>
    matchesAiUsageFeature(selectedFeature, event.feature)
  )
  const totalCostUsd = filteredEvents.reduce(
    (sum, event) => sum + (event.costUsd ?? 0),
    0
  )
  const latencies = filteredEvents
    .map((event) => event.latencyMs ?? 0)
    .filter((latency) => latency > 0)

  const topCostRow =
    [...rows].sort((a, b) => {
      if (b.costUsd !== a.costUsd) return b.costUsd - a.costUsd
      return b.calls - a.calls
    })[0] ?? null

  return {
    totalCostUsd: Number(totalCostUsd.toFixed(6)),
    costPerSession:
      input.sessionCount > 0
        ? Number((totalCostUsd / input.sessionCount).toFixed(6))
        : 0,
    p95LatencyMs: percentile(latencies, 95),
    costConcentrationRate:
      totalCostUsd > 0 && topCostRow ? topCostRow.costUsd / totalCostUsd : 0,
    topCostRow,
    topFailingRows: [...rows]
      .filter((row) => row.failureCount > 0)
      .sort((a, b) => {
        if (b.failureCount !== a.failureCount) return b.failureCount - a.failureCount
        if (b.failureRate !== a.failureRate) return b.failureRate - a.failureRate
        return b.calls - a.calls
      })
      .slice(0, 3),
  }
}

export async function loadAdminAiOps(input: {
  from: Date
  to: Date
  mode?: AdminMode | null
  feature?: AdminFeature
  sessionCount?: number
}): Promise<{ response: AdminAiOpsResponse; overview: AdminAiOverview }> {
  const events = await loadAdminAiUsageEvents({
    from: input.from,
    to: input.to,
    mode: input.mode,
  })

  return {
    response: {
      from: input.from.toISOString(),
      to: input.to.toISOString(),
      rows: buildAdminAiOpsRows(events, input.feature || "all"),
    },
    overview: buildAdminAiOverview({
      events,
      sessionCount: input.sessionCount ?? 0,
      selectedFeature: input.feature || "all",
    }),
  }
}

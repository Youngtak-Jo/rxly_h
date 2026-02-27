import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { adminJson } from "@/lib/admin/http"
import { parseAdminRange, percentile } from "@/lib/admin/metrics"
import { matchesAiUsageFeature, normalizeAdminFeature } from "@/lib/admin/feature"
import { prisma } from "@/lib/prisma"
import type { AdminAiOpsResponse } from "@/types/admin"
import { logger } from "@/lib/logger"

export async function GET(req: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const { from, to } = parseAdminRange(searchParams)
    const mode = searchParams.get("mode")
    const modeFilter = mode === "DOCTOR" || mode === "AI_DOCTOR" ? mode : null
    const feature = normalizeAdminFeature(searchParams.get("feature"))

    const events = await prisma.aiUsageEvent.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to,
        },
        ...(modeFilter
          ? {
              session: {
                mode: modeFilter,
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
      if (!matchesAiUsageFeature(feature, event.feature)) continue

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

    const response: AdminAiOpsResponse = {
      from: from.toISOString(),
      to: to.toISOString(),
      rows: Array.from(grouped.values())
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
        }),
    }

    return adminJson(response)
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Failed to load admin ai ops", error)
    return adminJson({ error: "Failed to load AI Ops" }, 500)
  }
}

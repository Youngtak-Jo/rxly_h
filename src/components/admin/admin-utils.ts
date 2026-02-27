import type { AdminInsightAlert } from "@/types/admin"

export function toPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "-"
  const year = parsed.getUTCFullYear()
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0")
  const day = String(parsed.getUTCDate()).padStart(2, "0")
  const hour = String(parsed.getUTCHours()).padStart(2, "0")
  const minute = String(parsed.getUTCMinutes()).padStart(2, "0")
  const second = String(parsed.getUTCSeconds()).padStart(2, "0")
  return `${year}-${month}-${day} ${hour}:${minute}:${second} UTC`
}

export function severityBadgeVariant(
  severity: AdminInsightAlert["severity"]
): "default" | "secondary" | "destructive" | "outline" {
  if (severity === "high") return "destructive"
  if (severity === "positive") return "default"
  if (severity === "medium") return "secondary"
  return "outline"
}

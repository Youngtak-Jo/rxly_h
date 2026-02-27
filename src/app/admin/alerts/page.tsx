import { redirect } from "next/navigation"
import { ensureAdminFilterParams, type RouteSearchParams } from "@/lib/admin/server-filters"

export default async function AdminAlertsPage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>
}) {
  const rawSearchParams = await searchParams
  const params = ensureAdminFilterParams("/admin/alerts", rawSearchParams)
  redirect(`/admin/triage?${params.toString()}`)
}

import { AdminCohorts } from "@/components/admin/admin-cohorts"
import { ensureAdminFilterParams, type RouteSearchParams } from "@/lib/admin/server-filters"

export default async function AdminCohortsPage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>
}) {
  const rawSearchParams = await searchParams
  ensureAdminFilterParams("/admin/cohorts", rawSearchParams)

  return <AdminCohorts />
}

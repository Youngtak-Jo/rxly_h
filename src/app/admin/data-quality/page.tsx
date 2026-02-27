import { AdminDataQuality } from "@/components/admin/admin-data-quality"
import { ensureAdminFilterParams, type RouteSearchParams } from "@/lib/admin/server-filters"

export default async function AdminDataQualityPage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>
}) {
  const rawSearchParams = await searchParams
  ensureAdminFilterParams("/admin/data-quality", rawSearchParams)

  return <AdminDataQuality />
}

import { AdminCompliance } from "@/components/admin/admin-compliance"
import { ensureAdminFilterParams, type RouteSearchParams } from "@/lib/admin/server-filters"

export default async function AdminCompliancePage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>
}) {
  const rawSearchParams = await searchParams
  ensureAdminFilterParams("/admin/compliance", rawSearchParams)

  return <AdminCompliance />
}

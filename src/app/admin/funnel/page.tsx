import { AdminFunnel } from "@/components/admin/admin-funnel"
import { ensureAdminFilterParams, type RouteSearchParams } from "@/lib/admin/server-filters"

export default async function AdminFunnelPage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>
}) {
  const rawSearchParams = await searchParams
  ensureAdminFilterParams("/admin/funnel", rawSearchParams)

  return <AdminFunnel />
}

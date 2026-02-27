import { AdminAiOps } from "@/components/admin/admin-ai-ops"
import { ensureAdminFilterParams, type RouteSearchParams } from "@/lib/admin/server-filters"

export default async function AdminAiOpsPage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>
}) {
  const rawSearchParams = await searchParams
  ensureAdminFilterParams("/admin/ai-ops", rawSearchParams)

  return <AdminAiOps />
}

import { AdminSessionDetailView } from "@/components/admin/admin-session-detail"
import { ensureAdminFilterParams, type RouteSearchParams } from "@/lib/admin/server-filters"

export default async function AdminSessionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<RouteSearchParams>
}) {
  const [{ id }, rawSearchParams] = await Promise.all([params, searchParams])
  ensureAdminFilterParams(`/admin/sessions/${id}`, rawSearchParams)

  return <AdminSessionDetailView sessionId={id} />
}

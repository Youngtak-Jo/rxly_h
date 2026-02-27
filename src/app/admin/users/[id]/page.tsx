import { AdminUserDetail } from "@/components/admin/admin-user-detail"
import { ensureAdminFilterParams, type RouteSearchParams } from "@/lib/admin/server-filters"

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<RouteSearchParams>
}) {
  const [{ id }, rawSearchParams] = await Promise.all([params, searchParams])
  ensureAdminFilterParams(`/admin/users/${id}`, rawSearchParams)

  return <AdminUserDetail userId={id} />
}

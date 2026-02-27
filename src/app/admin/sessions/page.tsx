import { AdminSessions } from "@/components/admin/admin-sessions"
import { ensureAdminFilterParams, type RouteSearchParams } from "@/lib/admin/server-filters"

export default async function AdminSessionsPage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>
}) {
  const rawSearchParams = await searchParams
  ensureAdminFilterParams("/admin/sessions", rawSearchParams)

  return <AdminSessions />
}

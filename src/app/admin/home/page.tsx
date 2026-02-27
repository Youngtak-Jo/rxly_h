import { AdminHome } from "@/components/admin/admin-home"
import { ensureAdminFilterParams, type RouteSearchParams } from "@/lib/admin/server-filters"

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>
}) {
  const rawSearchParams = await searchParams
  ensureAdminFilterParams("/admin/home", rawSearchParams)

  return <AdminHome />
}

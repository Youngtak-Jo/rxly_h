import { AdminTriage } from "@/components/admin/admin-triage"
import { ensureAdminFilterParams, type RouteSearchParams } from "@/lib/admin/server-filters"

export default async function AdminTriagePage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>
}) {
  const rawSearchParams = await searchParams
  ensureAdminFilterParams("/admin/triage", rawSearchParams)

  return <AdminTriage />
}

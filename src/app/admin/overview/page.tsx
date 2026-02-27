import { redirect } from "next/navigation"
import { ensureAdminFilterParams, type RouteSearchParams } from "@/lib/admin/server-filters"

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<RouteSearchParams>
}) {
  const rawSearchParams = await searchParams
  const params = ensureAdminFilterParams("/admin/overview", rawSearchParams)
  redirect(`/admin/home?${params.toString()}`)
}

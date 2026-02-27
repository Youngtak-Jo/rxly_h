import { redirect } from "next/navigation"
import { createDefaultAdminFilters, filtersToSearchParams } from "@/lib/admin/filters"

export default function AdminPage() {
  const filters = createDefaultAdminFilters()
  const params = filtersToSearchParams(filters)
  redirect(`/admin/home?${params.toString()}`)
}

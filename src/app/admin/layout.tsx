import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { AdminShell } from "@/components/admin/admin-shell"

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  try {
    await requireAdmin()
  } catch {
    redirect("/consultation")
  }

  return <AdminShell>{children}</AdminShell>
}

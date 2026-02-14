import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { decryptField } from "@/lib/encryption"

export default async function ExportViewerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Require authentication
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch export link
  const exportLink = await prisma.exportLink.findUnique({
    where: { id },
  })

  if (!exportLink) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Export Not Found</h1>
          <p className="text-muted-foreground">
            This export link is invalid or has been removed.
          </p>
        </div>
      </div>
    )
  }

  // Check ownership
  if (exportLink.userId !== user.id) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have permission to view this export.
          </p>
        </div>
      </div>
    )
  }

  // Check expiry
  if (new Date() > exportLink.expiresAt) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Link Expired</h1>
          <p className="text-muted-foreground">
            This export link has expired. Please generate a new export from the
            application.
          </p>
        </div>
      </div>
    )
  }

  // Decrypt content and increment access count
  const decryptedContent = decryptField(exportLink.content) || ""

  await prisma.exportLink.update({
    where: { id },
    data: { accessCount: { increment: 1 } },
  })

  return (
    <div className="min-h-screen bg-white p-8 print:p-0">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 print:hidden">
          <p className="text-sm text-muted-foreground">
            This is a secure, time-limited export. Access expires{" "}
            {exportLink.expiresAt.toLocaleString()}.
          </p>
        </div>
        <div dangerouslySetInnerHTML={{ __html: decryptedContent }} />
      </div>
    </div>
  )
}

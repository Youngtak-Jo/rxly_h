import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { ExportLinkAccessMode } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { decryptField } from "@/lib/encryption"
import { sanitizeStandaloneExportHtml } from "@/lib/export-viewer"
import { formatDateTime } from "@/i18n/format"
import { resolveServerUiLocale, resolveServerUiTimeZone } from "@/i18n/server"

export default async function ExportViewerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getTranslations("ExportViewer")
  const [locale, { timeZone }] = await Promise.all([
    resolveServerUiLocale(),
    resolveServerUiTimeZone(),
  ])
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
          <h1 className="text-2xl font-bold mb-2">{t("notFoundTitle")}</h1>
          <p className="text-muted-foreground">
            {t("notFoundDescription")}
          </p>
        </div>
      </div>
    )
  }

  if (exportLink.accessMode !== ExportLinkAccessMode.OWNER_AUTH) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{t("notFoundTitle")}</h1>
          <p className="text-muted-foreground">
            {t("notFoundDescription")}
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
          <h1 className="text-2xl font-bold mb-2">{t("accessDeniedTitle")}</h1>
          <p className="text-muted-foreground">
            {t("accessDeniedDescription")}
          </p>
        </div>
      </div>
    )
  }

  if (exportLink.revokedAt) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{t("notFoundTitle")}</h1>
          <p className="text-muted-foreground">
            {t("notFoundDescription")}
          </p>
        </div>
      </div>
    )
  }

  // Check expiry
  if (exportLink.expiresAt && new Date() > exportLink.expiresAt) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{t("expiredTitle")}</h1>
          <p className="text-muted-foreground">
            {t("expiredDescription")}
          </p>
        </div>
      </div>
    )
  }

  // Decrypt content, sanitize HTML, and increment access count
  const rawContent = decryptField(exportLink.content) || ""
  const decryptedContent = sanitizeStandaloneExportHtml(rawContent)

  await prisma.exportLink.update({
    where: { id },
    data: {
      accessCount: { increment: 1 },
      lastAccessedAt: new Date(),
    },
  })

  return (
    <div className="min-h-screen bg-white">
      {exportLink.expiresAt ? (
        <div className="border-b border-border/70 px-4 py-3 text-sm text-muted-foreground print:hidden sm:px-6">
          <p>
            {t("accessExpires", {
              date: formatDateTime(exportLink.expiresAt, locale, timeZone),
            })}
          </p>
        </div>
      ) : null}
      <div dangerouslySetInnerHTML={{ __html: decryptedContent }} />
    </div>
  )
}

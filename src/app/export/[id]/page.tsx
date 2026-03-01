import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { decryptField } from "@/lib/encryption"
import sanitizeHtml from "sanitize-html"
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

  // Check expiry
  if (new Date() > exportLink.expiresAt) {
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
  const decryptedContent = sanitizeHtml(rawContent, {
    allowedTags: ["h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "ul", "ol", "li", "strong", "em", "b", "i", "table", "thead", "tbody", "tr", "th", "td", "span", "div", "hr", "a", "pre", "code"],
    allowedAttributes: { "*": ["class", "style"], a: ["href", "target", "rel"] },
  })

  await prisma.exportLink.update({
    where: { id },
    data: { accessCount: { increment: 1 } },
  })

  return (
    <div className="min-h-screen bg-white p-8 print:p-0">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 print:hidden">
          <p className="text-sm text-muted-foreground">
            {t("accessExpires", {
              date: formatDateTime(exportLink.expiresAt, locale, timeZone),
            })}
          </p>
        </div>
        <div dangerouslySetInnerHTML={{ __html: decryptedContent }} />
      </div>
    </div>
  )
}

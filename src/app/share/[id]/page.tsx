import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import {
  ExportLinkAccessMode,
  ExportLinkChannel,
} from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { decryptField } from "@/lib/encryption"
import { sanitizeStandaloneExportHtml } from "@/lib/export-viewer"
import { ShareToolbar } from "./share-toolbar"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

function InvalidShareState({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md text-center">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
    </div>
  )
}

export default async function PublicShareViewerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getTranslations("PublicShareViewer")
  const { id } = await params

  const exportLink = await prisma.exportLink.findUnique({
    where: { id },
  })

  if (
    !exportLink ||
    exportLink.accessMode !== ExportLinkAccessMode.PUBLIC_LINK ||
    exportLink.channel !== ExportLinkChannel.PATIENT_SHARE
  ) {
    return (
      <InvalidShareState
        title={t("notFoundTitle")}
        description={t("notFoundDescription")}
      />
    )
  }

  if (exportLink.revokedAt) {
    return (
      <InvalidShareState
        title={t("revokedTitle")}
        description={t("revokedDescription")}
      />
    )
  }

  const rawContent = decryptField(exportLink.content) || ""
  const sharedContent = sanitizeStandaloneExportHtml(rawContent)

  await prisma.exportLink.update({
    where: { id },
    data: {
      accessCount: { increment: 1 },
      lastAccessedAt: new Date(),
    },
  })

  return (
    <div className="min-h-screen bg-[#eef2f6]">
      <ShareToolbar title={exportLink.title} />
      <div dangerouslySetInnerHTML={{ __html: sharedContent }} />
    </div>
  )
}

"use client"

import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { useConsultationDocumentsStore } from "@/stores/consultation-documents-store"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useDocumentWorkspaceStore } from "@/stores/document-workspace-store"
import { useSessionDocumentStore } from "@/stores/session-document-store"
import { useSessionStore } from "@/stores/session-store"
import {
  buildActiveExportDocument,
  isPopupBlockedError,
  openPrintExport,
} from "@/lib/export-utils"
import { resolveConsultationActiveDocumentTitle, resolveWorkspaceTabDocumentContext } from "@/lib/consultation/active-document"
import { resolveWorkspaceTabDefinition } from "@/lib/documents/workspace"
import { trackClientEvent } from "@/lib/telemetry/client-events"
import { getResponseErrorMessage } from "@/lib/response-error"

export interface ConsultationExportSharePayload {
  filename: string
  sessionDocumentId: string
  sessionId: string
  standaloneHtml: string
  title: string
}

export function useConsultationExportActions() {
  const t = useTranslations("ExportDropdown")
  const tTabs = useTranslations("ConsultationTabs")
  const activeSession = useSessionStore((s) => s.activeSession)
  const activeSessionId = activeSession?.id ?? null
  const activeTab = useConsultationTabStore((s) => s.activeTab)
  const installedDocuments = useDocumentWorkspaceStore((s) => s.installedDocuments)
  const sessionDocuments = useSessionDocumentStore((state) =>
    state.getSessionDocuments(activeSessionId)
  )
  const documentsUiState = useConsultationDocumentsStore((state) =>
    state.getSessionUiState(activeSessionId)
  )
  const workspaceTabLabel =
    resolveWorkspaceTabDefinition(activeTab, installedDocuments, {
      insights: tTabs("insights"),
      ddx: tTabs("ddx"),
      documents: tTabs("documents"),
      research: tTabs("research"),
    })?.title ?? "Document"
  const activeTabLabel =
    resolveConsultationActiveDocumentTitle({
      sessionId: activeSessionId,
      activeTab,
      uiState: documentsUiState,
      installedDocuments,
      sessionDocuments,
      fallbackTitle: workspaceTabLabel,
    })
  const documentContext = resolveWorkspaceTabDocumentContext({
    activeTab,
    uiState: documentsUiState,
    installedDocuments,
    sessionDocuments,
  })
  const shareTarget =
    activeSessionId && documentContext.sessionDocument
      ? {
          sessionId: activeSessionId,
          sessionDocumentId: documentContext.sessionDocument.id,
        }
      : null

  const handlePdfExport = async () => {
    try {
      const payload = buildActiveExportDocument()
      openPrintExport(payload)
      if (activeSession) {
        trackClientEvent({
          eventType: "export_clicked",
          feature: "export",
          sessionId: activeSession.id,
          metadata: { tab: activeTab, channel: "pdf" },
        })
      }
      toast.success(t("pdfSuccess"))
    } catch (err) {
      console.error("PDF export error:", err)
      toast.error(isPopupBlockedError(err) ? t("popupBlocked") : t("pdfFailed"))
    }
  }

  const sendEmail = async (email: string): Promise<boolean> => {
    if (!email.trim()) return false

    try {
      const payload = buildActiveExportDocument()
      const subject = `Rxly — ${payload.title}: ${activeSession?.title || t("consultationFallback")}`
      const res = await fetch("/api/export/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: payload.standaloneHtml,
          sessionId: activeSession?.id,
          subject,
          to: email,
        }),
      })

      if (!res.ok) {
        throw new Error(await getResponseErrorMessage(res, t("emailFailed")))
      }

      if (activeSession) {
        trackClientEvent({
          eventType: "export_clicked",
          feature: "export",
          sessionId: activeSession.id,
          metadata: { tab: activeTab, channel: "email" },
        })
      }

      toast.success(t("emailSent", { email }))
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("emailFailed"))
      return false
    }
  }

  const buildDocumentSharePayload = (): ConsultationExportSharePayload => {
    if (!shareTarget) {
      throw new Error(t("shareUnavailable"))
    }

    const payload = buildActiveExportDocument()

    return {
      sessionId: shareTarget.sessionId,
      sessionDocumentId: shareTarget.sessionDocumentId,
      title: payload.title,
      filename: payload.filename,
      standaloneHtml: payload.standaloneHtml,
    }
  }

  return {
    activeSession,
    activeSessionId,
    activeTab,
    activeTabLabel,
    canShareDocument: !!shareTarget,
    shareTarget,
    handlePdfExport,
    sendEmail,
    buildDocumentSharePayload,
  }
}

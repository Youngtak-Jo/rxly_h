"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  IconLoader2,
  IconThumbDown,
  IconThumbUp,
} from "@tabler/icons-react"
import { useLocale, useTimeZone, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { DocumentEditor } from "@/components/consultation/documents/document-editor"
import { DocumentShell } from "@/components/consultation/documents/document-shell"
import { deleteCachedSession } from "@/hooks/use-session-loader"
import {
  buildStarterRichTextDocument,
  genericStructuredContentToRichTextDocument,
  isRichTextDocument,
  normalizeRichTextDocument,
  type RichTextDocument,
} from "@/lib/documents/rich-text"
import { trackClientEvent } from "@/lib/telemetry/client-events"
import { DEFAULT_UI_TIME_ZONE, type UiLocale } from "@/i18n/config"
import { formatDateTime } from "@/i18n/format"
import { buildDocumentTabId } from "@/lib/documents/constants"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useDocumentWorkspaceStore } from "@/stores/document-workspace-store"
import { useSessionDocumentStore } from "@/stores/session-document-store"
import { useSessionStore } from "@/stores/session-store"
import { useSettingsStore } from "@/stores/settings-store"
import type { SessionDocumentRecord } from "@/types/document"

interface SessionDocumentSaveResponse {
  sessionDocument: SessionDocumentRecord
  activeVersion: {
    id: string
    versionNumber: number
  }
}

function nodeHasMeaningfulContent(node: RichTextDocument | Record<string, unknown> | null | undefined): boolean {
  if (!node) return false

  if ("type" in node && node.type === "text") {
    return typeof node.text === "string" && node.text.trim().length > 0
  }

  if ("type" in node && node.type === "image") {
    return (
      !!node.attrs &&
      typeof node.attrs === "object" &&
      typeof (node.attrs as { src?: unknown }).src === "string" &&
      !!(node.attrs as { src: string }).src.trim()
    )
  }

  const content =
    "content" in node && Array.isArray(node.content)
      ? (node.content as Array<RichTextDocument | Record<string, unknown>>)
      : []

  return content.some((child) => nodeHasMeaningfulContent(child))
}

function documentHasMeaningfulContent(document: RichTextDocument | null | undefined): boolean {
  if (!document) return false
  return Array.isArray(document.content) && document.content.some((node) => nodeHasMeaningfulContent(node))
}

function toRichTextDocument(
  sessionDocument: SessionDocumentRecord | null,
  schemaNodes: SessionDocumentRecord["templateSchemaNodes"]
): RichTextDocument {
  if (sessionDocument?.contentJson) {
    if (isRichTextDocument(sessionDocument.contentJson)) {
      return normalizeRichTextDocument(sessionDocument.contentJson)
    }

    return genericStructuredContentToRichTextDocument({
      contentJson: sessionDocument.contentJson,
      schemaNodes,
    })
  }

  return buildStarterRichTextDocument(schemaNodes ?? [])
}

export function StructuredDocumentContainer({
  templateId,
}: {
  templateId: string
}) {
  const tDocument = useTranslations("ConsultationDocument")
  const locale = useLocale() as UiLocale
  const timeZone = useTimeZone() ?? DEFAULT_UI_TIME_ZONE
  const activeTab = useConsultationTabStore((state) => state.activeTab)
  const activeSession = useSessionStore((state) => state.activeSession)
  const installedDocument = useDocumentWorkspaceStore((state) =>
    state.installedDocuments.find((document) => document.templateId === templateId) ??
    null
  )
  const activeSessionId = activeSession?.id ?? null
  const upsertSessionDocument = useSessionDocumentStore(
    (state) => state.upsertSessionDocument
  )
  const setSessionDocumentUiState = useSessionDocumentStore(
    (state) => state.setSessionDocumentUiState
  )
  const sessionDocument = useSessionDocumentStore((state) =>
    activeSessionId
      ? state.documentsBySessionId[activeSessionId]?.[templateId] ?? null
      : null
  )
  const documentUiState = useSessionDocumentStore((state) =>
    activeSessionId
      ? state.getSessionDocumentUiState(activeSessionId, templateId)
      : {
          isGenerating: false,
          isSaving: false,
          lastGenerationError: null,
          feedbackForGeneratedAt: null,
        }
  )
  const documentModel = useSettingsStore((state) => state.aiModel.documentModel)

  const [draftDocument, setDraftDocument] = useState<RichTextDocument | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const hydrationSignatureRef = useRef<string | null>(null)
  const lastSavedFingerprintRef = useRef<string | null>(null)
  const autoGenerateAttemptRef = useRef<string | null>(null)

  const schemaNodes = useMemo(
    () =>
      sessionDocument?.templateSchemaNodes ??
      installedDocument?.installedVersionSchemaNodes ??
      [],
    [
      installedDocument?.installedVersionSchemaNodes,
      sessionDocument?.templateSchemaNodes,
    ]
  )

  const starterDocument = useMemo(
    () => buildStarterRichTextDocument(schemaNodes),
    [schemaNodes]
  )

  const currentDocument = useMemo(
    () => toRichTextDocument(sessionDocument, schemaNodes),
    [schemaNodes, sessionDocument]
  )

  const currentFingerprint = useMemo(
    () => JSON.stringify(currentDocument),
    [currentDocument]
  )
  const starterFingerprint = useMemo(
    () => JSON.stringify(starterDocument),
    [starterDocument]
  )
  const isStarterDocument = currentFingerprint === starterFingerprint
  const hasMeaningfulCurrentContent = documentHasMeaningfulContent(currentDocument)
  const isActiveDocumentTab =
    activeTab === buildDocumentTabId(templateId)

  useEffect(() => {
    if (!activeSessionId) {
      hydrationSignatureRef.current = null
      lastSavedFingerprintRef.current = null
      autoGenerateAttemptRef.current = null
      setDraftDocument(null)
      setSaveError(null)
      return
    }

    const signature = [
      activeSessionId,
      templateId,
      sessionDocument?.updatedAt ?? "new",
      sessionDocument?.templateVersionId ?? installedDocument?.installedVersionId ?? "none",
    ].join(":")

    if (hydrationSignatureRef.current === signature) {
      return
    }

    hydrationSignatureRef.current = signature
    setDraftDocument(currentDocument)
    lastSavedFingerprintRef.current = JSON.stringify(currentDocument)
    setSaveError(null)
    if (sessionDocument?.generatedAt) {
      autoGenerateAttemptRef.current = null
    }
  }, [
    activeSessionId,
    currentDocument,
    installedDocument?.installedVersionId,
    sessionDocument?.generatedAt,
    sessionDocument?.templateVersionId,
    sessionDocument?.updatedAt,
    templateId,
  ])

  useEffect(() => {
    if (!activeSessionId || !draftDocument || !installedDocument) return

    const fingerprint = JSON.stringify(draftDocument)
    if (lastSavedFingerprintRef.current === fingerprint) {
      return
    }

    const timer = setTimeout(async () => {
      try {
        setSessionDocumentUiState(activeSessionId, templateId, {
          isSaving: true,
        })
        const response = await fetch(
          `/api/sessions/${activeSessionId}/documents/${templateId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              templateVersionId:
                sessionDocument?.templateVersionId ?? installedDocument.installedVersionId,
              contentJson: draftDocument,
              generatedAt: sessionDocument?.generatedAt ?? null,
            }),
          }
        )

        if (!response.ok) {
          throw new Error("Failed to save document")
        }

        const payload = (await response.json()) as SessionDocumentSaveResponse
        lastSavedFingerprintRef.current = JSON.stringify(
          payload.sessionDocument.contentJson
        )
        upsertSessionDocument(payload.sessionDocument)
        deleteCachedSession(activeSessionId)
        setSaveError(null)
      } catch (error) {
        console.error("Failed to autosave document", error)
        setSaveError("Failed to save document")
      } finally {
        setSessionDocumentUiState(activeSessionId, templateId, {
          isSaving: false,
        })
      }
    }, 900)

    return () => clearTimeout(timer)
  }, [
    activeSessionId,
    draftDocument,
    installedDocument,
    sessionDocument?.generatedAt,
    sessionDocument?.templateVersionId,
    setSessionDocumentUiState,
    templateId,
    upsertSessionDocument,
  ])

  const handleGenerate = useCallback(
    async (trigger: "auto_open" | "regenerate") => {
      if (!activeSessionId || !installedDocument || documentUiState.isGenerating) {
        return
      }

      setSessionDocumentUiState(activeSessionId, templateId, {
        isGenerating: true,
        lastGenerationError: null,
      })

      trackClientEvent({
        eventType: "analysis_triggered",
        feature: "custom_document",
        sessionId: activeSessionId,
        metadata: {
          templateId,
          templateTitle: installedDocument.title,
          templateVersionId:
            sessionDocument?.templateVersionId ?? installedDocument.installedVersionId,
          generatedAt: sessionDocument?.generatedAt ?? null,
          trigger,
        },
      })

      try {
        const response = await fetch(
          `/api/sessions/${activeSessionId}/documents/${templateId}/generate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: documentModel,
            }),
          }
        )
        if (!response.ok) {
          throw new Error("Failed to generate document")
        }

        const payload = (await response.json()) as {
          sessionDocument: SessionDocumentRecord
        }

        const nextDocument = isRichTextDocument(payload.sessionDocument.contentJson)
          ? normalizeRichTextDocument(payload.sessionDocument.contentJson)
          : genericStructuredContentToRichTextDocument({
              contentJson: payload.sessionDocument.contentJson,
              schemaNodes:
                payload.sessionDocument.templateSchemaNodes ?? schemaNodes,
            })

        if (!documentHasMeaningfulContent(nextDocument)) {
          throw new Error("Generated document is empty")
        }

        upsertSessionDocument(payload.sessionDocument)
        setDraftDocument(nextDocument)
        lastSavedFingerprintRef.current = JSON.stringify(nextDocument)
        deleteCachedSession(activeSessionId)
        setSaveError(null)
        autoGenerateAttemptRef.current = null
        setSessionDocumentUiState(activeSessionId, templateId, {
          lastGenerationError: null,
          feedbackForGeneratedAt: null,
        })

        trackClientEvent({
          eventType: "analysis_completed",
          feature: "custom_document",
          sessionId: activeSessionId,
          metadata: {
            templateId,
            templateTitle: installedDocument.title,
            templateVersionId: payload.sessionDocument.templateVersionId,
            generatedAt: payload.sessionDocument.generatedAt,
            trigger,
          },
        })
      } catch (error) {
        console.error("Failed to generate document", error)
        const reason =
          error instanceof Error && error.message.trim()
            ? error.message
            : "request_error"
        setSessionDocumentUiState(activeSessionId, templateId, {
          lastGenerationError: "Failed to generate document",
        })
        trackClientEvent({
          eventType: "analysis_failed",
          feature: "custom_document",
          sessionId: activeSessionId,
          metadata: {
            templateId,
            templateTitle: installedDocument.title,
            templateVersionId:
              sessionDocument?.templateVersionId ?? installedDocument.installedVersionId,
            generatedAt: sessionDocument?.generatedAt ?? null,
            trigger,
            reason,
          },
        })
      } finally {
        setSessionDocumentUiState(activeSessionId, templateId, {
          isGenerating: false,
        })
      }
    },
    [
      activeSessionId,
      documentModel,
      documentUiState.isGenerating,
      installedDocument,
      schemaNodes,
      sessionDocument?.generatedAt,
      sessionDocument?.templateVersionId,
      setSessionDocumentUiState,
      templateId,
      upsertSessionDocument,
    ]
  )

  useEffect(() => {
    if (!activeSessionId || !installedDocument || !isActiveDocumentTab) return
    if (documentUiState.isGenerating) return

    const hasManualDraft =
      !!sessionDocument &&
      !sessionDocument.generatedAt &&
      hasMeaningfulCurrentContent &&
      !isStarterDocument

    const shouldAutoGenerate =
      !sessionDocument ||
      (!sessionDocument.generatedAt &&
        (!hasManualDraft || !hasMeaningfulCurrentContent || isStarterDocument))

    if (!shouldAutoGenerate) return

    const attemptKey = `${activeSessionId}:${templateId}`
    if (autoGenerateAttemptRef.current === attemptKey) return

    autoGenerateAttemptRef.current = attemptKey
    void handleGenerate("auto_open")
  }, [
    activeSessionId,
    documentUiState.isGenerating,
    handleGenerate,
    hasMeaningfulCurrentContent,
    installedDocument,
    isActiveDocumentTab,
    isStarterDocument,
    sessionDocument,
    templateId,
  ])

  const footerMeta = installedDocument ? (
    <>
      <span>
        v{sessionDocument?.templateVersionNumber ?? installedDocument.installedVersionNumber}
      </span>
      {sessionDocument?.generatedAt ? (
        <span>
          {tDocument("generatedAt", {
            value: formatDateTime(sessionDocument.generatedAt, locale, timeZone),
          })}
        </span>
      ) : null}
      {sessionDocument &&
      sessionDocument.templateVersionId !== installedDocument.installedVersionId ? (
        <span>{tDocument("updateAvailable")}</span>
      ) : null}
      {documentUiState.isSaving && !documentUiState.isGenerating ? (
        <span>{tDocument("saving")}</span>
      ) : null}
    </>
  ) : null

  const feedbackDisabled =
    !activeSessionId ||
    !sessionDocument?.generatedAt ||
    documentUiState.feedbackForGeneratedAt === sessionDocument.generatedAt

  const submitFeedback = (vote: "up" | "down") => {
    if (!activeSessionId || !installedDocument || !sessionDocument?.generatedAt) return

    trackClientEvent({
      eventType: "document_feedback_submitted",
      feature: "custom_document",
      sessionId: activeSessionId,
      metadata: {
        templateId,
        templateTitle: installedDocument.title,
        templateVersionId:
          sessionDocument.templateVersionId ?? installedDocument.installedVersionId,
        generatedAt: sessionDocument.generatedAt,
        vote,
      },
    })

    setSessionDocumentUiState(activeSessionId, templateId, {
      feedbackForGeneratedAt: sessionDocument.generatedAt,
    })
  }

  if (!activeSessionId) {
    return <DocumentShell empty emptyMessage={tDocument("startConsultation")} />
  }

  if (!installedDocument) {
    return <DocumentShell empty emptyMessage={tDocument("loading")} />
  }

  const hasVisibleDocument =
    !!draftDocument &&
    (!!sessionDocument?.generatedAt ||
      (documentHasMeaningfulContent(draftDocument) &&
        JSON.stringify(draftDocument) !== starterFingerprint))
  const ambientState = documentUiState.isGenerating
    ? sessionDocument?.generatedAt
      ? "updating"
      : "generating"
    : documentUiState.isSaving
      ? "saving"
      : "idle"
  const showFooterActions = hasVisibleDocument || !!documentUiState.lastGenerationError

  return (
    <DocumentShell
      ambientState={ambientState}
      loading={documentUiState.isGenerating && !hasVisibleDocument}
      loadingLabel={tDocument("updating")}
      error={documentUiState.lastGenerationError ?? saveError}
      empty={!hasVisibleDocument && !documentUiState.isGenerating}
      emptyMessage={tDocument("noContent")}
      footerMeta={footerMeta}
      footerActions={
        showFooterActions ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={documentUiState.isGenerating}
              onClick={() => {
                void handleGenerate(
                  sessionDocument?.generatedAt ? "regenerate" : "auto_open"
                )
              }}
            >
              {documentUiState.isGenerating ? (
                <span className="inline-flex items-center gap-2">
                  <IconLoader2 className="size-3.5 animate-spin" />
                  {tDocument("updating")}
                </span>
              ) : sessionDocument?.generatedAt ? (
                tDocument("regenerate")
              ) : (
                tDocument("generate")
              )}
            </Button>
            {sessionDocument?.generatedAt ? (
              <>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={feedbackDisabled}
                  aria-label={tDocument("feedbackPositive")}
                  title={tDocument("feedbackPositive")}
                  onClick={() => submitFeedback("up")}
                >
                  <IconThumbUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={feedbackDisabled}
                  aria-label={tDocument("feedbackNegative")}
                  title={tDocument("feedbackNegative")}
                  onClick={() => submitFeedback("down")}
                >
                  <IconThumbDown className="size-4" />
                </Button>
              </>
            ) : null}
          </div>
        ) : null
      }
    >
      {hasVisibleDocument && draftDocument ? (
        <DocumentEditor
          value={draftDocument}
          placeholder={tDocument("slashHint")}
          embedded
          toolbarMode="sticky"
          onChange={(nextValue) => {
            if (!activeSessionId || !installedDocument) return

            setDraftDocument(nextValue)
            setSaveError(null)

            upsertSessionDocument({
              id:
                sessionDocument?.id ??
                `draft:${activeSessionId}:${templateId}`,
              sessionId: activeSessionId,
              templateId,
              templateVersionId:
                sessionDocument?.templateVersionId ??
                installedDocument.installedVersionId,
              templateVersionNumber:
                sessionDocument?.templateVersionNumber ??
                installedDocument.installedVersionNumber,
              templateSchemaNodes:
                sessionDocument?.templateSchemaNodes ??
                installedDocument.installedVersionSchemaNodes,
              contentJson: nextValue as Record<string, unknown>,
              generatedAt: sessionDocument?.generatedAt ?? null,
              updatedAt: new Date().toISOString(),
            })
          }}
        />
      ) : null}
    </DocumentShell>
  )
}

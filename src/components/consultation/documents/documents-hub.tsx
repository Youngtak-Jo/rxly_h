"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  IconFilePlus,
  IconLoader2,
  IconSparkles,
} from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { DocumentPreviewCard } from "@/components/documents/document-preview-card"
import {
  hasSessionDocumentPreviewContent,
  SessionDocumentPreview,
} from "@/components/consultation/documents/session-document-preview"
import { DocumentSection } from "@/components/consultation/documents/document-shell"
import { StructuredDocumentContainer } from "@/components/consultation/documents/structured-document-container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { deleteCachedSession } from "@/hooks/use-session-loader"
import { getDocumentCategoryLabelKey } from "@/lib/documents/categories"
import { createEmptySessionDocumentGenerationInputs } from "@/lib/documents/generation-config"
import { getConfirmedDiagnosisRequirement } from "@/lib/documents/generation-requirements"
import { buildStarterRichTextDocument } from "@/lib/documents/rich-text"
import { ensureBlankDocumentPersisted } from "@/lib/consultation/blank-document"
import {
  BUILT_IN_BLANK_DOCUMENT_TEMPLATE_ID,
  buildDocumentTabId,
  getTemplateIdFromTabId,
} from "@/lib/documents/constants"
import { useConsultationDocumentsStore } from "@/stores/consultation-documents-store"
import { useDocumentWorkspaceStore } from "@/stores/document-workspace-store"
import { useSessionDocumentStore } from "@/stores/session-document-store"
import { useSessionStore } from "@/stores/session-store"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import type {
  InstalledDocumentSummary,
  SessionDocumentRecord,
} from "@/types/document"

async function readErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string }
    if (typeof payload?.error === "string" && payload.error.trim()) {
      return payload.error
    }
  } catch {
    // Ignore malformed error bodies.
  }

  return fallback
}

function BlankDocumentCardPreview({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex h-full items-center justify-center bg-white px-7 text-center dark:bg-transparent">
      <div className="flex max-w-[15rem] flex-col items-center gap-3">
        <div className="rounded-full border border-border/70 bg-background p-3">
          <IconFilePlus className="size-6 text-foreground/75" />
        </div>
        <p className="text-sm font-semibold tracking-[-0.01em] text-foreground">
          {title}
        </p>
        <p className="text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

function BlankDocumentCreateCard({
  title,
  description,
  onClick,
}: {
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <div className="group relative w-full">
      <button
        type="button"
        className="w-full cursor-pointer rounded-2xl text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onClick}
      >
        <div className="relative h-[16.25rem] overflow-hidden rounded-2xl border border-border/70 bg-white transition group-hover:border-border/90 dark:bg-card">
          <BlankDocumentCardPreview
            title={title}
            description={description}
          />
        </div>
      </button>
    </div>
  )
}

function PendingTemplateCardPreview({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-background/55 px-4 text-center">
      <div className="rounded-full border border-border/70 bg-background/90 p-2 shadow-sm">
        <IconSparkles className="size-5 text-foreground/75" />
      </div>
      <p className="mt-3 text-[11px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-[14rem] text-[10px] leading-[0.95rem] text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

export function DocumentsHub() {
  const t = useTranslations("ConsultationDocumentsHub")
  const tBuilder = useTranslations("DocumentBuilder")
  const tMeta = useTranslations("DocumentMetadata")
  const activeSession = useSessionStore((state) => state.activeSession)
  const activeSessionId = activeSession?.id ?? null
  const setActiveTab = useConsultationTabStore((state) => state.setActiveTab)
  const installedDocuments = useDocumentWorkspaceStore(
    (state) => state.installedDocuments
  )
  const tabOrder = useDocumentWorkspaceStore((state) => state.tabOrder)
  const uiState = useConsultationDocumentsStore((state) =>
    state.getSessionUiState(activeSessionId)
  )
  const syncSessionDocuments = useConsultationDocumentsStore(
    (state) => state.syncSessionDocuments
  )
  const openPicker = useConsultationDocumentsStore((state) => state.openPicker)
  const openDocument = useConsultationDocumentsStore((state) => state.openDocument)
  const sessionDocuments = useSessionDocumentStore((state) =>
    state.getSessionDocuments(activeSessionId)
  )
  const upsertSessionDocument = useSessionDocumentStore(
    (state) => state.upsertSessionDocument
  )
  const createOptimisticBlankDocument = useSessionDocumentStore(
    (state) => state.createOptimisticBlankDocument
  )
  const [actionKey, setActionKey] = useState<string | null>(null)

  const orderedDocuments = useMemo(() => {
    const installedByTemplateId = new Map(
      installedDocuments.map((document) => [document.templateId, document])
    )
    const templateIdsFromLayout = tabOrder
      .map((tabId) => getTemplateIdFromTabId(tabId))
      .filter((templateId): templateId is string => !!templateId)

    const orderedTemplateIds = [
      ...templateIdsFromLayout,
      ...installedDocuments
        .map((document) => document.templateId)
        .filter((templateId) => !templateIdsFromLayout.includes(templateId)),
    ]

    return orderedTemplateIds
      .map((templateId) => installedByTemplateId.get(templateId))
      .filter((document): document is InstalledDocumentSummary => !!document)
  }, [installedDocuments, tabOrder])

  const blankDocuments = useMemo(
    () =>
      sessionDocuments.filter(
        (document) => document.templateId === BUILT_IN_BLANK_DOCUMENT_TEMPLATE_ID
      ),
    [sessionDocuments]
  )

  const defaultTemplateDocuments = useMemo(() => {
    const map = new Map<string, SessionDocumentRecord>()
    for (const document of sessionDocuments) {
      if (document.instanceKey !== "default") continue
      map.set(document.templateId, document)
    }
    return map
  }, [sessionDocuments])

  useEffect(() => {
    if (!activeSessionId) return
    syncSessionDocuments(
      activeSessionId,
      sessionDocuments.map((document) => document.id)
    )
  }, [activeSessionId, sessionDocuments, syncSessionDocuments])

  const activeDocument =
    uiState.panelMode === "editor" && uiState.activeDocumentId
      ? sessionDocuments.find((document) => document.id === uiState.activeDocumentId) ??
        null
      : null

  useEffect(() => {
    if (
      !activeSessionId ||
      uiState.panelMode !== "editor" ||
      !uiState.activeDocumentId ||
      activeDocument ||
      uiState.activeDocumentId.startsWith("local:blank:")
    ) {
      return
    }

    openPicker(activeSessionId)
  }, [
    activeDocument,
    activeSessionId,
    openPicker,
    uiState.activeDocumentId,
    uiState.panelMode,
  ])

  const openExistingDocument = (documentId: string) => {
    if (!activeSessionId) return
    openDocument(activeSessionId, documentId)
    setActiveTab("documents")
  }

  const handleOpenTemplateCard = async (document: InstalledDocumentSummary) => {
    if (!activeSessionId || actionKey) return

    const existing = defaultTemplateDocuments.get(document.templateId)
    if (existing) {
      openExistingDocument(existing.id)
      return
    }

    setActionKey(`template:${document.templateId}`)
    try {
      const generationConfig = document.installedVersionGenerationConfig ?? null
      const confirmedDiagnosisRequirement = generationConfig
        ? getConfirmedDiagnosisRequirement(generationConfig)
        : null

      if (confirmedDiagnosisRequirement?.required) {
        const response = await fetch(
          `/api/sessions/${activeSessionId}/documents/${document.templateId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              templateVersionId: document.installedVersionId,
              contentJson: buildStarterRichTextDocument(
                document.installedVersionSchemaNodes ?? []
              ),
              generationInputs: createEmptySessionDocumentGenerationInputs(),
              generatedAt: null,
            }),
          }
        )

        if (!response.ok) {
          throw new Error(
            await readErrorMessage(response, t("errors.prepareTemplateFailed"))
          )
        }

        const payload = (await response.json()) as {
          sessionDocument: SessionDocumentRecord
        }
        upsertSessionDocument(payload.sessionDocument)
        openExistingDocument(payload.sessionDocument.id)
        deleteCachedSession(activeSessionId)
        return
      }

      const response = await fetch(
        `/api/sessions/${activeSessionId}/documents/${document.templateId}/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      )

      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, t("errors.generateTemplateFailed"))
        )
      }

      const payload = (await response.json()) as {
        sessionDocument: SessionDocumentRecord
      }
      upsertSessionDocument(payload.sessionDocument)
      openExistingDocument(payload.sessionDocument.id)
      deleteCachedSession(activeSessionId)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("errors.generateTemplateFailed")
      )
    } finally {
      setActionKey(null)
    }
  }

  if (!activeSessionId) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-4 lg:px-6">
        <div className="rounded-xl border border-dashed border-border/70 px-6 py-10 text-center text-sm text-muted-foreground">
          {t("startConsultation")}
        </div>
      </div>
    )
  }

  if (uiState.panelMode === "editor" && activeDocument) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-4 lg:px-6">
        <StructuredDocumentContainer
          documentId={activeDocument.id}
        />
      </div>
    )
  }

  return (
    <div className="@container/documents mx-auto w-full max-w-7xl px-4 py-4 lg:px-6">
      <DocumentSection
        title={t("pickerTitle")}
        description={t("pickerDescription")}
      >
        <div className="space-y-6">
          {orderedDocuments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 px-5 py-5 text-sm text-muted-foreground">
              <div className="space-y-3">
                <p>{t("emptyDescription")}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <span>{t("emptyHint")}</span>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/documents">{t("manageTemplates")}</Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-x-4 gap-y-7 @xl/documents:grid-cols-2 @4xl/documents:grid-cols-3">
            <BlankDocumentCreateCard
              title={t("blankDocumentTitle")}
              description={t("blankDocumentPreviewDescription")}
              onClick={() => {
                if (!activeSessionId) return

                const optimisticDocument = createOptimisticBlankDocument(
                  activeSessionId,
                  t("untitledBlankDocument")
                )
                openExistingDocument(optimisticDocument.id)
                void ensureBlankDocumentPersisted({
                  sessionId: activeSessionId,
                  documentId: optimisticDocument.id,
                  fallbackTitle: t("untitledBlankDocument"),
                  errorMessage: t("errors.createBlankFailed"),
                }).catch(() => {
                  // The editor will surface the non-blocking error.
                })
              }}
            />

            {blankDocuments.map((document) => (
              <DocumentPreviewCard
                key={document.id}
                title={document.title ?? t("untitledBlankDocument")}
                description={t("blankDocumentExistingDescription")}
                categoryLabel={tBuilder(
                  getDocumentCategoryLabelKey("general") as never
                )}
                languageLabel={tMeta("languages.en")}
                regionLabel={tMeta("regions.global")}
                preview={<SessionDocumentPreview document={document} />}
                previewHasContent={hasSessionDocumentPreviewContent(document)}
                authorName={t("sessionOnly")}
                installCountLabel={null}
                onClick={() => openExistingDocument(document.id)}
                titleTrailing={
                  <Badge variant="outline" className="ml-auto">
                    {t("blankDocumentBadge")}
                  </Badge>
                }
              />
            ))}

            {orderedDocuments.map((document) => {
              const sessionDocument =
                defaultTemplateDocuments.get(document.templateId) ?? null
              const categoryLabel = tBuilder(
                getDocumentCategoryLabelKey(document.category) as never
              )
              const languageLabel = tMeta(`languages.${document.language}` as never)
              const regionLabel = tMeta(`regions.${document.region}` as never)
              const isBusy = actionKey === `template:${document.templateId}`

              return (
                <DocumentPreviewCard
                  key={document.templateId}
                  title={document.title}
                  description={document.description}
                  categoryLabel={categoryLabel}
                  languageLabel={languageLabel}
                  regionLabel={regionLabel}
                  preview={
                    sessionDocument && hasSessionDocumentPreviewContent(sessionDocument) ? (
                      <SessionDocumentPreview document={sessionDocument} />
                    ) : (
                      <PendingTemplateCardPreview
                        title={t("pendingDocumentTitle")}
                        description={t("pendingDocumentDescription")}
                      />
                    )
                  }
                  previewHasContent={
                    !!sessionDocument && hasSessionDocumentPreviewContent(sessionDocument)
                  }
                  isBuiltIn={document.sourceKind === "BUILT_IN"}
                  authorName={document.authorName}
                  installCountLabel={null}
                  onClick={() => {
                    void handleOpenTemplateCard(document)
                  }}
                  titleTrailing={
                    isBusy ? (
                      <IconLoader2 className="ml-auto size-4 animate-spin text-muted-foreground" />
                    ) : tabOrder.includes(buildDocumentTabId(document.templateId)) ? (
                      <Badge variant="secondary" className="ml-auto">
                        {t("installedBadge")}
                      </Badge>
                    ) : null
                  }
                />
              )
            })}
          </div>
        </div>
      </DocumentSection>
    </div>
  )
}

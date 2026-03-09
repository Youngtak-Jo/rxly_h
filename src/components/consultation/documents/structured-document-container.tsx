"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  IconLoader2,
  IconThumbDown,
  IconThumbUp,
} from "@tabler/icons-react"
import { useLocale, useTimeZone, useTranslations } from "next-intl"
import { DiagnosisSelectionPanel } from "@/components/consultation/documents/diagnosis-selection-panel"
import { DocumentEditor } from "@/components/consultation/documents/document-editor"
import {
  DocumentSection,
  DocumentShell,
} from "@/components/consultation/documents/document-shell"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { deleteCachedSession } from "@/hooks/use-session-loader"
import {
  createEmptySessionDocumentGenerationInputs,
  resolveClinicalContextMode,
} from "@/lib/documents/generation-config"
import { getConfirmedDiagnosisRequirement } from "@/lib/documents/generation-requirements"
import {
  buildStarterRichTextDocument,
  genericStructuredContentToRichTextDocument,
  isRichTextDocument,
  normalizeRichTextDocument,
  type RichTextDocument,
} from "@/lib/documents/rich-text"
import { buildDocumentTabId } from "@/lib/documents/constants"
import { DEFAULT_UI_TIME_ZONE, type UiLocale } from "@/i18n/config"
import { formatDateTime } from "@/i18n/format"
import { trackClientEvent } from "@/lib/telemetry/client-events"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useDdxStore } from "@/stores/ddx-store"
import { useDocumentWorkspaceStore } from "@/stores/document-workspace-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useSessionDocumentStore } from "@/stores/session-document-store"
import { useSessionStore } from "@/stores/session-store"
import { useSettingsStore } from "@/stores/settings-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import type { DiagnosisSelectionItem } from "@/types/diagnosis-selection"
import type {
  DocumentClinicalContextMode,
  SessionDocumentGenerationInputs,
  SessionDocumentRecord,
} from "@/types/document"

interface SessionDocumentSaveResponse {
  sessionDocument: SessionDocumentRecord
  activeVersion: {
    id: string
    versionNumber: number
  }
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase()
}

function buildGenerationInputsFingerprint(
  generationInputs: SessionDocumentGenerationInputs | null | undefined
) {
  const normalized = generationInputs ?? createEmptySessionDocumentGenerationInputs()

  return JSON.stringify({
    clinicalContextMode: normalized.clinicalContextMode,
    confirmedDiagnoses: normalized.confirmedDiagnoses,
  })
}

function hasValidConfirmedDiagnosisSelection(
  generationInputs: SessionDocumentGenerationInputs | null,
  selectionMode: "single" | "multiple"
) {
  const selectedCount = generationInputs?.confirmedDiagnoses.length ?? 0
  if (selectionMode === "single") {
    return selectedCount === 1
  }

  return selectedCount > 0
}

function nodeHasMeaningfulContent(
  node: RichTextDocument | Record<string, unknown> | null | undefined
): boolean {
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

function documentHasMeaningfulContent(
  document: RichTextDocument | null | undefined
): boolean {
  if (!document) return false
  return Array.isArray(document.content) && document.content.some(nodeHasMeaningfulContent)
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
  const diagnoses = useDdxStore((state) => state.diagnoses)
  const insightsSummary = useInsightsStore((state) => state.summary)
  const insightsKeyFindings = useInsightsStore((state) => state.keyFindings)
  const insightsRedFlags = useInsightsStore((state) => state.redFlags)
  const insightsDiagnoses = useInsightsStore((state) => state.diagnoses)
  const transcriptEntries = useTranscriptStore((state) => state.entries)
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
  const generationConfig = useMemo(
    () => installedDocument?.installedVersionGenerationConfig ?? null,
    [installedDocument?.installedVersionGenerationConfig]
  )
  const confirmedDiagnosisRequirement = useMemo(
    () => (generationConfig ? getConfirmedDiagnosisRequirement(generationConfig) : null),
    [generationConfig]
  )
  const requiresConfirmedDiagnosis =
    confirmedDiagnosisRequirement?.required === true
  const confirmedDiagnosisSelectionMode =
    confirmedDiagnosisRequirement?.selectionMode ?? "single"

  const [draftDocument, setDraftDocument] = useState<RichTextDocument | null>(null)
  const [pendingGenerationInputs, setPendingGenerationInputs] =
    useState<SessionDocumentGenerationInputs>(
      createEmptySessionDocumentGenerationInputs()
    )
  const [showPreparationView, setShowPreparationView] = useState(false)
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
  const hasVisibleDocument =
    !!draftDocument &&
    (!!sessionDocument?.generatedAt ||
      (documentHasMeaningfulContent(draftDocument) &&
        JSON.stringify(draftDocument) !== starterFingerprint))
  const isActiveDocumentTab = activeTab === buildDocumentTabId(templateId)

  const selectedClinicalContextMode = useMemo(() => {
    if (!generationConfig) return "insights"
    return resolveClinicalContextMode({
      generationConfig,
      generationInputs: pendingGenerationInputs,
    })
  }, [generationConfig, pendingGenerationInputs])

  const insightsAvailable =
    insightsSummary.trim().length > 0 ||
    insightsKeyFindings.length > 0 ||
    insightsRedFlags.length > 0 ||
    insightsDiagnoses.length > 0
  const transcriptAvailable = transcriptEntries.length > 0
  const selectedClinicalSourceAvailable =
    selectedClinicalContextMode === "transcript"
      ? transcriptAvailable
      : insightsAvailable

  useEffect(() => {
    if (!activeSessionId) {
      hydrationSignatureRef.current = null
      lastSavedFingerprintRef.current = null
      autoGenerateAttemptRef.current = null
      setDraftDocument(null)
      setPendingGenerationInputs(createEmptySessionDocumentGenerationInputs())
      setShowPreparationView(false)
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

    const nextGenerationInputs =
      sessionDocument?.generationInputs ?? createEmptySessionDocumentGenerationInputs()
    setPendingGenerationInputs(nextGenerationInputs)
    setShowPreparationView(
      requiresConfirmedDiagnosis &&
        (!sessionDocument?.generatedAt ||
          !hasValidConfirmedDiagnosisSelection(
            nextGenerationInputs,
            confirmedDiagnosisSelectionMode
          ))
    )
    setSaveError(null)

    if (sessionDocument?.generatedAt) {
      autoGenerateAttemptRef.current = null
    }
  }, [
    activeSessionId,
    confirmedDiagnosisSelectionMode,
    currentDocument,
    installedDocument?.installedVersionId,
    requiresConfirmedDiagnosis,
    sessionDocument?.generatedAt,
    sessionDocument?.generationInputs,
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
              generationInputs: pendingGenerationInputs,
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
    pendingGenerationInputs,
    sessionDocument?.generatedAt,
    sessionDocument?.templateVersionId,
    setSessionDocumentUiState,
    templateId,
    upsertSessionDocument,
  ])

  useEffect(() => {
    if (!activeSessionId || !installedDocument) {
      return
    }

    const pendingFingerprint = buildGenerationInputsFingerprint(
      pendingGenerationInputs
    )
    const savedFingerprint = buildGenerationInputsFingerprint(
      sessionDocument?.generationInputs
    )
    if (pendingFingerprint === savedFingerprint) {
      return
    }

    if (
      !sessionDocument &&
      pendingFingerprint ===
        buildGenerationInputsFingerprint(
          createEmptySessionDocumentGenerationInputs()
        )
    ) {
      return
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/sessions/${activeSessionId}/documents/${templateId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              templateVersionId:
                sessionDocument?.templateVersionId ??
                installedDocument.installedVersionId,
              contentJson: draftDocument ?? starterDocument,
              generationInputs: pendingGenerationInputs,
              generatedAt: null,
            }),
          }
        )

        if (!response.ok) {
          throw new Error("Failed to save document inputs")
        }

        const payload = (await response.json()) as SessionDocumentSaveResponse
        upsertSessionDocument(payload.sessionDocument)
        deleteCachedSession(activeSessionId)
      } catch (error) {
        console.error("Failed to save document generation inputs", error)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [
    activeSessionId,
    draftDocument,
    installedDocument,
    pendingGenerationInputs,
    sessionDocument,
    starterDocument,
    templateId,
    upsertSessionDocument,
  ])

  const handleGenerate = useCallback(
    async (
      trigger: "auto_open" | "regenerate",
      generationInputsOverride?: SessionDocumentGenerationInputs | null
    ) => {
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
              generationInputs: generationInputsOverride,
            }),
          }
        )

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as {
            error?: string
          }
          throw new Error(payload.error || "Failed to generate document")
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
        setPendingGenerationInputs(
          payload.sessionDocument.generationInputs ??
            createEmptySessionDocumentGenerationInputs()
        )
        setShowPreparationView(false)
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
          lastGenerationError: reason,
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
    if (requiresConfirmedDiagnosis) return
    if (!selectedClinicalSourceAvailable) return

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

    const attemptKey = `${activeSessionId}:${templateId}:${selectedClinicalContextMode}`
    if (autoGenerateAttemptRef.current === attemptKey) return

    autoGenerateAttemptRef.current = attemptKey
    void handleGenerate("auto_open", pendingGenerationInputs)
  }, [
    activeSessionId,
    documentUiState.isGenerating,
    handleGenerate,
    hasMeaningfulCurrentContent,
    installedDocument,
    isActiveDocumentTab,
    isStarterDocument,
    pendingGenerationInputs,
    requiresConfirmedDiagnosis,
    selectedClinicalContextMode,
    selectedClinicalSourceAvailable,
    sessionDocument,
    templateId,
  ])

  const conditionItems = useMemo(() => {
    const byCode = new Map<string, DiagnosisSelectionItem>()

    diagnoses.forEach((diagnosis) => {
      const key = normalizeCode(diagnosis.icdCode)
      if (byCode.has(key)) return
      byCode.set(key, {
        id: diagnosis.id,
        icdCode: diagnosis.icdCode,
        diseaseName: diagnosis.diseaseName,
        source: "ddx",
        evidence: diagnosis.evidence,
        confidence: diagnosis.confidence,
      })
    })

    pendingGenerationInputs.confirmedDiagnoses.forEach((diagnosis) => {
      if (diagnosis.source !== "icd11") return
      const key = normalizeCode(diagnosis.icdCode)
      if (byCode.has(key)) return
      byCode.set(key, {
        ...diagnosis,
        evidence: tDocument("sourceIcd11"),
      })
    })

    return Array.from(byCode.values())
  }, [diagnoses, pendingGenerationInputs.confirmedDiagnoses, tDocument])

  const generationInputsDirty =
    buildGenerationInputsFingerprint(pendingGenerationInputs) !==
    buildGenerationInputsFingerprint(sessionDocument?.generationInputs)
  const hasValidPendingSelection = hasValidConfirmedDiagnosisSelection(
    pendingGenerationInputs,
    confirmedDiagnosisSelectionMode
  )
  const documentIsStale = hasVisibleDocument && !sessionDocument?.generatedAt
  const showPreparationPanel =
    requiresConfirmedDiagnosis && (showPreparationView || !hasVisibleDocument)
  const showInitialSetupPanel =
    !requiresConfirmedDiagnosis &&
    !hasVisibleDocument &&
    !documentUiState.isGenerating
  const showSetupPanel = showPreparationPanel || showInitialSetupPanel
  const showStaleNotice = hasVisibleDocument && (generationInputsDirty || documentIsStale)

  const canGenerate =
    selectedClinicalSourceAvailable &&
    (!requiresConfirmedDiagnosis || hasValidPendingSelection)

  const sourceHint =
    selectedClinicalContextMode === "transcript"
      ? tDocument("clinicalBasisTranscriptHint")
      : tDocument("clinicalBasisInsightsHint")
  const sourceNotReadyMessage =
    selectedClinicalContextMode === "transcript"
      ? tDocument("clinicalBasisTranscriptUnavailable")
      : tDocument("clinicalBasisInsightsUnavailable")

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

  const renderClinicalBasisSection = (compact = false) => (
    <DocumentSection
      title={tDocument("clinicalBasisTitle")}
      description={sourceHint}
      className={compact ? "space-y-2" : undefined}
    >
      <div className="space-y-3 rounded-lg border px-4 py-4">
        <ToggleGroup
          type="single"
          value={selectedClinicalContextMode}
          onValueChange={(value) => {
            if (!value || !generationConfig) return

            const nextMode = value as DocumentClinicalContextMode
            setPendingGenerationInputs((currentInputs) => ({
              ...currentInputs,
              clinicalContextMode:
                nextMode === generationConfig.clinicalContextDefault
                  ? null
                  : nextMode,
            }))
          }}
          variant="outline"
          className="w-full justify-start"
        >
          <ToggleGroupItem value="insights">
            {tDocument("clinicalBasisInsights")}
          </ToggleGroupItem>
          <ToggleGroupItem value="transcript">
            {tDocument("clinicalBasisTranscript")}
          </ToggleGroupItem>
        </ToggleGroup>

        {!selectedClinicalSourceAvailable ? (
          <div className="rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            {sourceNotReadyMessage}
          </div>
        ) : null}
      </div>
    </DocumentSection>
  )

  if (!activeSessionId) {
    return <DocumentShell empty emptyMessage={tDocument("startConsultation")} />
  }

  if (!installedDocument || !generationConfig) {
    return <DocumentShell empty emptyMessage={tDocument("loading")} />
  }

  const ambientState = documentUiState.isGenerating
    ? sessionDocument?.generatedAt
      ? "updating"
      : "generating"
    : documentUiState.isSaving
      ? "saving"
      : "idle"
  const showFooterActions =
    hasVisibleDocument ||
    !!documentUiState.lastGenerationError ||
    showSetupPanel

  return (
    <DocumentShell
      topActions={
        showPreparationPanel && hasVisibleDocument ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-3 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPreparationView(false)}
          >
            {tDocument("backToDocument")}
          </Button>
        ) : requiresConfirmedDiagnosis && hasVisibleDocument ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-3 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPreparationView(true)}
          >
            {tDocument("changeDiagnosis")}
          </Button>
        ) : null
      }
      notice={
        showStaleNotice ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            {tDocument("generationSettingsStale")}
          </div>
        ) : null
      }
      ambientState={ambientState}
      loading={documentUiState.isGenerating && !hasVisibleDocument}
      loadingLabel={tDocument("updating")}
      error={documentUiState.lastGenerationError ?? saveError}
      empty={false}
      footerMeta={footerMeta}
      footerActions={
        showFooterActions ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={hasVisibleDocument ? "outline" : "default"}
              disabled={documentUiState.isGenerating || !canGenerate}
              onClick={() => {
                void handleGenerate(
                  sessionDocument?.generatedAt ? "regenerate" : "auto_open",
                  pendingGenerationInputs
                )
              }}
            >
              {documentUiState.isGenerating ? (
                <span className="inline-flex items-center gap-2">
                  <IconLoader2 className="size-3.5 animate-spin" />
                  {tDocument("updating")}
                </span>
              ) : hasVisibleDocument ? (
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
      {showSetupPanel ? (
        <>
          {renderClinicalBasisSection()}
          {requiresConfirmedDiagnosis ? (
            <DocumentSection
              title={tDocument("confirmedDiagnosesTitle")}
              description={tDocument(
                confirmedDiagnosisSelectionMode === "multiple"
                  ? "confirmedDiagnosesDescriptionMultiple"
                  : "confirmedDiagnosesDescriptionSingle"
              )}
            >
              <DiagnosisSelectionPanel
                items={conditionItems}
                selectedConditions={pendingGenerationInputs.confirmedDiagnoses}
                selectionMode={confirmedDiagnosisSelectionMode}
                allowIcd11Search={
                  confirmedDiagnosisRequirement?.allowIcd11Search ?? true
                }
                emptyState={tDocument("confirmedDiagnosesEmptyState")}
                openIcdSearchLabel={tDocument("openIcd11Search")}
                icdSearchLabel={tDocument("icd11Search")}
                searchTitle={tDocument("searchIcd11Condition")}
                searchDescription={tDocument("searchDescription")}
                searchPlaceholder={tDocument("searchPlaceholder")}
                searchNoResults={tDocument("searchNoResults")}
                searchingLabel={tDocument("searching")}
                selectConditionAriaLabel={(name) =>
                  tDocument("selectConfirmedDiagnosis", { name })
                }
                onChange={(nextConditions) => {
                  setPendingGenerationInputs((currentInputs) => ({
                    ...currentInputs,
                    confirmedDiagnoses: nextConditions,
                  }))
                }}
              />
            </DocumentSection>
          ) : null}
        </>
      ) : hasVisibleDocument && draftDocument ? (
        <>
          {renderClinicalBasisSection(true)}
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
                id: sessionDocument?.id ?? `draft:${activeSessionId}:${templateId}`,
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
                generationInputs: pendingGenerationInputs,
                generatedAt: sessionDocument?.generatedAt ?? null,
                updatedAt: new Date().toISOString(),
              })
            }}
          />
        </>
      ) : (
        <DocumentSection
          title={tDocument("clinicalBasisTitle")}
          description={sourceHint}
        >
          {!selectedClinicalSourceAvailable ? (
            <div className="rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              {sourceNotReadyMessage}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {tDocument("noContent")}
            </p>
          )}
        </DocumentSection>
      )}
    </DocumentShell>
  )
}

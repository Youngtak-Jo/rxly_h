"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  IconChevronLeft,
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
import { Input } from "@/components/ui/input"
import { deleteCachedSession } from "@/hooks/use-session-loader"
import {
  ensureBlankDocumentPersisted,
  shouldPersistBlankDocumentDraft,
} from "@/lib/consultation/blank-document"
import {
  BUILT_IN_BLANK_DOCUMENT_TEMPLATE_ID,
  BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID,
  BUILT_IN_RECORD_TEMPLATE_ID,
} from "@/lib/documents/constants"
import {
  createEmptySessionDocumentGenerationInputs,
} from "@/lib/documents/generation-config"
import { getConfirmedDiagnosisRequirement } from "@/lib/documents/generation-requirements"
import {
  buildStarterRichTextDocument,
  emptyRichTextDocument,
  genericStructuredContentToRichTextDocument,
  isRichTextDocument,
  normalizeRichTextDocument,
  type RichTextDocument,
} from "@/lib/documents/rich-text"
import { DEFAULT_UI_TIME_ZONE, type UiLocale } from "@/i18n/config"
import { formatDateTime } from "@/i18n/format"
import { trackClientEvent } from "@/lib/telemetry/client-events"
import { useConsultationDocumentsStore } from "@/stores/consultation-documents-store"
import { useDdxStore } from "@/stores/ddx-store"
import { useDocumentWorkspaceStore } from "@/stores/document-workspace-store"
import { useActiveConsultationDocumentDraftStore } from "@/stores/active-consultation-document-draft-store"
import { useSessionDocumentStore } from "@/stores/session-document-store"
import { useSessionStore } from "@/stores/session-store"
import { useSettingsStore } from "@/stores/settings-store"
import type { DiagnosisSelectionItem } from "@/types/diagnosis-selection"
import type {
  SessionDocumentGenerationInputs,
  SessionDocumentRecord,
} from "@/types/document"

interface SessionDocumentSaveResponse {
  sessionDocument: SessionDocumentRecord
}

const pendingPristineBlankDiscardTimers = new Map<
  string,
  ReturnType<typeof setTimeout>
>()

function cancelPendingPristineBlankDiscard(key: string | null) {
  if (!key) return
  const timer = pendingPristineBlankDiscardTimers.get(key)
  if (!timer) return
  clearTimeout(timer)
  pendingPristineBlankDiscardTimers.delete(key)
}

function schedulePendingPristineBlankDiscard(
  key: string,
  discard: () => void
) {
  cancelPendingPristineBlankDiscard(key)
  const timer = setTimeout(() => {
    pendingPristineBlankDiscardTimers.delete(key)
    discard()
  }, 0)
  pendingPristineBlankDiscardTimers.set(key, timer)
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase()
}

function buildGenerationInputsFingerprint(
  generationInputs: SessionDocumentGenerationInputs | null | undefined
) {
  const normalized = generationInputs ?? createEmptySessionDocumentGenerationInputs()

  return JSON.stringify({
    confirmedDiagnoses: normalized.confirmedDiagnoses,
  })
}

function buildSaveFingerprint(args: {
  document: RichTextDocument
  generationInputs: SessionDocumentGenerationInputs
  title?: string | null
  generatedAt?: string | null
}) {
  return JSON.stringify({
    document: args.document,
    generationInputs: args.generationInputs,
    title: args.title?.trim() || null,
    generatedAt: args.generatedAt ?? null,
  })
}

function buildHydrationSignature(args: {
  sessionId: string
  sessionDocument: SessionDocumentRecord
}) {
  return [
    args.sessionId,
    args.sessionDocument.id,
    args.sessionDocument.updatedAt,
    args.sessionDocument.templateVersionId,
    args.sessionDocument.title ?? "",
    args.sessionDocument.generatedAt ?? "",
    JSON.stringify(args.sessionDocument.contentJson ?? null),
  ].join(":")
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
  schemaNodes: SessionDocumentRecord["templateSchemaNodes"],
  blankDocument: boolean
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

  return blankDocument
    ? emptyRichTextDocument()
    : buildStarterRichTextDocument(schemaNodes ?? [])
}

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

export function StructuredDocumentContainer({
  documentId,
}: {
  documentId: string
}) {
  const tDocument = useTranslations("ConsultationDocument")
  const tHub = useTranslations("ConsultationDocumentsHub")
  const locale = useLocale() as UiLocale
  const timeZone = useTimeZone() ?? DEFAULT_UI_TIME_ZONE
  const activeSession = useSessionStore((state) => state.activeSession)
  const diagnoses = useDdxStore((state) => state.diagnoses)
  const installedDocuments = useDocumentWorkspaceStore((state) => state.installedDocuments)
  const activeSessionId = activeSession?.id ?? null
  const sessionDocument = useSessionDocumentStore((state) =>
    state.getSessionDocumentById(activeSessionId, documentId)
  )
  const documentUiState = useSessionDocumentStore((state) =>
    state.getSessionDocumentUiState(activeSessionId, documentId)
  )
  const upsertSessionDocument = useSessionDocumentStore(
    (state) => state.upsertSessionDocument
  )
  const removeSessionDocument = useSessionDocumentStore(
    (state) => state.removeSessionDocument
  )
  const setSessionDocumentUiState = useSessionDocumentStore(
    (state) => state.setSessionDocumentUiState
  )
  const openPicker = useConsultationDocumentsStore((state) => state.openPicker)
  const documentModel = useSettingsStore((state) => state.aiModel.documentModel)

  const installedDocument = useMemo(
    () =>
      sessionDocument
        ? installedDocuments.find(
            (document) => document.templateId === sessionDocument.templateId
          ) ?? null
        : null,
    [installedDocuments, sessionDocument]
  )
  const isBlankDocument =
    sessionDocument?.templateId === BUILT_IN_BLANK_DOCUMENT_TEMPLATE_ID
  const generationConfig = useMemo(
    () => (isBlankDocument ? null : installedDocument?.installedVersionGenerationConfig ?? null),
    [installedDocument?.installedVersionGenerationConfig, isBlankDocument]
  )
  const confirmedDiagnosisRequirement = useMemo(
    () => (generationConfig ? getConfirmedDiagnosisRequirement(generationConfig) : null),
    [generationConfig]
  )
  const hasConfirmedDiagnosisRequirement = !!confirmedDiagnosisRequirement
  const requiresConfirmedDiagnosis =
    confirmedDiagnosisRequirement?.required === true
  const confirmedDiagnosisSelectionMode =
    confirmedDiagnosisRequirement?.selectionMode ?? "single"

  const [pendingGenerationInputs, setPendingGenerationInputs] =
    useState<SessionDocumentGenerationInputs>(
      createEmptySessionDocumentGenerationInputs()
    )
  const [showPreparationView, setShowPreparationView] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const hydrationSignatureRef = useRef<string | null>(null)
  const lastSavedFingerprintRef = useRef<string | null>(null)
  const lastGeneratedInputsFingerprintRef = useRef<string | null>(null)
  const lastBlankPersistenceRequestRef = useRef<string | null>(null)
  const skipAutosaveForSignatureRef = useRef<string | null>(null)
  const activeDraft = useActiveConsultationDocumentDraftStore((state) =>
    state.getDraft(activeSessionId, documentId)
  )
  const hydrateActiveDraft = useActiveConsultationDocumentDraftStore(
    (state) => state.hydrateDraft
  )
  const patchActiveDraft = useActiveConsultationDocumentDraftStore(
    (state) => state.patchDraft
  )
  const clearActiveDraft = useActiveConsultationDocumentDraftStore(
    (state) => state.clearDocument
  )

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
    () =>
      isBlankDocument
        ? emptyRichTextDocument()
        : buildStarterRichTextDocument(schemaNodes),
    [isBlankDocument, schemaNodes]
  )
  const currentDocument = useMemo(
    () => toRichTextDocument(sessionDocument, schemaNodes, !!isBlankDocument),
    [isBlankDocument, schemaNodes, sessionDocument]
  )
  const starterFingerprint = useMemo(
    () => JSON.stringify(starterDocument),
    [starterDocument]
  )
  const draftDocument = activeDraft?.draftDocument ?? null
  const draftTitle = activeDraft?.draftTitle ?? ""
  const isStreaming = activeDraft?.isStreaming ?? false
  const isFinalReconcilePending = activeDraft?.finalReconcilePending === true
  const pristineBlankDiscardKey =
    activeSessionId && sessionDocument
      ? `${activeSessionId}:${sessionDocument.id}`
      : null
  const latestBlankDraftRef = useRef({
    activeSessionId,
    sessionDocument,
    draftDocument,
    draftTitle,
    isBlankDocument,
  })
  latestBlankDraftRef.current = {
    activeSessionId,
    sessionDocument,
    draftDocument,
    draftTitle,
    isBlankDocument,
  }
  const hasVisibleDocument =
    !!draftDocument &&
    (isBlankDocument
      ? true
      : !!sessionDocument?.generatedAt ||
        (documentHasMeaningfulContent(draftDocument) &&
          JSON.stringify(draftDocument) !== starterFingerprint))
  const shouldShowPreparationByDefault =
    !isBlankDocument &&
    hasConfirmedDiagnosisRequirement &&
    !sessionDocument?.generatedAt &&
    !documentHasMeaningfulContent(currentDocument)
  const hydrationSignature =
    activeSessionId && sessionDocument
      ? buildHydrationSignature({
          sessionId: activeSessionId,
          sessionDocument,
        })
      : null

  const discardPristineBlankDocument = useCallback(() => {
    const snapshot = latestBlankDraftRef.current
    if (
      !snapshot.activeSessionId ||
      !snapshot.sessionDocument?.localOnly ||
      !snapshot.isBlankDocument
    ) {
      return
    }

    if (
      shouldPersistBlankDocumentDraft({
        title: snapshot.draftTitle,
        document: snapshot.draftDocument,
      })
    ) {
      return
    }

    clearActiveDraft(snapshot.activeSessionId, snapshot.sessionDocument.id)
    removeSessionDocument(snapshot.activeSessionId, snapshot.sessionDocument.id)
  }, [clearActiveDraft, removeSessionDocument])

  useEffect(() => {
    cancelPendingPristineBlankDiscard(pristineBlankDiscardKey)
  }, [pristineBlankDiscardKey])

  useEffect(() => {
    return () => {
      if (!pristineBlankDiscardKey) return
      // Defer discarding so a Strict Mode remount can cancel it.
      schedulePendingPristineBlankDiscard(
        pristineBlankDiscardKey,
        discardPristineBlankDocument
      )
    }
  }, [discardPristineBlankDocument, pristineBlankDiscardKey])

  useEffect(() => {
    if (!activeSessionId || !sessionDocument) {
      hydrationSignatureRef.current = null
      lastSavedFingerprintRef.current = null
      lastGeneratedInputsFingerprintRef.current = null
      setPendingGenerationInputs(createEmptySessionDocumentGenerationInputs())
      setShowPreparationView(false)
      setSaveError(null)
      skipAutosaveForSignatureRef.current = null
      return
    }

    if (!hydrationSignature || hydrationSignatureRef.current === hydrationSignature) {
      return
    }

    hydrationSignatureRef.current = hydrationSignature
    skipAutosaveForSignatureRef.current = hydrationSignature
    const nextTitle = sessionDocument.title ?? installedDocument?.title ?? ""
    const nextGenerationInputs = {
      ...(sessionDocument.generationInputs ??
        createEmptySessionDocumentGenerationInputs()),
      clinicalContextMode: null,
    }
    if (
      !activeDraft ||
      (!activeDraft.dirty &&
        !activeDraft.isStreaming &&
        !activeDraft.finalReconcilePending)
    ) {
      hydrateActiveDraft({
        sessionId: activeSessionId,
        documentId: sessionDocument.id,
        draftDocument: currentDocument,
        draftTitle: nextTitle,
        isStreaming: false,
        streamRequestId: null,
        dirty: false,
        lastPersistedRevision: hydrationSignature,
        sanitizedHtmlBuffer: "",
        lastRenderableDocument: currentDocument,
        finalReconcilePending: false,
      })
    }
    setPendingGenerationInputs(nextGenerationInputs)
    setShowPreparationView(shouldShowPreparationByDefault)
    setSaveError(null)
    lastSavedFingerprintRef.current = sessionDocument.needsSync
      ? null
      : buildSaveFingerprint({
          document: currentDocument,
          generationInputs: nextGenerationInputs,
          title: sessionDocument.title,
          generatedAt: sessionDocument.generatedAt,
        })
    lastGeneratedInputsFingerprintRef.current = sessionDocument.generatedAt
      ? buildGenerationInputsFingerprint(sessionDocument.generationInputs)
      : null
  }, [
    activeSessionId,
    activeDraft,
    currentDocument,
    hydrateActiveDraft,
    hydrationSignature,
    installedDocument?.title,
    sessionDocument,
    shouldShowPreparationByDefault,
  ])

  useEffect(() => {
    if (!activeSessionId || !sessionDocument || !draftDocument) return

    if (sessionDocument.localOnly) {
      if (
        !shouldPersistBlankDocumentDraft({
          title: draftTitle,
          document: draftDocument,
        })
      ) {
        return
      }

      const persistenceFingerprint = JSON.stringify({
        documentId: sessionDocument.id,
        title: draftTitle.trim() || null,
        document: draftDocument,
      })

      if (
        !sessionDocument.pendingCreate &&
        lastBlankPersistenceRequestRef.current !== persistenceFingerprint
      ) {
        lastBlankPersistenceRequestRef.current = persistenceFingerprint
        void ensureBlankDocumentPersisted({
          sessionId: activeSessionId,
          documentId: sessionDocument.id,
          fallbackTitle: draftTitle.trim() || tHub("untitledBlankDocument"),
          errorMessage: tHub("errors.createBlankFailed"),
        }).catch(() => {
          // Keep the editor open and surface the error inline.
        })
      }
      return
    }

    lastBlankPersistenceRequestRef.current = null

    if (documentUiState.isGenerating || isStreaming || isFinalReconcilePending) {
      return
    }

    if (
      hydrationSignature &&
      skipAutosaveForSignatureRef.current === hydrationSignature
    ) {
      skipAutosaveForSignatureRef.current = null
      return
    }

    const nextFingerprint = buildSaveFingerprint({
      document: draftDocument,
      generationInputs: pendingGenerationInputs,
      title: isBlankDocument ? draftTitle : sessionDocument.title,
      generatedAt: sessionDocument.generatedAt,
    })
    if (lastSavedFingerprintRef.current === nextFingerprint) {
      return
    }

    const timer = setTimeout(async () => {
      try {
        setSessionDocumentUiState(activeSessionId, sessionDocument.id, {
          isSaving: true,
        })

        const body: Record<string, unknown> = {
          templateVersionId: sessionDocument.templateVersionId,
          contentJson: draftDocument,
          generationInputs: pendingGenerationInputs,
        }
        if (sessionDocument.generatedAt) {
          body.generatedAt = sessionDocument.generatedAt
        }
        if (isBlankDocument) {
          body.title = draftTitle.trim() || null
        }

        const response = await fetch(
          `/api/sessions/${activeSessionId}/documents/by-id/${sessionDocument.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        )

        if (!response.ok) {
          throw new Error(
            await readErrorMessage(response, "Failed to save document")
          )
        }

        const payload = (await response.json()) as SessionDocumentSaveResponse
        const nextRevision = buildHydrationSignature({
          sessionId: activeSessionId,
          sessionDocument: payload.sessionDocument,
        })
        const nextDocument = normalizeRichTextDocument(payload.sessionDocument.contentJson)
        lastSavedFingerprintRef.current = buildSaveFingerprint({
          document: nextDocument,
          generationInputs:
            payload.sessionDocument.generationInputs ??
            createEmptySessionDocumentGenerationInputs(),
          title: payload.sessionDocument.title,
          generatedAt: payload.sessionDocument.generatedAt,
        })
        hydrateActiveDraft({
          sessionId: activeSessionId,
          documentId: payload.sessionDocument.id,
          draftDocument: nextDocument,
          draftTitle: payload.sessionDocument.title ?? installedDocument?.title ?? "",
          isStreaming: false,
          streamRequestId: null,
          dirty: false,
          lastPersistedRevision: nextRevision,
          sanitizedHtmlBuffer: "",
          lastRenderableDocument: nextDocument,
          finalReconcilePending: false,
        })
        upsertSessionDocument(payload.sessionDocument)
        deleteCachedSession(activeSessionId)
        setSaveError(null)
      } catch (error) {
        console.error("Failed to autosave document", error)
        setSaveError(
          error instanceof Error && error.message
            ? error.message
            : "Failed to save document"
        )
      } finally {
        setSessionDocumentUiState(activeSessionId, sessionDocument.id, {
          isSaving: false,
        })
      }
    }, 700)

    return () => clearTimeout(timer)
  }, [
    activeSessionId,
    draftDocument,
    draftTitle,
    documentUiState.isGenerating,
    hydrateActiveDraft,
    hydrationSignature,
    installedDocument?.title,
    isStreaming,
    isBlankDocument,
    isFinalReconcilePending,
    pendingGenerationInputs,
    sessionDocument,
    setSessionDocumentUiState,
    tHub,
    upsertSessionDocument,
  ])

  const handleGenerate = useCallback(
    async (
      trigger: "manual_generate" | "regenerate",
      generationInputsOverride?: SessionDocumentGenerationInputs | null
    ) => {
      if (
        !activeSessionId ||
        !sessionDocument ||
        !installedDocument ||
        !generationConfig ||
        documentUiState.isGenerating
      ) {
        return
      }

      setSessionDocumentUiState(activeSessionId, sessionDocument.id, {
        isGenerating: true,
        lastGenerationError: null,
      })

      trackClientEvent({
        eventType: "analysis_triggered",
        feature: "custom_document",
        sessionId: activeSessionId,
        metadata: {
          templateId: sessionDocument.templateId,
          templateTitle: installedDocument.title,
          templateVersionId: sessionDocument.templateVersionId,
          generatedAt: sessionDocument.generatedAt ?? null,
          trigger,
        },
      })

      try {
        const response = await fetch(
          `/api/sessions/${activeSessionId}/documents/${sessionDocument.templateId}/generate`,
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
          throw new Error(
            await readErrorMessage(response, "Failed to generate document")
          )
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

        upsertSessionDocument(payload.sessionDocument)
        hydrateActiveDraft({
          sessionId: activeSessionId,
          documentId: payload.sessionDocument.id,
          draftDocument: nextDocument,
          draftTitle: payload.sessionDocument.title ?? installedDocument.title,
          isStreaming: false,
          streamRequestId: null,
          dirty: false,
          lastPersistedRevision: buildHydrationSignature({
            sessionId: activeSessionId,
            sessionDocument: payload.sessionDocument,
          }),
          sanitizedHtmlBuffer: "",
          lastRenderableDocument: nextDocument,
          finalReconcilePending: false,
        })
        setPendingGenerationInputs(
          payload.sessionDocument.generationInputs ??
            createEmptySessionDocumentGenerationInputs()
        )
        setShowPreparationView(false)
        lastSavedFingerprintRef.current = buildSaveFingerprint({
          document: nextDocument,
          generationInputs:
            payload.sessionDocument.generationInputs ??
            createEmptySessionDocumentGenerationInputs(),
          title: payload.sessionDocument.title,
          generatedAt: payload.sessionDocument.generatedAt,
        })
        lastGeneratedInputsFingerprintRef.current = buildGenerationInputsFingerprint(
          payload.sessionDocument.generationInputs
        )
        deleteCachedSession(activeSessionId)
        setSaveError(null)
        setSessionDocumentUiState(activeSessionId, sessionDocument.id, {
          lastGenerationError: null,
          feedbackForGeneratedAt: null,
        })
      } catch (error) {
        console.error("Failed to generate document", error)
        const reason =
          error instanceof Error && error.message.trim()
            ? error.message
            : "request_error"
        setSessionDocumentUiState(activeSessionId, sessionDocument.id, {
          lastGenerationError: reason,
        })
      } finally {
        setSessionDocumentUiState(activeSessionId, sessionDocument.id, {
          isGenerating: false,
        })
      }
    },
    [
      activeSessionId,
      documentModel,
      documentUiState.isGenerating,
      generationConfig,
      hydrateActiveDraft,
      installedDocument,
      schemaNodes,
      sessionDocument,
      setSessionDocumentUiState,
      upsertSessionDocument,
    ]
  )

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

  if (!activeSessionId) {
    return <DocumentShell empty emptyMessage={tDocument("startConsultation")} />
  }

  if (!sessionDocument) {
    return <DocumentShell empty emptyMessage={tDocument("loading")} />
  }

  if (!isBlankDocument && (!installedDocument || !generationConfig)) {
    return <DocumentShell empty emptyMessage={tDocument("loading")} />
  }

  const hasValidPendingSelection = hasValidConfirmedDiagnosisSelection(
    pendingGenerationInputs,
    confirmedDiagnosisSelectionMode
  )
  const showSetupPanel =
    !isBlankDocument &&
    (showPreparationView || (!hasVisibleDocument && !documentUiState.isGenerating))
  const showStaleNotice =
    !isBlankDocument &&
    hasVisibleDocument &&
    !!lastGeneratedInputsFingerprintRef.current &&
    buildGenerationInputsFingerprint(pendingGenerationInputs) !==
      lastGeneratedInputsFingerprintRef.current

  const canGenerate =
    !!generationConfig &&
    (!requiresConfirmedDiagnosis || hasValidPendingSelection)

  const footerMeta = isBlankDocument ? (
    <>
      {sessionDocument.generatedAt ? (
        <span>
          {tDocument("generatedAt", {
            value: formatDateTime(sessionDocument.generatedAt, locale, timeZone),
          })}
        </span>
      ) : null}
      {sessionDocument.pendingCreate || documentUiState.isSaving ? (
        <span>{tDocument("saving")}</span>
      ) : null}
    </>
  ) : (
    <>
      <span>
        v{sessionDocument.templateVersionNumber ?? installedDocument?.installedVersionNumber}
      </span>
      {sessionDocument.generatedAt ? (
        <span>
          {tDocument("generatedAt", {
            value: formatDateTime(sessionDocument.generatedAt, locale, timeZone),
          })}
        </span>
      ) : null}
      {installedDocument &&
      sessionDocument.templateVersionId !== installedDocument.installedVersionId ? (
        <span>{tDocument("updateAvailable")}</span>
      ) : null}
      {documentUiState.isSaving && !documentUiState.isGenerating ? (
        <span>{tDocument("saving")}</span>
      ) : null}
    </>
  )

  const feedbackDisabled =
    !sessionDocument.generatedAt ||
    documentUiState.feedbackForGeneratedAt === sessionDocument.generatedAt

  const submitFeedback = (vote: "up" | "down") => {
    if (!activeSessionId || !sessionDocument.generatedAt || !installedDocument) return

    trackClientEvent({
      eventType: "document_feedback_submitted",
      feature: "custom_document",
      sessionId: activeSessionId,
      metadata: {
        templateId: sessionDocument.templateId,
        templateTitle: installedDocument.title,
        templateVersionId: sessionDocument.templateVersionId,
        generatedAt: sessionDocument.generatedAt,
        vote,
      },
    })

    setSessionDocumentUiState(activeSessionId, sessionDocument.id, {
      feedbackForGeneratedAt: sessionDocument.generatedAt,
    })
  }

  const ambientState = documentUiState.isGenerating
    ? sessionDocument.generatedAt
      ? "updating"
      : "generating"
    : sessionDocument.pendingCreate
      ? "saving"
    : documentUiState.isSaving
      ? "saving"
      : "idle"
  const titleValue =
    sessionDocument.title ??
    installedDocument?.title ??
    tHub("untitledBlankDocument")
  const topRightAction =
    !isBlankDocument && showPreparationView && hasVisibleDocument ? (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0 text-muted-foreground hover:text-foreground"
        onClick={() => setShowPreparationView(false)}
      >
        {tDocument("backToDocument")}
      </Button>
    ) : !isBlankDocument && hasConfirmedDiagnosisRequirement && hasVisibleDocument ? (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0 text-muted-foreground hover:text-foreground"
        onClick={() => setShowPreparationView(true)}
      >
        {tDocument("changeDiagnosis")}
      </Button>
    ) : null

  const content = (
    <DocumentShell
      topActions={
        <div className="flex w-full items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={tHub("backToList")}
            title={tHub("backToList")}
            onClick={() => {
              if (!activeSessionId) return
              cancelPendingPristineBlankDiscard(pristineBlankDiscardKey)
              discardPristineBlankDocument()
              openPicker(activeSessionId)
            }}
          >
            <IconChevronLeft className="size-4" />
          </Button>

          <div className="min-w-0 flex-1">
            {isBlankDocument ? (
              <Input
                value={draftTitle}
                onChange={(event) => {
                  const nextTitle = event.target.value
                  if (!activeSessionId || !sessionDocument) return
                  patchActiveDraft(activeSessionId, sessionDocument.id, {
                    draftTitle: nextTitle,
                    dirty: true,
                    finalReconcilePending: false,
                  })
                }}
                placeholder={tHub("untitledBlankDocument")}
                className="h-10 border-border/70 text-base font-semibold"
              />
            ) : (
              <h2 className="truncate text-lg font-semibold">{titleValue}</h2>
            )}
          </div>

          {topRightAction}
        </div>
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
      error={sessionDocument.createError ?? documentUiState.lastGenerationError ?? saveError}
      empty={false}
      footerMeta={footerMeta}
      footerActions={
        !isBlankDocument ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={hasVisibleDocument ? "outline" : "default"}
              disabled={documentUiState.isGenerating || !canGenerate}
              onClick={() => {
                void handleGenerate(
                  sessionDocument.generatedAt ? "regenerate" : "manual_generate",
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

            {sessionDocument.generatedAt ? (
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
          {hasConfirmedDiagnosisRequirement ? (
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
                  setPendingGenerationInputs((currentInputs) => {
                    return {
                      ...currentInputs,
                      confirmedDiagnoses: nextConditions,
                    }
                  })
                }}
              />
            </DocumentSection>
          ) : null}
        </>
      ) : draftDocument ? (
        <>
          <DocumentEditor
            value={draftDocument}
            placeholder={tDocument("slashHint")}
            embedded
            toolbarMode="sticky"
            onChange={(nextValue) => {
              if (!activeSessionId || !sessionDocument) return
              patchActiveDraft(activeSessionId, sessionDocument.id, {
                draftDocument: nextValue,
                dirty: true,
                finalReconcilePending: false,
              })
              setSaveError(null)
            }}
          />
        </>
      ) : null}
    </DocumentShell>
  )

  const tourId =
    sessionDocument.instanceKey === "default"
      ? sessionDocument.templateId === BUILT_IN_RECORD_TEMPLATE_ID
        ? "record-panel"
        : sessionDocument.templateId === BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID
          ? "patient-handout-panel"
          : undefined
      : undefined

  return tourId ? <div data-tour={tourId}>{content}</div> : content
}

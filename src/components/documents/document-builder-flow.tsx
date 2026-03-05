"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  IconChevronLeft,
  IconChevronRight,
  IconLoader2,
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { documentTemplateSchemaSchema } from "@/lib/documents/schema"
import {
  buildGenericDocumentSections,
  buildSampleDocumentContent,
  reconcileSampleDocumentContent,
} from "@/lib/documents/preview"
import { normalizeDocumentCategory } from "@/lib/documents/categories"
import { buildDocumentPreviewInputChecksum } from "@/lib/documents/preview-checksum"
import type { UiLocale } from "@/i18n/config"
import { useDocumentBuilderLocalDraft } from "@/hooks/use-document-builder-local-draft"
import { useDocumentBuilderDialogStore } from "@/stores/document-builder-dialog-store"
import { useDocumentCatalogStore } from "@/stores/document-catalog-store"
import { useDocumentWorkspaceStore } from "@/stores/document-workspace-store"
import {
  AI_MODELS,
  useSettingsDialogStore,
  useSettingsStore,
} from "@/stores/settings-store"
import type {
  DocumentBuilderDialogMode,
  DocumentBuilderDraft,
  DocumentBuilderLocalSnapshot,
  DocumentBuilderStep,
  DocumentTemplateSchema,
} from "@/types/document"
import { countSchemaLeafNodes, createEmptyDraft } from "@/components/documents/document-builder-utils"
import { DocumentBuilderStepReview } from "@/components/documents/document-builder-step-review"
import { DocumentBuilderStepStart } from "@/components/documents/document-builder-step-start"
import { DocumentBuilderStepStructure } from "@/components/documents/document-builder-step-structure"

interface TemplateRouteResponse {
  template: {
    id: string
    title: string
    description: string
    iconKey: string
    category: string
    visibility: "PRIVATE" | "PUBLIC"
    sourceKind: "BUILT_IN" | "USER"
  }
  installed: {
    installedVersionNumber: number
  } | null
  latestDraftVersion: {
    versionNumber: number
    schemaJson: DocumentTemplateSchema
    generationConfigJson: DocumentBuilderDraft["generationConfig"]
    previewContentJson: Record<string, unknown> | null
    previewCaseSummary: string | null
    previewLocale: string | null
    previewGeneratedAt: string | null
    previewInputChecksum: string | null
  } | null
  latestPublishedVersion: {
    versionNumber: number
    schemaJson: DocumentTemplateSchema
    generationConfigJson: DocumentBuilderDraft["generationConfig"]
    previewContentJson: Record<string, unknown> | null
    previewCaseSummary: string | null
    previewLocale: string | null
    previewGeneratedAt: string | null
    previewInputChecksum: string | null
  } | null
  latestDraftPreview: {
    contentJson: Record<string, unknown> | null
    caseSummary: string | null
    locale: string | null
    generatedAt: string | null
    inputChecksum: string | null
  } | null
  latestPublishedPreview: {
    contentJson: Record<string, unknown> | null
    caseSummary: string | null
    locale: string | null
    generatedAt: string | null
    inputChecksum: string | null
  } | null
}

interface ComparableBuilderState {
  aiPrompt: string
  draft: DocumentBuilderDraft
  resolvedTemplateId: string | null
  publishedVersionNumber: number | null
  installedVersionNumber: number | null
  sampleContent: Record<string, unknown>
  previewContent: Record<string, unknown>
  previewCaseSummary: string | null
  previewLocale: string | null
  previewInputChecksum: string | null
  previewGeneratedAt: string | null
}

export interface DocumentBuilderFlowHandle {
  keepForLater: () => void
  discardLocalDraft: () => void
}

function toComparableState(input: ComparableBuilderState): string {
  return JSON.stringify(input)
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
    // Ignore malformed error bodies and fall back to the provided message.
  }

  return `${fallback} (${response.status})`
}

function createEmptyComparableState(locale: UiLocale): ComparableBuilderState {
  return {
    aiPrompt: "",
    draft: createEmptyDraft(locale),
    resolvedTemplateId: null,
    publishedVersionNumber: null,
    installedVersionNumber: null,
    sampleContent: buildSampleDocumentContent(
      createEmptyDraft(locale).schema,
      locale
    ),
    previewContent: {},
    previewCaseSummary: null,
    previewLocale: locale,
    previewInputChecksum: null,
    previewGeneratedAt: null,
  }
}

function withNormalizedDraftCategory(
  draft: DocumentBuilderDraft
): DocumentBuilderDraft {
  return {
    ...draft,
    category: normalizeDocumentCategory(draft.category),
  }
}

function buildLocalSnapshot(input: {
  mode: DocumentBuilderDialogMode
  templateId: string | null
  step: DocumentBuilderStep
  aiPrompt: string
  draft: DocumentBuilderDraft
  resolvedTemplateId: string | null
  publishedVersionNumber: number | null
  installedVersionNumber: number | null
  sampleContent: Record<string, unknown>
  previewContent: Record<string, unknown>
  previewCaseSummary: string | null
  previewLocale: string | null
  previewInputChecksum: string | null
  previewGeneratedAt: string | null
}): DocumentBuilderLocalSnapshot {
  return {
    ...input,
    savedAt: new Date().toISOString(),
  }
}

function hasStoredContent(value: Record<string, unknown> | null | undefined) {
  return !!value && Object.keys(value).length > 0
}

function resolveSampleAndPreviewContent(args: {
  draft: DocumentBuilderDraft
  locale: UiLocale
  sampleContent?: Record<string, unknown> | null
  previewContent?: Record<string, unknown> | null
  previewInputChecksum?: string | null
}) {
  const sampleSource: Record<string, unknown> | null = hasStoredContent(
    args.sampleContent
  )
    ? args.sampleContent!
    : hasStoredContent(args.previewContent)
      ? args.previewContent!
      : null
  const previewSource: Record<string, unknown> | null = hasStoredContent(
    args.previewContent
  )
    ? args.previewContent!
    : null
  const normalizedSampleContent = reconcileSampleDocumentContent(
    args.draft.schema,
    sampleSource,
    args.locale
  )

  if (!args.previewInputChecksum || !previewSource) {
    return {
      sampleContent: sampleSource ?? buildSampleDocumentContent(args.draft.schema, args.locale),
      previewContent: {},
    }
  }

  return {
    sampleContent: normalizedSampleContent,
    previewContent: previewSource,
  }
}

function stepOrder(step: DocumentBuilderStep): number {
  switch (step) {
    case "start":
      return 0
    case "structure":
      return 1
    case "review":
      return 2
    default:
      return 0
  }
}

export const DocumentBuilderFlow = forwardRef<
  DocumentBuilderFlowHandle,
  {
    initialMode: DocumentBuilderDialogMode
    initialTemplateId?: string | null
    routeBacked?: boolean
    onClose: () => void
    onDirtyChange?: (dirty: boolean) => void
  }
>(function DocumentBuilderFlow(
  {
    initialMode,
    initialTemplateId = null,
    routeBacked = false,
    onClose,
    onDirtyChange,
  },
  ref
) {
  const router = useRouter()
  const locale = useLocale() as UiLocale
  const t = useTranslations("DocumentBuilder")
  const documentModel = useSettingsStore((state) => state.aiModel.documentModel)
  const openSettings = useSettingsDialogStore((state) => state.openSettings)
  const refreshWorkspaceSnapshot = useDocumentWorkspaceStore(
    (state) => state.refreshWorkspaceSnapshot
  )
  const invalidateCatalog = useDocumentCatalogStore(
    (state) => state.invalidateCatalog
  )
  const openEditDialog = useDocumentBuilderDialogStore((state) => state.openEdit)

  const initialStep = initialMode === "edit" ? "structure" : "start"
  const [step, setStep] = useState<DocumentBuilderStep>(initialStep)
  const [draft, setDraft] = useState<DocumentBuilderDraft>(() =>
    createEmptyDraft(locale)
  )
  const [aiPrompt, setAiPrompt] = useState("")
  const [loading, setLoading] = useState(initialMode === "edit")
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [resolvedTemplateId, setResolvedTemplateId] = useState<string | null>(
    initialMode === "edit" ? initialTemplateId : null
  )
  const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null)
  const [publishedVersionNumber, setPublishedVersionNumber] = useState<number | null>(null)
  const [installedVersionNumber, setInstalledVersionNumber] = useState<number | null>(null)
  const [baselineComparableState, setBaselineComparableState] = useState(() =>
    toComparableState(createEmptyComparableState(locale))
  )
  const [restoredLocalChanges, setRestoredLocalChanges] = useState(false)
  const [serverComparableState, setServerComparableState] =
    useState<ComparableBuilderState | null>(null)
  const [sampleContent, setSampleContent] = useState<Record<string, unknown>>(
    () => buildSampleDocumentContent(createEmptyDraft(locale).schema, locale)
  )
  const [previewContent, setPreviewContent] = useState<Record<string, unknown>>({})
  const [previewCaseSummary, setPreviewCaseSummary] = useState<string | null>(null)
  const [previewLocale, setPreviewLocale] = useState<string | null>(locale)
  const [previewGeneratedAt, setPreviewGeneratedAt] = useState<string | null>(null)
  const [previewInputChecksum, setPreviewInputChecksum] = useState<string | null>(
    null
  )
  const [previewStatus, setPreviewStatus] = useState<
    "idle" | "generating" | "ready" | "failed"
  >("idle")
  const [previewError, setPreviewError] = useState<string | null>(null)
  const previewRequestIdRef = useRef(0)
  const previewAbortControllerRef = useRef<AbortController | null>(null)

  const {
    discardSnapshot,
    persistSnapshot,
    readInitialSnapshot,
    replaceWithResolvedTemplate,
    resetToServerVersion,
  } = useDocumentBuilderLocalDraft({
    mode: initialMode,
    templateId: initialTemplateId,
    resolvedTemplateId,
  })
  const effectiveMode: DocumentBuilderDialogMode =
    initialMode === "edit" || resolvedTemplateId ? "edit" : "create"
  const documentModelLabel =
    AI_MODELS.find((model) => model.value === documentModel)?.label ??
    documentModel

  const comparableState = useMemo(
    () =>
      toComparableState({
        aiPrompt,
        draft,
        resolvedTemplateId,
        publishedVersionNumber,
        installedVersionNumber,
        sampleContent,
        previewContent,
        previewCaseSummary,
        previewLocale,
        previewInputChecksum,
        previewGeneratedAt,
      }),
    [
      aiPrompt,
      draft,
      installedVersionNumber,
      previewCaseSummary,
      sampleContent,
      previewContent,
      previewGeneratedAt,
      previewInputChecksum,
      previewLocale,
      publishedVersionNumber,
      resolvedTemplateId,
    ]
  )
  const isDirty = comparableState !== baselineComparableState
  const localSnapshotRef = useRef<DocumentBuilderLocalSnapshot | null>(null)
  const previewSections = useMemo(
    () => buildGenericDocumentSections(previewContent, draft.schema.nodes),
    [draft.schema.nodes, previewContent]
  )
  const handleSampleContentChange = useCallback(
    (nextContent: Record<string, unknown>) => {
      setSampleContent(nextContent)
    },
    []
  )

  useEffect(() => {
    localSnapshotRef.current = buildLocalSnapshot({
      mode: effectiveMode,
      templateId: initialTemplateId,
      step,
      aiPrompt,
      draft,
      resolvedTemplateId,
      publishedVersionNumber,
      installedVersionNumber,
      sampleContent,
      previewContent,
      previewCaseSummary,
      previewLocale,
      previewInputChecksum,
      previewGeneratedAt,
    })
  }, [
    aiPrompt,
    draft,
    effectiveMode,
    initialMode,
    initialTemplateId,
    installedVersionNumber,
    previewCaseSummary,
    sampleContent,
    previewContent,
    previewGeneratedAt,
    previewInputChecksum,
    previewLocale,
    publishedVersionNumber,
    resolvedTemplateId,
    step,
  ])

  const currentPreviewChecksum = useMemo(
    () =>
      buildDocumentPreviewInputChecksum({
        title: draft.title,
        description: draft.description,
        category: draft.category,
        schema: draft.schema,
        generationConfig: draft.generationConfig,
        locale,
      }),
    [
      draft.category,
      draft.description,
      draft.generationConfig,
      draft.schema,
      draft.title,
      locale,
    ]
  )
  const previewHasContent = Object.keys(previewContent).length > 0
  const isPreviewStale =
    previewHasContent &&
    previewInputChecksum !== null &&
    previewInputChecksum !== currentPreviewChecksum
  const effectivePreviewStatus =
    previewStatus === "generating"
      ? "generating"
      : previewStatus === "failed"
        ? "failed"
        : isPreviewStale
          ? "stale"
          : previewHasContent
            ? "ready"
            : "idle"

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  useEffect(() => {
    setSampleContent((currentContent) =>
      reconcileSampleDocumentContent(draft.schema, currentContent, locale)
    )
  }, [draft.schema, locale])

  useEffect(() => {
    if (initialMode !== "create") return
    if (resolvedTemplateId) return

    const restoredSnapshot = readInitialSnapshot()
    if (!restoredSnapshot) {
      setBaselineComparableState(
        toComparableState(createEmptyComparableState(locale))
      )
      setSampleContent(
        buildSampleDocumentContent(createEmptyDraft(locale).schema, locale)
      )
      setPreviewContent({})
      setPreviewCaseSummary(null)
      setPreviewLocale(locale)
      setPreviewGeneratedAt(null)
      setPreviewInputChecksum(null)
      setPreviewStatus("idle")
      setPreviewError(null)
      return
    }

    setAiPrompt(restoredSnapshot.aiPrompt)
    const normalizedDraft = withNormalizedDraftCategory(restoredSnapshot.draft)
    setDraft(normalizedDraft)
    setStep(restoredSnapshot.step)
    setResolvedTemplateId(restoredSnapshot.resolvedTemplateId)
    setPublishedVersionNumber(restoredSnapshot.publishedVersionNumber)
    setInstalledVersionNumber(restoredSnapshot.installedVersionNumber)
    setRestoredLocalChanges(true)
    const restoredContent = resolveSampleAndPreviewContent({
      draft: normalizedDraft,
      locale,
      sampleContent: restoredSnapshot.sampleContent,
      previewContent: restoredSnapshot.previewContent,
      previewInputChecksum: restoredSnapshot.previewInputChecksum,
    })
    setSampleContent(restoredContent.sampleContent)
    setPreviewContent(restoredContent.previewContent)
    setPreviewCaseSummary(restoredSnapshot.previewCaseSummary ?? null)
    setPreviewLocale(restoredSnapshot.previewLocale ?? locale)
    setPreviewGeneratedAt(restoredSnapshot.previewGeneratedAt ?? null)
    setPreviewInputChecksum(restoredSnapshot.previewInputChecksum ?? null)
    setPreviewStatus(
      Object.keys(restoredContent.previewContent).length > 0 ? "ready" : "idle"
    )
    setPreviewError(null)
    toast.message(t("localDraft.restoredToast"))
  }, [initialMode, locale, readInitialSnapshot, resolvedTemplateId, t])

  useEffect(() => {
    if (initialMode !== "edit" || !initialTemplateId) return
    if (loadedTemplateId === initialTemplateId) return

    setLoading(true)
    fetch(`/api/documents/${initialTemplateId}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            await readErrorMessage(response, t("toasts.loadTemplateFailed"))
          )
        }
        return (await response.json()) as TemplateRouteResponse
      })
      .then((payload) => {
        const editableVersion =
          payload.latestDraftVersion ?? payload.latestPublishedVersion
        if (!editableVersion) {
          throw new Error(t("toasts.loadTemplateFailed"))
        }

        const resolvedContent = resolveSampleAndPreviewContent({
          draft: {
            title: payload.template.title,
            description: payload.template.description,
            iconKey: payload.template.iconKey,
            category: normalizeDocumentCategory(payload.template.category),
            visibility: payload.template.visibility,
            schema: editableVersion.schemaJson,
            generationConfig: editableVersion.generationConfigJson,
          },
          locale,
          previewContent:
            payload.latestDraftPreview?.contentJson ??
            payload.latestPublishedPreview?.contentJson ??
            null,
          previewInputChecksum:
            payload.latestDraftPreview?.inputChecksum ??
            payload.latestPublishedPreview?.inputChecksum ??
            null,
        })

        const comparable = {
          aiPrompt: "",
          draft: {
            title: payload.template.title,
            description: payload.template.description,
            iconKey: payload.template.iconKey,
            category: normalizeDocumentCategory(payload.template.category),
            visibility: payload.template.visibility,
            schema: editableVersion.schemaJson,
            generationConfig: editableVersion.generationConfigJson,
          },
          resolvedTemplateId: payload.template.id,
          publishedVersionNumber: payload.latestPublishedVersion?.versionNumber ?? null,
          installedVersionNumber: payload.installed?.installedVersionNumber ?? null,
          sampleContent: resolvedContent.sampleContent,
          previewContent: resolvedContent.previewContent,
          previewCaseSummary:
            payload.latestDraftPreview?.caseSummary ??
            payload.latestPublishedPreview?.caseSummary ??
            null,
          previewLocale:
            payload.latestDraftPreview?.locale ??
            payload.latestPublishedPreview?.locale ??
            locale,
          previewInputChecksum:
            payload.latestDraftPreview?.inputChecksum ??
            payload.latestPublishedPreview?.inputChecksum ??
            null,
          previewGeneratedAt:
            payload.latestDraftPreview?.generatedAt ??
            payload.latestPublishedPreview?.generatedAt ??
            null,
        } satisfies ComparableBuilderState

        setServerComparableState(comparable)
        setBaselineComparableState(toComparableState(comparable))
        setDraft(comparable.draft)
        setAiPrompt("")
        setResolvedTemplateId(payload.template.id)
        setPublishedVersionNumber(comparable.publishedVersionNumber)
        setInstalledVersionNumber(comparable.installedVersionNumber)
        setStep("structure")
        setLoadedTemplateId(payload.template.id)
        setSampleContent(comparable.sampleContent)
        setPreviewContent(comparable.previewContent)
        setPreviewCaseSummary(comparable.previewCaseSummary)
        setPreviewLocale(comparable.previewLocale)
        setPreviewGeneratedAt(comparable.previewGeneratedAt)
        setPreviewInputChecksum(comparable.previewInputChecksum)
        setPreviewStatus(
          Object.keys(comparable.previewContent).length > 0 ? "ready" : "idle"
        )
        setPreviewError(null)

        const restoredSnapshot = readInitialSnapshot()
        if (!restoredSnapshot) return

        setAiPrompt(restoredSnapshot.aiPrompt)
        const normalizedDraft = withNormalizedDraftCategory(restoredSnapshot.draft)
        setDraft(normalizedDraft)
        setStep(restoredSnapshot.step)
        setResolvedTemplateId(restoredSnapshot.resolvedTemplateId)
        setPublishedVersionNumber(restoredSnapshot.publishedVersionNumber)
        setInstalledVersionNumber(restoredSnapshot.installedVersionNumber)
        setRestoredLocalChanges(true)
        const restoredContent = resolveSampleAndPreviewContent({
          draft: normalizedDraft,
          locale,
          sampleContent: restoredSnapshot.sampleContent,
          previewContent: restoredSnapshot.previewContent,
          previewInputChecksum: restoredSnapshot.previewInputChecksum,
        })
        setSampleContent(restoredContent.sampleContent)
        setPreviewContent(restoredContent.previewContent)
        setPreviewCaseSummary(restoredSnapshot.previewCaseSummary ?? null)
        setPreviewLocale(restoredSnapshot.previewLocale ?? locale)
        setPreviewGeneratedAt(restoredSnapshot.previewGeneratedAt ?? null)
        setPreviewInputChecksum(restoredSnapshot.previewInputChecksum ?? null)
        setPreviewStatus(
          Object.keys(restoredContent.previewContent).length > 0 ? "ready" : "idle"
        )
        setPreviewError(null)
        toast.message(t("localDraft.restoredToast"))
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : t("toasts.loadTemplateFailed")
        console.error("Failed to load template", error)
        toast.error(message)
        onClose()
      })
      .finally(() => {
        setLoading(false)
      })
  }, [
    initialMode,
    initialTemplateId,
    locale,
    loadedTemplateId,
    onClose,
    readInitialSnapshot,
    t,
  ])

  useEffect(() => {
    if (loading) return

    if (isDirty && localSnapshotRef.current) {
      persistSnapshot(localSnapshotRef.current)
      return
    }

    discardSnapshot()
  }, [discardSnapshot, isDirty, loading, persistSnapshot])

  useImperativeHandle(
    ref,
    () => ({
      keepForLater: () => {
        if (isDirty && localSnapshotRef.current) {
          persistSnapshot(localSnapshotRef.current)
        }
      },
      discardLocalDraft: () => {
        discardSnapshot()
      },
    }),
    [discardSnapshot, isDirty, persistSnapshot]
  )

  const schemaValidationMessage = useMemo(() => {
    if (!draft.title.trim()) {
      return t("validation.titleRequired")
    }

    const parsed = documentTemplateSchemaSchema.safeParse(draft.schema)
    if (parsed.success) return null
    return parsed.error.issues[0]?.message ?? t("validation.schemaInvalid")
  }, [draft.schema, draft.title, t])

  const goToStructureStep = useCallback(() => {
    const nextDraft = createEmptyDraft(locale)
    setDraft(nextDraft)
    setSampleContent(buildSampleDocumentContent(nextDraft.schema, locale))
    setPreviewContent({})
    setPreviewCaseSummary(null)
    setPreviewLocale(locale)
    setPreviewGeneratedAt(null)
    setPreviewInputChecksum(null)
    setPreviewStatus("idle")
    setPreviewError(null)
    setStep("structure")
  }, [locale])

  const generatePreview = useCallback(
    async (options?: { force?: boolean; showToastOnFailure?: boolean }) => {
      const force = options?.force ?? false
      const showToastOnFailure = options?.showToastOnFailure ?? false

      if (!draft.title.trim() || draft.schema.nodes.length === 0) {
        setPreviewStatus("idle")
        setPreviewError(null)
        setPreviewCaseSummary(null)
        setPreviewInputChecksum(null)
        setPreviewGeneratedAt(null)
        setPreviewContent({})
        return
      }

      if (!force && previewInputChecksum === currentPreviewChecksum) {
        return
      }

      previewAbortControllerRef.current?.abort()
      const controller = new AbortController()
      previewAbortControllerRef.current = controller
      const requestId = previewRequestIdRef.current + 1
      previewRequestIdRef.current = requestId

      setPreviewStatus("generating")
      setPreviewError(null)

      try {
        const response = await fetch("/api/documents/ai/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            draft,
            locale,
            model: documentModel,
          }),
        })
        if (!response.ok) {
          throw new Error(
            await readErrorMessage(response, t("toasts.previewFailed"))
          )
        }

        const payload = (await response.json()) as {
          previewContent: Record<string, unknown>
          previewCaseSummary: string
          previewLocale: string
          previewGeneratedAt: string
          previewInputChecksum: string
        }

        if (previewRequestIdRef.current !== requestId) return

        setPreviewContent(payload.previewContent)
        setPreviewCaseSummary(payload.previewCaseSummary)
        setPreviewLocale(payload.previewLocale)
        setPreviewGeneratedAt(payload.previewGeneratedAt)
        setPreviewInputChecksum(payload.previewInputChecksum)
        setPreviewStatus("ready")
        setPreviewError(null)
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return
        }

        const message =
          error instanceof Error ? error.message : t("toasts.previewFailed")
        setPreviewStatus("failed")
        setPreviewError(message)
        if (showToastOnFailure) {
          toast.error(message)
        }
      }
    },
    [
      currentPreviewChecksum,
      documentModel,
      draft,
      locale,
      previewInputChecksum,
      t,
    ]
  )

  useEffect(() => {
    if (step !== "review") return
    if (!draft.title.trim() || draft.schema.nodes.length === 0) return
    if (previewHasContent) return

    void generatePreview()
  }, [
    draft.schema.nodes.length,
    draft.title,
    generatePreview,
    previewHasContent,
    step,
  ])

  const handleAiDraft = useCallback(async () => {
    if (aiPrompt.trim().length < 10) {
      toast.error(t("toasts.promptTooShort"))
      return
    }

    try {
      setAiLoading(true)
      const endpoint =
        effectiveMode === "edit" && resolvedTemplateId
          ? `/api/documents/${resolvedTemplateId}/ai-revise`
          : "/api/documents/ai/draft"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          effectiveMode === "edit" && resolvedTemplateId
            ? { prompt: aiPrompt, draft, model: documentModel }
            : { prompt: aiPrompt, model: documentModel }
        ),
      })
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, t("toasts.generateFailed"))
        )
      }

      const payload = (await response.json()) as DocumentBuilderDraft
      setDraft(withNormalizedDraftCategory(payload))
      setSampleContent(buildSampleDocumentContent(payload.schema, locale))
      setPreviewContent({})
      setPreviewCaseSummary(null)
      setPreviewLocale(locale)
      setPreviewGeneratedAt(null)
      setPreviewInputChecksum(null)
      setPreviewStatus("idle")
      setPreviewError(null)
      setStep("structure")
      toast.success(
        effectiveMode === "edit"
          ? t("toasts.draftRevised")
          : t("toasts.draftGenerated")
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("toasts.generateFailed")
      console.error("Failed to generate document draft", error)
      toast.error(message)
    } finally {
      setAiLoading(false)
    }
  }, [
    aiPrompt,
    documentModel,
    draft,
    effectiveMode,
    locale,
    resolvedTemplateId,
    t,
  ])

  const saveDraft = useCallback(async (): Promise<string | null> => {
    try {
      setSaving(true)
      if (resolvedTemplateId) {
        const response = await fetch(`/api/documents/${resolvedTemplateId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...draft,
            previewContent,
            previewCaseSummary,
            previewLocale,
            previewGeneratedAt,
            previewInputChecksum,
            previewModelId: documentModel,
          }),
        })
        if (!response.ok) {
          throw new Error(
            await readErrorMessage(response, t("toasts.saveFailed"))
          )
        }

        const nextBaseline = toComparableState({
          aiPrompt,
          draft,
          resolvedTemplateId,
          publishedVersionNumber,
          installedVersionNumber,
          sampleContent,
          previewContent,
          previewCaseSummary,
          previewLocale,
          previewInputChecksum,
          previewGeneratedAt,
        })
        setBaselineComparableState(nextBaseline)
        setRestoredLocalChanges(false)
        invalidateCatalog()
        toast.success(t("toasts.draftSaved"))
        return resolvedTemplateId
      }

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          previewContent,
          previewCaseSummary,
          previewLocale,
          previewGeneratedAt,
          previewInputChecksum,
          previewModelId: documentModel,
        }),
      })
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, t("toasts.saveFailed")))
      }

      const payload = (await response.json()) as { id: string }
      if (localSnapshotRef.current) {
        replaceWithResolvedTemplate(payload.id, localSnapshotRef.current)
      } else {
        discardSnapshot()
      }
      setResolvedTemplateId(payload.id)
      setLoadedTemplateId(payload.id)
      setBaselineComparableState(
        toComparableState({
          aiPrompt,
          draft,
          resolvedTemplateId: payload.id,
          publishedVersionNumber,
          installedVersionNumber,
          sampleContent,
          previewContent,
          previewCaseSummary,
          previewLocale,
          previewInputChecksum,
          previewGeneratedAt,
        })
      )
      setRestoredLocalChanges(false)
      invalidateCatalog()
      toast.success(t("toasts.draftCreated"))

      openEditDialog(payload.id, { routeBacked })
      if (routeBacked) {
        router.replace(`/documents/${payload.id}/edit`)
      }

      return payload.id
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("toasts.saveFailed")
      console.error("Failed to save document draft", error)
      toast.error(message)
      return null
    } finally {
      setSaving(false)
    }
  }, [
    aiPrompt,
    discardSnapshot,
    draft,
    documentModel,
    installedVersionNumber,
    invalidateCatalog,
    openEditDialog,
    previewCaseSummary,
    sampleContent,
    previewContent,
    previewGeneratedAt,
    previewInputChecksum,
    previewLocale,
    publishedVersionNumber,
    replaceWithResolvedTemplate,
    resolvedTemplateId,
    routeBacked,
    router,
    t,
  ])

  const publishDraft = useCallback(async () => {
    try {
      setPublishing(true)
      let currentTemplateId = resolvedTemplateId
      if (!currentTemplateId) {
        currentTemplateId = await saveDraft()
      }
      if (!currentTemplateId) {
        throw new Error(t("toasts.saveFailed"))
      }

      const response = await fetch(`/api/documents/${currentTemplateId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          model: documentModel,
        }),
      })
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, t("toasts.publishFailed"))
        )
      }

      const payload = (await response.json()) as {
        latestPublishedVersion: { versionNumber: number } | null
      }
      const nextPublishedVersionNumber =
        payload.latestPublishedVersion?.versionNumber ?? null
      setPublishedVersionNumber(nextPublishedVersionNumber)
      setBaselineComparableState(
        toComparableState({
          aiPrompt,
          draft,
          resolvedTemplateId: currentTemplateId,
          publishedVersionNumber: nextPublishedVersionNumber,
          installedVersionNumber,
          sampleContent,
          previewContent,
          previewCaseSummary,
          previewLocale,
          previewInputChecksum,
          previewGeneratedAt,
        })
      )
      setRestoredLocalChanges(false)
      invalidateCatalog()
      toast.success(t("toasts.documentPublished"))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("toasts.publishFailed")
      console.error("Failed to publish document", error)
      toast.error(message)
    } finally {
      setPublishing(false)
    }
  }, [
    aiPrompt,
    documentModel,
    draft,
    installedVersionNumber,
    invalidateCatalog,
    locale,
    previewCaseSummary,
    sampleContent,
    previewContent,
    previewGeneratedAt,
    previewInputChecksum,
    previewLocale,
    resolvedTemplateId,
    saveDraft,
    t,
  ])

  const installPublished = useCallback(async () => {
    if (!resolvedTemplateId) {
      toast.error(t("toasts.saveAndPublishFirst"))
      return
    }

    try {
      setInstalling(true)
      const response = await fetch(`/api/documents/${resolvedTemplateId}/install`, {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, t("toasts.installFailed"))
        )
      }

      const snapshot = await refreshWorkspaceSnapshot()
      const installedDocument =
        snapshot?.installedDocuments.find(
          (document) => document.templateId === resolvedTemplateId
        ) ?? null
      setInstalledVersionNumber(installedDocument?.installedVersionNumber ?? null)
      invalidateCatalog()
      discardSnapshot()
      toast.success(t("toasts.documentInstalled"))
      onClose()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("toasts.installFailed")
      console.error("Failed to install document", error)
      toast.error(message)
    } finally {
      setInstalling(false)
    }
  }, [
    discardSnapshot,
    invalidateCatalog,
    onClose,
    refreshWorkspaceSnapshot,
    resolvedTemplateId,
    t,
  ])

  const handleResetToServerVersion = useCallback(() => {
    if (!serverComparableState || !resolvedTemplateId) return

    setAiPrompt(serverComparableState.aiPrompt)
    setDraft(serverComparableState.draft)
    setResolvedTemplateId(serverComparableState.resolvedTemplateId)
    setPublishedVersionNumber(serverComparableState.publishedVersionNumber)
    setInstalledVersionNumber(serverComparableState.installedVersionNumber)
    setStep("structure")
    setBaselineComparableState(toComparableState(serverComparableState))
    setRestoredLocalChanges(false)
    resetToServerVersion(resolvedTemplateId)
    setSampleContent(serverComparableState.sampleContent)
    setPreviewContent(serverComparableState.previewContent)
    setPreviewCaseSummary(serverComparableState.previewCaseSummary)
    setPreviewLocale(serverComparableState.previewLocale)
    setPreviewGeneratedAt(serverComparableState.previewGeneratedAt)
    setPreviewInputChecksum(serverComparableState.previewInputChecksum)
    setPreviewStatus(
      Object.keys(serverComparableState.previewContent).length > 0
        ? "ready"
        : "idle"
    )
    setPreviewError(null)
    toast.success(t("localDraft.resetToast"))
  }, [
    resolvedTemplateId,
    resetToServerVersion,
    serverComparableState,
    t,
  ])

  const stepLabels = [
    t("steps.start"),
    t("steps.structure"),
    t("steps.review"),
  ]
  const activeStepIndex = stepOrder(step)
  const schemaNodeCount = countSchemaLeafNodes(draft.schema.nodes)
  const canGoNext = step === "structure" ? !schemaValidationMessage : true

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          {stepLabels.map((label, index) => {
            const isActive = index === activeStepIndex
            const isComplete = index < activeStepIndex

            return (
              <div key={label} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex size-7 items-center justify-center rounded-full border text-xs font-semibold ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : isComplete
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`text-sm ${
                      isActive ? "font-medium text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {index < stepLabels.length - 1 ? (
                  <div className="hidden h-px w-8 bg-border sm:block" />
                ) : null}
              </div>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
          <IconLoader2 className="size-4 animate-spin" />
          {t("loadingTemplate")}
        </div>
      ) : step === "start" ? (
        <DocumentBuilderStepStart
          aiLoading={aiLoading}
          aiPrompt={aiPrompt}
          documentModelLabel={documentModelLabel}
          onAiPromptChange={setAiPrompt}
          onOpenModelSettings={() => openSettings("models")}
          onGenerateDraft={handleAiDraft}
          onStartBlank={goToStructureStep}
        />
      ) : step === "structure" ? (
        <DocumentBuilderStepStructure
          draft={draft}
          setDraft={setDraft}
          previewContent={sampleContent}
          aiLoading={aiLoading}
          aiPrompt={aiPrompt}
          showAiRevisePanel={effectiveMode === "edit"}
          documentModelLabel={documentModelLabel}
          onAiPromptChange={setAiPrompt}
          onAiRevise={handleAiDraft}
          onOpenModelSettings={() => openSettings("models")}
          onPreviewContentChange={handleSampleContentChange}
          onResetToServerVersion={
            restoredLocalChanges && serverComparableState
              ? handleResetToServerVersion
              : null
          }
          restoredLocalChanges={restoredLocalChanges}
          validationError={schemaValidationMessage}
        />
      ) : (
        <DocumentBuilderStepReview
          title={draft.title}
          description={draft.description}
          category={draft.category}
          visibility={draft.visibility}
          schemaNodeCount={schemaNodeCount}
          contextSources={draft.generationConfig.contextSources}
          publishedVersionNumber={publishedVersionNumber}
          installedVersionNumber={installedVersionNumber}
          previewSections={previewSections}
          previewCaseSummary={previewCaseSummary}
          previewLocale={previewLocale}
          previewGeneratedAt={previewGeneratedAt}
          previewStatus={effectivePreviewStatus}
          previewError={previewError}
          onRegeneratePreview={() =>
            void generatePreview({ force: true, showToastOnFailure: true })
          }
        />
      )}

      {step === "start" ? null : (
        <div className="border-t px-4 py-4 sm:px-6">
          {step === "structure" ? (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("start")}
              >
                <IconChevronLeft className="size-4" />
                {t("navigation.back")}
              </Button>

              <Button
                type="button"
                disabled={!canGoNext}
                onClick={() => setStep("review")}
              >
                {t("navigation.review")}
                <IconChevronRight className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <Button
                type="button"
                variant="outline"
                className="self-start"
                onClick={() => setStep("structure")}
              >
                <IconChevronLeft className="size-4" />
                {t("navigation.back")}
              </Button>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => void saveDraft()}
                >
                  {saving ? <IconLoader2 className="size-4 animate-spin" /> : null}
                  {t("headerActions.saveDraft")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={publishing}
                  onClick={() => void publishDraft()}
                >
                  {publishing ? (
                    <IconLoader2 className="size-4 animate-spin" />
                  ) : null}
                  {t("headerActions.publish")}
                </Button>
                <Button
                  type="button"
                  disabled={installing || publishedVersionNumber === null}
                  onClick={() => void installPublished()}
                >
                  {installing ? (
                    <IconLoader2 className="size-4 animate-spin" />
                  ) : null}
                  {t("headerActions.install")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

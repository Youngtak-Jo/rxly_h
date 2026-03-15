"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react"
import { useTranslations } from "next-intl"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SimulationDialog } from "@/components/consultation/simulation-dialog"
import { deleteCachedSession } from "@/hooks/use-session-loader"
import { useAiDoctor } from "@/hooks/use-ai-doctor"
import { useDeepgram } from "@/hooks/use-deepgram"
import { resolveConsultationDocumentContext } from "@/lib/consultation/active-document"
import { ensureBlankDocumentPersisted } from "@/lib/consultation/blank-document"
import { isSystemBlankDocumentTitle } from "@/lib/documents/blank-document"
import { BUILT_IN_BLANK_DOCUMENT_TEMPLATE_ID } from "@/lib/documents/constants"
import { htmlToRichTextDocument } from "@/lib/documents/rich-text-client"
import { normalizeRichTextDocument } from "@/lib/documents/rich-text"
import { sanitizeStreamingHtml } from "@/lib/documents/streaming-html"
import { parseResearchCitations } from "@/lib/research-citations"
import { trackClientEvent } from "@/lib/telemetry/client-events"
import { cn } from "@/lib/utils"
import {
  useActiveConsultationDocumentDraftStore,
  type ActiveConsultationDocumentDraft,
} from "@/stores/active-consultation-document-draft-store"
import { useConsultationDocumentsStore } from "@/stores/consultation-documents-store"
import { useConsultationModeStore } from "@/stores/consultation-mode-store"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useConnectorStore } from "@/stores/connector-store"
import { useDocumentWorkspaceStore } from "@/stores/document-workspace-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useNoteStore } from "@/stores/note-store"
import { useRecordingStore } from "@/stores/recording-store"
import type { ResearchCitation } from "@/stores/research-store"
import { useResearchStore } from "@/stores/research-store"
import { useSessionDocumentStore } from "@/stores/session-document-store"
import { useSessionStore } from "@/stores/session-store"
import { useSettingsStore } from "@/stores/settings-store"
import type { SessionDocumentRecord } from "@/types/document"
import { toast } from "sonner"
import {
  IconArrowUp,
  IconFileText,
  IconLoader2,
  IconMicrophone,
  IconMicrophoneOff,
  IconNotes,
  IconPhoto,
  IconPlayerStop,
  IconPlus,
  IconSearch,
  IconTestPipe,
  IconTrash,
  IconX,
} from "@tabler/icons-react"

type DraftMode = "note" | "document" | "research" | "aiDoctor"
type ClinicalDraftMode = "note" | "document"

interface Attachment {
  file: File
  preview: string
}

interface DraftState {
  text: string
  attachments: Attachment[]
}

type DraftMap = Record<DraftMode, DraftState>

const EMPTY_DOCUMENT_DRAFT_ERROR = "Failed to generate a document draft."

type DocumentStreamEvent =
  | { type: "title"; title: string }
  | { type: "delta"; html: string }
  | { type: "complete"; sessionDocument: SessionDocumentRecord }
  | { type: "error"; error: string }

function buildDocumentRevisionKey(document: {
  updatedAt: string
  generatedAt: string | null
}) {
  return `${document.updatedAt}:${document.generatedAt ?? ""}`
}

function nodeHasMeaningfulContent(
  node: Record<string, unknown> | null | undefined
): boolean {
  if (!node) return false

  if (node.type === "text") {
    return typeof node.text === "string" && node.text.trim().length > 0
  }

  if (node.type === "image") {
    return (
      !!node.attrs &&
      typeof node.attrs === "object" &&
      typeof (node.attrs as { src?: unknown }).src === "string" &&
      !!(node.attrs as { src: string }).src.trim()
    )
  }

  const content = Array.isArray(node.content)
    ? (node.content as Array<Record<string, unknown>>)
    : []

  return content.some((child) => nodeHasMeaningfulContent(child))
}

function documentHasMeaningfulContent(document: Record<string, unknown>): boolean {
  const content = Array.isArray(document.content)
    ? (document.content as Array<Record<string, unknown>>)
    : []
  return content.some((node) => nodeHasMeaningfulContent(node))
}

function createEmptyDrafts(): DraftMap {
  return {
    note: { text: "", attachments: [] },
    document: { text: "", attachments: [] },
    research: { text: "", attachments: [] },
    aiDoctor: { text: "", attachments: [] },
  }
}

function revokeAttachments(attachments: Attachment[]) {
  attachments.forEach((attachment) => {
    URL.revokeObjectURL(attachment.preview)
  })
}

function revokeDrafts(drafts: DraftMap) {
  Object.values(drafts).forEach((draft) => revokeAttachments(draft.attachments))
}

async function persistResearchMessagePair(
  sessionId: string,
  question: string,
  assistantContent: string,
  citations: ResearchCitation[],
  imageUrls: string[],
  storagePaths: string[],
  retries = 1
): Promise<boolean> {
  const payload = JSON.stringify({
    messages: [
      { role: "user", content: question, citations: [], imageUrls, storagePaths },
      {
        role: "assistant",
        content: assistantContent,
        citations,
        imageUrls: [],
        storagePaths: [],
      },
    ],
  })

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      })
      if (res.ok) {
        deleteCachedSession(sessionId)
        return true
      }
    } catch {
      // Retry below.
    }

    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
  }

  return false
}

export interface SmartConsultationComposerHandle {
  addFiles: (files: FileList) => void
}

export const SmartConsultationComposer = forwardRef<SmartConsultationComposerHandle>(
  function SmartConsultationComposer(_props, ref) {
    const tComposer = useTranslations("SmartComposer")
    const tDocumentsHub = useTranslations("ConsultationDocumentsHub")
    const tNote = useTranslations("NoteInputBar")
    const tResearch = useTranslations("ResearchInput")

    const activeSession = useSessionStore((s) => s.activeSession)
    const isSwitching = useSessionStore((s) => s.isSwitching)
    const hydratingSessionId = useSessionStore((s) => s.hydratingSessionId)

    const activeTab = useConsultationTabStore((s) => s.activeTab)
    const lastNonResearchTab = useConsultationTabStore((s) => s.lastNonResearchTab)
    const setActiveTab = useConsultationTabStore((s) => s.setActiveTab)

    const consultationMode = useConsultationModeStore((s) => s.mode)
    const isAiResponding = useConsultationModeStore((s) => s.isAiResponding)
    const isMicActive = useConsultationModeStore((s) => s.isMicActive)
    const setMicActive = useConsultationModeStore((s) => s.setMicActive)
    const documentsHubUiState = useConsultationDocumentsStore((state) =>
      state.getSessionUiState(activeSession?.id)
    )
    const openDocument = useConsultationDocumentsStore((state) => state.openDocument)

    const { isRecording } = useRecordingStore()
    const { startListening, stopListening } = useDeepgram()
    const { sendMessage } = useAiDoctor()

    const {
      messages,
      isStreaming,
      includeInsights,
      setIncludeInsights,
      addUserMessage,
      addAssistantMessage,
      updateAssistantMessage,
      finalizeAssistantMessage,
      setStreaming,
      setAbortController,
      clearMessages,
    } = useResearchStore()

    const connectors = useConnectorStore((s) => s.connectors)
    const insights = useInsightsStore()
    const installedDocuments = useDocumentWorkspaceStore((s) => s.installedDocuments)
    const activeSessionDocuments = useSessionDocumentStore((state) =>
      state.getSessionDocuments(activeSession?.id)
    )
    const documentContext = resolveConsultationDocumentContext({
      uiState: documentsHubUiState,
      installedDocuments,
      sessionDocuments: activeSessionDocuments,
    })
    const documentTargetDocumentId = documentContext.targetDocumentId
    const activeDocumentId =
      activeTab === "documents" ? documentContext.editorDocumentId : null
    const activeDocument = documentContext.installedDocument
    const activeDocumentSessionDocument = documentContext.sessionDocument
    const upsertSessionDocument = useSessionDocumentStore(
      (state) => state.upsertSessionDocument
    )
    const createOptimisticBlankDocument = useSessionDocumentStore(
      (state) => state.createOptimisticBlankDocument
    )
    const setSessionDocumentUiState = useSessionDocumentStore(
      (state) => state.setSessionDocumentUiState
    )
    const activeDocumentDraft = useActiveConsultationDocumentDraftStore((state) =>
      state.getDraft(activeSession?.id, activeDocumentId)
    )
    const hydrateActiveDraft = useActiveConsultationDocumentDraftStore(
      (state) => state.hydrateDraft
    )
    const patchActiveDraft = useActiveConsultationDocumentDraftStore(
      (state) => state.patchDraft
    )
    const startStreamingDraft = useActiveConsultationDocumentDraftStore(
      (state) => state.startStreaming
    )

    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const draftsRef = useRef<DraftMap>(createEmptyDrafts())
    const previousSessionIdRef = useRef<string | null>(activeSession?.id ?? null)
    const previousActiveDocumentIdRef = useRef<string | null>(null)
    const documentStreamRef = useRef<{
      sessionId: string
      documentId: string
      streamRequestId: string
      controller: AbortController
    } | null>(null)

    const [drafts, setDrafts] = useState<DraftMap>(createEmptyDrafts)
    const [isSending, setIsSending] = useState(false)
    const [clinicalDraftMode, setClinicalDraftMode] =
      useState<ClinicalDraftMode>("note")
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false)

    draftsRef.current = drafts

    const isTranscriptHydrating =
      !!activeSession && hydratingSessionId === activeSession.id
    const activeDocumentTitle =
      activeDocumentDraft?.draftTitle.trim() ||
      activeDocumentSessionDocument?.title ||
      activeDocument?.title ||
      tComposer("documentFallback")
    const canSelectDocumentMode =
      !!documentTargetDocumentId && !!activeDocumentSessionDocument
    const canUseDocumentMode =
      activeTab === "documents" &&
      !!activeDocumentId &&
      !!activeDocumentSessionDocument
    const currentDraftMode: DraftMode =
      activeTab === "research"
        ? "research"
        : consultationMode === "ai-doctor"
          ? "aiDoctor"
          : clinicalDraftMode === "document" && canUseDocumentMode
            ? "document"
            : "note"
    const currentDraft = drafts[currentDraftMode]
    const currentAttachments = currentDraft.attachments
    const currentTrimmedText = currentDraft.text.trim()
    const hasCurrentContent =
      currentTrimmedText.length > 0 || currentAttachments.length > 0
    const hasDocumentPrompt = drafts.document.text.trim().length > 0
    const isResearchMode = currentDraftMode === "research"
    const isDocumentMode = currentDraftMode === "document"
    const isAiDoctorMode = currentDraftMode === "aiDoctor"
    const isNoteMode = !isResearchMode && !isDocumentMode && !isAiDoctorMode
    const hasAttachments = currentAttachments.length > 0
    const showSimulationButton = !isResearchMode && !isDocumentMode
    const showIncludeInsightsButton = isResearchMode
    const isResearchActive = isResearchMode

    useEffect(() => {
      return () => {
        revokeDrafts(draftsRef.current)
      }
    }, [])

    useEffect(() => {
      const nextSessionId = activeSession?.id ?? null
      if (previousSessionIdRef.current === nextSessionId) return

      revokeDrafts(draftsRef.current)
      setDrafts(createEmptyDrafts())
      setClinicalDraftMode("note")
      previousSessionIdRef.current = nextSessionId
    }, [activeSession?.id])

    useEffect(() => {
      if (consultationMode === "ai-doctor") return
      if (clinicalDraftMode === "document" && !canSelectDocumentMode) {
        setClinicalDraftMode("note")
      }
    }, [canSelectDocumentMode, clinicalDraftMode, consultationMode])

    useEffect(() => {
      const nextDocumentId =
        activeTab === "documents" ? activeDocumentSessionDocument?.id ?? null : null
      if (previousActiveDocumentIdRef.current === nextDocumentId) {
        return
      }

      previousActiveDocumentIdRef.current = nextDocumentId
      if (nextDocumentId && consultationMode !== "ai-doctor") {
        setClinicalDraftMode("document")
      }
    }, [activeDocumentSessionDocument?.id, activeTab, consultationMode])

    useEffect(() => {
      const inFlight = documentStreamRef.current
      if (!inFlight) return

      const sessionChanged = inFlight.sessionId !== (activeSession?.id ?? null)
      const documentChanged =
        activeTab !== "documents" || inFlight.documentId !== (activeDocumentId ?? null)

      if (!sessionChanged && !documentChanged) {
        return
      }

      inFlight.controller.abort()
      patchActiveDraft(inFlight.sessionId, inFlight.documentId, {
        isStreaming: false,
        streamRequestId: null,
        dirty: false,
        sanitizedHtmlBuffer: "",
        finalReconcilePending: false,
      })
      documentStreamRef.current = null
    }, [activeDocumentId, activeSession?.id, activeTab, patchActiveDraft])

    const setDraftText = useCallback(
      (draftMode: DraftMode, text: string) => {
        setDrafts((prev) => ({
          ...prev,
          [draftMode]: {
            ...prev[draftMode],
            text,
          },
        }))
      },
      []
    )

    const clearDraft = useCallback(
      (draftMode: DraftMode) => {
        setDrafts((prev) => {
          revokeAttachments(prev[draftMode].attachments)
          return {
            ...prev,
            [draftMode]: {
              text: "",
              attachments: [],
            },
          }
        })
      },
      []
    )

    const handleFileSelect = useCallback(
      (files: FileList | null) => {
        if (currentDraftMode === "document") return
        if (!files || !activeSession) return

        const nextAttachments: Attachment[] = []
        Array.from(files).forEach((file) => {
          if (!file.type.startsWith("image/")) {
            toast.error(tNote("onlyImages"))
            return
          }
          if (file.size > 10 * 1024 * 1024) {
            toast.error(tNote("fileTooLarge"))
            return
          }

          nextAttachments.push({
            file,
            preview: URL.createObjectURL(file),
          })
        })

        if (nextAttachments.length === 0) return

        setDrafts((prev) => ({
          ...prev,
          [currentDraftMode]: {
            ...prev[currentDraftMode],
            attachments: [...prev[currentDraftMode].attachments, ...nextAttachments],
          },
        }))
      },
      [activeSession, currentDraftMode, tNote]
    )

    useImperativeHandle(
      ref,
      () => ({
        addFiles: (files) => handleFileSelect(files),
      }),
      [handleFileSelect]
    )

    const removeAttachment = useCallback(
      (index: number) => {
        setDrafts((prev) => {
          const target = prev[currentDraftMode]
          URL.revokeObjectURL(target.attachments[index].preview)
          return {
            ...prev,
            [currentDraftMode]: {
              ...target,
              attachments: target.attachments.filter((_, itemIndex) => itemIndex !== index),
            },
          }
        })
      },
      [currentDraftMode]
    )

    const handlePaste = useCallback(
      (event: ClipboardEvent<HTMLTextAreaElement>) => {
        if (currentDraftMode === "document") return
        const items = event.clipboardData?.items
        if (!items) return

        const imageItems = Array.from(items).filter(
          (item) => item.kind === "file" && item.type.startsWith("image/")
        )
        if (imageItems.length === 0) return

        event.preventDefault()
        const files = imageItems
          .map((item) => item.getAsFile())
          .filter(Boolean) as File[]
        const transfer = new DataTransfer()
        files.forEach((file) => transfer.items.add(file))
        handleFileSelect(transfer.files)
      },
      [currentDraftMode, handleFileSelect]
    )

    const uploadAttachments = useCallback(
      async (
        sessionId: string,
        attachments: Attachment[],
        feature: "note" | "ai_doctor" | "research"
      ): Promise<Array<{ url: string; storagePath?: string }>> => {
        if (attachments.length === 0) return []

        const uploadResults = await Promise.allSettled(
          attachments.map(async (attachment) => {
            const formData = new FormData()
            formData.append("file", attachment.file)
            formData.append("sessionId", sessionId)

            const res = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            })

            if (!res.ok) {
              throw new Error(`Upload failed (${res.status})`)
            }

            const data = (await res.json()) as { url?: string; path?: string }
            if (!data.url) {
              throw new Error("Upload response missing URL")
            }

            return {
              url: data.url,
              storagePath: data.path || undefined,
            }
          })
        )

        const uploaded = uploadResults
          .filter(
            (
              result
            ): result is PromiseFulfilledResult<{
              url: string
              storagePath: string | undefined
            }> => result.status === "fulfilled"
          )
          .map((result) => result.value)

        const failedCount = uploadResults.length - uploaded.length
        if (failedCount > 0) {
          toast.error(tNote("imageUploadFailed", { count: failedCount }))
        }

        if (uploaded.length > 0) {
          trackClientEvent({
            eventType: "image_uploaded",
            feature,
            sessionId,
            metadata: { count: uploaded.length },
          })
        }

        return uploaded
      },
      [tNote]
    )

    const handleSendNote = useCallback(async () => {
      if (!activeSession || !hasCurrentContent) return

      setIsSending(true)
      try {
        const draft = draftsRef.current.note
        const uploadedImages = await uploadAttachments(activeSession.id, draft.attachments, "note")
        const imageUrls = uploadedImages.map((image) => image.url)
        const storagePaths = uploadedImages
          .map((image) => image.storagePath)
          .filter((path): path is string => !!path)

        if (!draft.text.trim() && imageUrls.length === 0) return

        const noteRes = await fetch(`/api/sessions/${activeSession.id}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: draft.text.trim(),
            imageUrls,
            storagePaths,
          }),
        })

        if (!noteRes.ok) {
          throw new Error(`Failed to save note (${noteRes.status})`)
        }

        const savedNote = await noteRes.json()
        useNoteStore.getState().addNote({
          id: savedNote.id,
          content: savedNote.content,
          imageUrls: savedNote.imageUrls || [],
          storagePaths: savedNote.storagePaths || [],
          source: savedNote.source,
          createdAt: savedNote.createdAt,
        })

        const trigger = useInsightsStore.getState()._noteTrigger
        if (trigger) trigger()

        trackClientEvent({
          eventType: "note_submitted",
          feature: "note",
          sessionId: activeSession.id,
          metadata: {
            textLength: draft.text.trim().length,
            imageCount: imageUrls.length,
          },
        })

        deleteCachedSession(activeSession.id)
        clearDraft("note")
        textareaRef.current?.focus()
      } catch (error) {
        console.error("Failed to send note:", error)
        toast.error(tNote("sendNoteFailed"))
      } finally {
        setIsSending(false)
      }
    }, [activeSession, clearDraft, hasCurrentContent, tNote, uploadAttachments])

    const handleSendDocument = useCallback(async () => {
      const prompt = draftsRef.current.document.text.trim()
      if (!activeSession || !activeDocumentId || !activeDocumentSessionDocument) {
        return
      }

      if (!prompt) {
        toast.error(tComposer("documentPromptRequired"))
        return
      }

      setIsSending(true)

      let targetDocumentId = activeDocumentId
      let targetSessionDocument = activeDocumentSessionDocument

      try {
        if (targetSessionDocument.localOnly) {
          targetSessionDocument = await ensureBlankDocumentPersisted({
            sessionId: activeSession.id,
            documentId: targetDocumentId,
            fallbackTitle:
              targetSessionDocument.title ?? activeDocumentTitle,
            errorMessage: tComposer("documentReviseFailed"),
          })
          targetDocumentId = targetSessionDocument.id
        }

        const latestTargetSessionDocument = useSessionDocumentStore
          .getState()
          .getSessionDocumentById(activeSession.id, targetDocumentId)
        if (latestTargetSessionDocument) {
          targetSessionDocument = latestTargetSessionDocument
        }
      } catch (error) {
        console.error("Failed to prepare blank document for revise:", error)
        toast.error(
          error instanceof Error && error.message.trim()
            ? error.message
            : tComposer("documentReviseFailed")
        )
        setIsSending(false)
        return
      }

      setSessionDocumentUiState(activeSession.id, targetDocumentId, {
        isGenerating: true,
        lastGenerationError: null,
      })

      trackClientEvent({
        eventType: "analysis_triggered",
        feature: "custom_document",
        sessionId: activeSession.id,
        metadata: {
          templateId: targetSessionDocument.templateId,
          templateTitle: activeDocumentTitle,
          generatedAt: targetSessionDocument.generatedAt,
          trigger: "composer_revise",
        },
      })

      try {
        const generationInputs =
          targetSessionDocument.generationInputs
            ? {
                ...targetSessionDocument.generationInputs,
                clinicalContextMode: null,
              }
            : undefined
        const model = useSettingsStore.getState().aiModel.documentModel

        if (
          targetSessionDocument.templateId === BUILT_IN_BLANK_DOCUMENT_TEMPLATE_ID
        ) {
          const existingDraft = useActiveConsultationDocumentDraftStore
            .getState()
            .getDraft(activeSession.id, targetDocumentId)
          if (!existingDraft) {
            const initialDraftDocument = normalizeRichTextDocument(
              targetSessionDocument.contentJson
            )
            hydrateActiveDraft({
              sessionId: activeSession.id,
              documentId: targetDocumentId,
              draftDocument: initialDraftDocument,
              draftTitle:
                targetSessionDocument.title ??
                activeDocumentTitle,
              isStreaming: false,
              streamRequestId: null,
              dirty: false,
              lastPersistedRevision: buildDocumentRevisionKey(
                targetSessionDocument
              ),
              sanitizedHtmlBuffer: "",
              lastRenderableDocument: initialDraftDocument,
              finalReconcilePending: false,
            })
          }

          const controller = new AbortController()
          const streamRequestId = crypto.randomUUID()
          documentStreamRef.current = {
            sessionId: activeSession.id,
            documentId: targetDocumentId,
            streamRequestId,
            controller,
          }
          startStreamingDraft(activeSession.id, targetDocumentId, streamRequestId)

          const response = await fetch(
            `/api/sessions/${activeSession.id}/documents/by-id/${targetDocumentId}/ai-stream`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt,
                model,
                generationInputs,
              }),
              signal: controller.signal,
            }
          )

          if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as {
              error?: string
            }
            const errorMessage =
              payload.error === "Enter a request for the document."
                ? tComposer("documentPromptRequired")
                : payload.error === EMPTY_DOCUMENT_DRAFT_ERROR
                  ? tComposer("documentDraftEmpty")
                  : payload.error || tComposer("documentReviseFailed")
            throw new Error(errorMessage)
          }

          const reader = response.body?.getReader()
          if (!reader) {
            throw new Error(tComposer("documentReviseFailed"))
          }

          const decoder = new TextDecoder()
          let buffer = ""
          let sanitizedHtmlBuffer = ""
          let completePayload: SessionDocumentRecord | null = null
          let flushTimer: ReturnType<typeof setTimeout> | null = null
          let lastRenderableDocument =
            useActiveConsultationDocumentDraftStore
              .getState()
              .getDraft(activeSession.id, targetDocumentId)?.lastRenderableDocument ??
            useActiveConsultationDocumentDraftStore
              .getState()
              .getDraft(activeSession.id, targetDocumentId)?.draftDocument ??
            normalizeRichTextDocument(targetSessionDocument.contentJson)

          const getCurrentStreamDraft = () =>
            useActiveConsultationDocumentDraftStore
              .getState()
              .getDraft(activeSession.id, targetDocumentId)

          const isCurrentStreamActive = () =>
            getCurrentStreamDraft()?.streamRequestId === streamRequestId

          const patchStreamingDraft = (
            patch: Partial<ActiveConsultationDocumentDraft>
          ) => {
            if (!isCurrentStreamActive()) return
            patchActiveDraft(activeSession.id, targetDocumentId, {
              ...patch,
              isStreaming: true,
              streamRequestId,
              finalReconcilePending: true,
            })
          }

          const applyTitleEvent = (title: string) => {
            if (!isCurrentStreamActive()) return
            const latestDraft = getCurrentStreamDraft()
            const currentTitle =
              latestDraft?.draftTitle ??
              targetSessionDocument.title ??
              activeDocumentTitle
            if (!isSystemBlankDocumentTitle(currentTitle)) {
              return
            }

            patchStreamingDraft({
              draftTitle: title,
              dirty: true,
            })
          }

          const flushHtmlToDraft = (force = false) => {
            const apply = () => {
              if (!isCurrentStreamActive()) return
              const nextHtml = sanitizeStreamingHtml(sanitizedHtmlBuffer).trim()
              if (!nextHtml) return
              try {
                const nextDocument = htmlToRichTextDocument(nextHtml)
                if (!documentHasMeaningfulContent(nextDocument)) {
                  patchStreamingDraft({
                    sanitizedHtmlBuffer: nextHtml,
                  })
                  return
                }

                lastRenderableDocument = nextDocument
                patchStreamingDraft({
                  draftDocument: nextDocument,
                  lastRenderableDocument: nextDocument,
                  sanitizedHtmlBuffer: nextHtml,
                  dirty: true,
                })
              } catch {
                patchStreamingDraft({
                  lastRenderableDocument,
                  sanitizedHtmlBuffer: nextHtml,
                })
              }
            }

            if (force) {
              if (flushTimer) {
                clearTimeout(flushTimer)
                flushTimer = null
              }
              apply()
              return
            }

            if (flushTimer) return
            flushTimer = setTimeout(() => {
              flushTimer = null
              apply()
            }, 240)
          }

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split("\n")
              buffer = lines.pop() ?? ""

              for (const line of lines) {
                const trimmedLine = line.trim()
                if (!trimmedLine) continue

                const event = JSON.parse(trimmedLine) as DocumentStreamEvent
                if (event.type === "title") {
                  applyTitleEvent(event.title)
                  continue
                }

                if (event.type === "delta") {
                  if (!isCurrentStreamActive()) continue
                  sanitizedHtmlBuffer = sanitizeStreamingHtml(
                    `${sanitizedHtmlBuffer}${event.html}`
                  )
                  flushHtmlToDraft()
                  continue
                }

                if (event.type === "complete") {
                  completePayload = event.sessionDocument
                  break
                }

                if (event.type === "error") {
                  throw new Error(
                    event.error === EMPTY_DOCUMENT_DRAFT_ERROR
                      ? tComposer("documentDraftEmpty")
                      : event.error || tComposer("documentReviseFailed")
                  )
                }
              }

              if (completePayload) {
                break
              }
            }

            if (buffer.trim() && !completePayload) {
              const finalEvent = JSON.parse(buffer.trim()) as DocumentStreamEvent
              if (finalEvent.type === "complete") {
                completePayload = finalEvent.sessionDocument
              } else if (finalEvent.type === "error") {
                throw new Error(
                  finalEvent.error === EMPTY_DOCUMENT_DRAFT_ERROR
                    ? tComposer("documentDraftEmpty")
                    : finalEvent.error || tComposer("documentReviseFailed")
                )
              } else if (finalEvent.type === "delta") {
                sanitizedHtmlBuffer = sanitizeStreamingHtml(
                  `${sanitizedHtmlBuffer}${finalEvent.html}`
                )
              } else if (finalEvent.type === "title") {
                applyTitleEvent(finalEvent.title)
              }
            }

            flushHtmlToDraft(true)

            if (!completePayload) {
              throw new Error(tComposer("documentReviseFailed"))
            }

            if (!isCurrentStreamActive()) {
              throw new DOMException("Aborted", "AbortError")
            }

            const finalDocument = normalizeRichTextDocument(
              completePayload.contentJson
            )
            const hasMeaningfulFinalDocument =
              documentHasMeaningfulContent(finalDocument)
            const hasMeaningfulRenderableFallback =
              documentHasMeaningfulContent(lastRenderableDocument)
            if (!hasMeaningfulFinalDocument && !hasMeaningfulRenderableFallback) {
              throw new Error(tComposer("documentDraftEmpty"))
            }

            const resolvedDocument = hasMeaningfulFinalDocument
              ? finalDocument
              : lastRenderableDocument
            const resolvedPayload = hasMeaningfulFinalDocument
              ? completePayload
              : {
                  ...completePayload,
                  contentJson: resolvedDocument,
                }

            upsertSessionDocument(resolvedPayload)
            hydrateActiveDraft({
              sessionId: activeSession.id,
              documentId: resolvedPayload.id,
              draftDocument: resolvedDocument,
              draftTitle:
                resolvedPayload.title ??
                activeDocumentTitle,
              isStreaming: false,
              streamRequestId: null,
              dirty: false,
              lastPersistedRevision: buildDocumentRevisionKey(resolvedPayload),
              sanitizedHtmlBuffer: "",
              lastRenderableDocument: resolvedDocument,
              finalReconcilePending: false,
            })
            deleteCachedSession(activeSession.id)
            clearDraft("document")
            textareaRef.current?.focus()

            setSessionDocumentUiState(activeSession.id, targetDocumentId, {
              lastGenerationError: null,
              feedbackForGeneratedAt: null,
            })

            trackClientEvent({
              eventType: "analysis_completed",
              feature: "custom_document",
              sessionId: activeSession.id,
              metadata: {
                templateId: targetSessionDocument.templateId,
                templateTitle: activeDocumentTitle,
                generatedAt: resolvedPayload.generatedAt,
                trigger: "composer_revise",
              },
            })
          } finally {
            if (flushTimer) {
              clearTimeout(flushTimer)
            }
            if (
              documentStreamRef.current?.streamRequestId === streamRequestId
            ) {
              documentStreamRef.current = null
            }
          }
        } else {
          const response = await fetch(
            `/api/sessions/${activeSession.id}/documents/by-id/${targetDocumentId}/ai-revise`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt,
                model,
                generationInputs,
              }),
            }
          )

          if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as {
              error?: string
            }
            const errorMessage =
              payload.error === "Enter a request for the document."
                ? tComposer("documentPromptRequired")
                : payload.error === EMPTY_DOCUMENT_DRAFT_ERROR
                  ? tComposer("documentDraftEmpty")
                  : payload.error || tComposer("documentReviseFailed")
            throw new Error(errorMessage)
          }

          const payload = (await response.json()) as {
            sessionDocument: SessionDocumentRecord
          }

          upsertSessionDocument(payload.sessionDocument)
          hydrateActiveDraft({
            sessionId: activeSession.id,
            documentId: payload.sessionDocument.id,
            draftDocument: normalizeRichTextDocument(
              payload.sessionDocument.contentJson
            ),
            draftTitle:
              payload.sessionDocument.title ??
              activeDocumentTitle,
            isStreaming: false,
            streamRequestId: null,
            dirty: false,
            lastPersistedRevision: buildDocumentRevisionKey(
              payload.sessionDocument
            ),
            sanitizedHtmlBuffer: "",
            lastRenderableDocument: normalizeRichTextDocument(
              payload.sessionDocument.contentJson
            ),
            finalReconcilePending: false,
          })
          deleteCachedSession(activeSession.id)
          clearDraft("document")
          textareaRef.current?.focus()

          setSessionDocumentUiState(activeSession.id, targetDocumentId, {
            lastGenerationError: null,
            feedbackForGeneratedAt: null,
          })

          trackClientEvent({
            eventType: "analysis_completed",
            feature: "custom_document",
            sessionId: activeSession.id,
            metadata: {
              templateId: targetSessionDocument.templateId,
              templateTitle: activeDocumentTitle,
              generatedAt: payload.sessionDocument.generatedAt,
              trigger: "composer_revise",
            },
          })
        }
      } catch (error) {
        console.error("Failed to revise document:", error)
        const aborted =
          error instanceof DOMException && error.name === "AbortError"
        if (aborted) {
          patchActiveDraft(activeSession.id, targetDocumentId, {
            isStreaming: false,
            streamRequestId: null,
            dirty: false,
            sanitizedHtmlBuffer: "",
            finalReconcilePending: false,
          })
          if (documentStreamRef.current?.documentId === targetDocumentId) {
            documentStreamRef.current = null
          }
          return
        }

        const reason =
          error instanceof Error && error.message.trim()
            ? error.message
            : "request_error"

        patchActiveDraft(activeSession.id, targetDocumentId, {
          isStreaming: false,
          streamRequestId: null,
          dirty: false,
          sanitizedHtmlBuffer: "",
          finalReconcilePending: false,
        })
        if (documentStreamRef.current?.documentId === targetDocumentId) {
          documentStreamRef.current = null
        }

        setSessionDocumentUiState(activeSession.id, targetDocumentId, {
          lastGenerationError: reason,
        })
        trackClientEvent({
          eventType: "analysis_failed",
          feature: "custom_document",
          sessionId: activeSession.id,
          metadata: {
            templateId: targetSessionDocument.templateId,
            templateTitle: activeDocumentTitle,
            generatedAt: targetSessionDocument.generatedAt,
            trigger: "composer_revise",
            reason,
          },
        })
        toast.error(
          error instanceof Error && error.message.trim()
            ? error.message
            : tComposer("documentReviseFailed")
        )
      } finally {
        setSessionDocumentUiState(activeSession.id, targetDocumentId, {
          isGenerating: false,
        })
        setIsSending(false)
      }
    }, [
      activeDocumentId,
      activeDocumentSessionDocument,
      activeDocumentTitle,
      activeSession,
      clearDraft,
      hydrateActiveDraft,
      patchActiveDraft,
      setSessionDocumentUiState,
      startStreamingDraft,
      tComposer,
      upsertSessionDocument,
    ])

    const handleSendAiDoctor = useCallback(async () => {
      if (!activeSession || !hasCurrentContent || isAiResponding) return

      setIsSending(true)
      try {
        const draft = draftsRef.current.aiDoctor
        const uploadedImages = await uploadAttachments(
          activeSession.id,
          draft.attachments,
          "ai_doctor"
        )

        if (!draft.text.trim() && uploadedImages.length === 0) return

        clearDraft("aiDoctor")
        textareaRef.current?.focus()

        await sendMessage(
          draft.text.trim(),
          uploadedImages.length > 0 ? uploadedImages : undefined
        )

        trackClientEvent({
          eventType: "note_submitted",
          feature: "ai_doctor_message",
          sessionId: activeSession.id,
          metadata: {
            textLength: draft.text.trim().length,
            imageCount: uploadedImages.length,
          },
        })
      } catch (error) {
        console.error("Failed to send AI doctor message:", error)
        toast.error(tNote("sendMessageFailed"))
      } finally {
        setIsSending(false)
      }
    }, [
      activeSession,
      clearDraft,
      hasCurrentContent,
      isAiResponding,
      sendMessage,
      tNote,
      uploadAttachments,
    ])

    const handleSendResearch = useCallback(async () => {
      if (!activeSession || !hasCurrentContent || isStreaming) return

      setIsSending(true)
      const draft = draftsRef.current.research

      try {
        const uploadedImages = await uploadAttachments(
          activeSession.id,
          draft.attachments,
          "research"
        )
        const imageUrls = uploadedImages.map((image) => image.url)
        const storagePaths = uploadedImages
          .map((image) => image.storagePath)
          .filter((path): path is string => !!path)
        const question = draft.text.trim() || tComposer("researchImageOnlyPrompt")

        if (!question.trim() || (!draft.text.trim() && imageUrls.length === 0)) return

        addUserMessage(question, imageUrls, storagePaths)
        setStreaming(true)
        clearDraft("research")

        const controller = new AbortController()
        setAbortController(controller)

        const assistantId = addAssistantMessage()
        const { aiModel, customInstructions } = useSettingsStore.getState()

        try {
          const res = await fetch("/api/research", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: activeSession.id,
              question,
              imageUrls,
              conversationHistory: messages.map((message) => ({
                role: message.role,
                content: message.content,
              })),
              enabledConnectors: connectors,
              model: aiModel.researchModel,
              customInstructions: customInstructions.research || undefined,
              insightsContext: includeInsights
                ? {
                    summary: insights.summary,
                    keyFindings: insights.keyFindings,
                    redFlags: insights.redFlags,
                  }
                : null,
            }),
            signal: controller.signal,
          })

          if (!res.ok) {
            throw new Error(`API error: ${res.status}`)
          }

          const reader = res.body?.getReader()
          if (!reader) throw new Error("No response stream")

          const decoder = new TextDecoder()
          let accumulated = ""

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            accumulated += decoder.decode(value, { stream: true })
            updateAssistantMessage(assistantId, accumulated)
          }

          const citations = parseResearchCitations(accumulated)
          finalizeAssistantMessage(assistantId, accumulated, citations)

          const saved = await persistResearchMessagePair(
            activeSession.id,
            question,
            accumulated,
            citations,
            imageUrls,
            storagePaths
          )
          if (!saved) {
            console.error("Failed to persist research messages after retries")
            toast.error(tResearch("saveFailed"))
          }
        } catch (error) {
          if ((error as Error).name === "AbortError") {
            const current = useResearchStore
              .getState()
              .messages.find((message) => message.id === assistantId)

            if (current) {
              const citations = parseResearchCitations(current.content)
              finalizeAssistantMessage(assistantId, current.content, citations)

              const saved = await persistResearchMessagePair(
                activeSession.id,
                question,
                current.content,
                citations,
                imageUrls,
                storagePaths
              )
              if (!saved) {
                console.error("Failed to persist aborted research messages after retries")
                toast.error(tResearch("saveFailed"))
              }
            }
          } else {
            console.error("Research stream error:", error)
            updateAssistantMessage(assistantId, tResearch("responseError"))
          }
        } finally {
          setStreaming(false)
          setAbortController(null)
          textareaRef.current?.focus()
        }
      } finally {
        setIsSending(false)
      }
    }, [
      activeSession,
      addAssistantMessage,
      addUserMessage,
      clearDraft,
      connectors,
      finalizeAssistantMessage,
      hasCurrentContent,
      includeInsights,
      insights.keyFindings,
      insights.redFlags,
      insights.summary,
      isStreaming,
      messages,
      setAbortController,
      setStreaming,
      tComposer,
      tResearch,
      updateAssistantMessage,
      uploadAttachments,
    ])

    const handleSend = useCallback(() => {
      if (isResearchMode) {
        void handleSendResearch()
        return
      }

      if (isDocumentMode) {
        void handleSendDocument()
        return
      }

      if (isAiDoctorMode) {
        void handleSendAiDoctor()
        return
      }

      void handleSendNote()
    }, [
      handleSendAiDoctor,
      handleSendDocument,
      handleSendNote,
      handleSendResearch,
      isAiDoctorMode,
      isDocumentMode,
      isResearchMode,
    ])

    const handleStopResearch = useCallback(() => {
      const controller = useResearchStore.getState().abortController
      if (controller) controller.abort()
    }, [])

    const handleMicClick = useCallback(async () => {
      if (!activeSession || isSwitching || isTranscriptHydrating) return

      if (consultationMode === "ai-doctor") {
        setMicActive(!isMicActive)
        return
      }

      if (isRecording) {
        stopListening()
        return
      }

      await startListening()
    }, [
      activeSession,
      consultationMode,
      isMicActive,
      isRecording,
      isSwitching,
      isTranscriptHydrating,
      setMicActive,
      startListening,
      stopListening,
    ])

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault()
          if (isResearchMode && isStreaming) {
            handleStopResearch()
            return
          }
          handleSend()
        }
      },
      [handleSend, handleStopResearch, isResearchMode, isStreaming]
    )

    const handleDismissResearch = useCallback(() => {
      setActiveTab(lastNonResearchTab || "insights")
      requestAnimationFrame(() => textareaRef.current?.focus())
    }, [lastNonResearchTab, setActiveTab])

    const handleOpenResearch = useCallback(() => {
      setActiveTab("research")
      requestAnimationFrame(() => textareaRef.current?.focus())
    }, [setActiveTab])

    const handleToggleResearch = useCallback(() => {
      if (isResearchMode) {
        handleDismissResearch()
        return
      }

      handleOpenResearch()
    }, [handleDismissResearch, handleOpenResearch, isResearchMode])

    const handleSelectNoteMode = useCallback(() => {
      setClinicalDraftMode("note")
      if (activeTab === "research") {
        setActiveTab(lastNonResearchTab || "insights")
      }
      requestAnimationFrame(() => textareaRef.current?.focus())
    }, [activeTab, lastNonResearchTab, setActiveTab])

    const handleSelectDocumentMode = useCallback(() => {
      if (!activeSession || isSwitching) return

      if (!canSelectDocumentMode) {
        const optimisticDocument = createOptimisticBlankDocument(activeSession.id)
        openDocument(activeSession.id, optimisticDocument.id)
      }

      setClinicalDraftMode("document")
      if (activeTab !== "documents") {
        setActiveTab("documents")
      }
      requestAnimationFrame(() => textareaRef.current?.focus())
    }, [
      activeSession,
      activeTab,
      canSelectDocumentMode,
      createOptimisticBlankDocument,
      isSwitching,
      openDocument,
      setActiveTab,
    ])

    const handleClearResearchChat = useCallback(() => {
      clearMessages()
      if (activeSession) {
        fetch(`/api/sessions/${activeSession.id}/research`, {
          method: "DELETE",
        })
          .then((res) => {
            if (res.ok) {
              deleteCachedSession(activeSession.id)
            }
          })
          .catch(console.error)
      }
    }, [activeSession, clearMessages])

    const getPlaceholder = () => {
      if (!activeSession) return tComposer("placeholderNoSession")
      if (isResearchMode) return tComposer("placeholderResearch")
      if (isDocumentMode) {
        return tComposer("placeholderDocument", {
          title: activeDocumentTitle,
        })
      }
      if (isAiDoctorMode) return tComposer("placeholderAiDoctor")
      return tComposer("placeholderDefault")
    }

    const isMicDisabled =
      !activeSession ||
      isSwitching ||
      isTranscriptHydrating ||
      (consultationMode === "ai-doctor" && isAiResponding)

    const isTextareaDisabled =
      !activeSession ||
      isSwitching ||
      isSending ||
      (isResearchMode ? isStreaming : false) ||
      (isDocumentMode ? !canUseDocumentMode : false) ||
      (isAiDoctorMode ? isAiResponding : false)

    const isSendDisabled =
      !activeSession ||
      isSwitching ||
      (isDocumentMode ? !hasDocumentPrompt : !hasCurrentContent) ||
      isSending ||
      (isResearchMode ? isStreaming : false) ||
      (isDocumentMode ? !canUseDocumentMode : false) ||
      (isAiDoctorMode ? isAiResponding : false)

    const isMicActiveInUi =
      consultationMode === "ai-doctor" ? isMicActive : isRecording
    const composerActionButtonClassName = "h-8 w-8 rounded-full sm:h-9 sm:w-9"
    const composerSmallIconClassName = "size-3 sm:size-3.5"
    const composerPrimaryIconClassName = "size-3.5 sm:size-4"
    const actionMenuButtonClassName =
      "flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left text-[12px] transition-colors hover:bg-accent sm:text-[13px]"
    const actionMenuTriggerClassName =
      "h-8 rounded-full px-2.5 text-[11px] font-medium text-foreground/78 hover:bg-accent/65 hover:text-foreground sm:h-9 sm:px-3 sm:text-xs"

    const closeActionMenu = useCallback(() => {
      setIsActionMenuOpen(false)
    }, [])

    const handleOpenImagePickerFromMenu = useCallback(() => {
      closeActionMenu()
      requestAnimationFrame(() => fileInputRef.current?.click())
    }, [closeActionMenu])

    const handleClearResearchChatFromMenu = useCallback(() => {
      handleClearResearchChat()
      closeActionMenu()
    }, [closeActionMenu, handleClearResearchChat])

    const actionMenuHelperText = isDocumentMode
      ? tComposer("menuHelperDocument")
      : isResearchMode
        ? includeInsights
          ? tComposer("menuHelperResearchWithInsights")
          : tComposer("menuHelperResearch")
        : hasAttachments
          ? tComposer("menuHelperImages", { count: currentAttachments.length })
          : tComposer("menuHelperDefault")
    const selectedModeLabel = isResearchMode
      ? tComposer("toolResearch")
      : isDocumentMode
        ? tComposer("modeDocument")
        : tComposer("modeNote")
    const documentModeLabel = canSelectDocumentMode
      ? tComposer("modeDocument")
      : tDocumentsHub("blankDocumentTitle")

    return (
      <div
        data-tour="note-input"
        className="pointer-events-auto px-2.5 py-2 sm:px-4 sm:py-3"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          <div className="rounded-[24px] border border-border/70 bg-background shadow-sm sm:rounded-[28px]">
            <div className="flex flex-col gap-2.5 p-2.5 sm:gap-3 sm:p-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(event) => {
                  handleFileSelect(event.target.files)
                  event.target.value = ""
                }}
                accept="image/*"
                multiple
                className="hidden"
              />

              {hasAttachments && (
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {currentAttachments.map((attachment, index) => (
                    <div
                      key={`${attachment.preview}-${index}`}
                      className="group relative overflow-hidden rounded-xl border sm:rounded-2xl"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={attachment.preview}
                        alt={tNote("attachmentAlt")}
                        className="h-14 w-14 object-cover sm:h-16 sm:w-16"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="absolute right-1 top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 transition group-hover:opacity-100 [@media(hover:none)]:opacity-100 sm:h-5 sm:w-5"
                        aria-label={tComposer("removeImage")}
                      >
                        <IconX className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Textarea
                  ref={textareaRef}
                  placeholder={getPlaceholder()}
                  value={currentDraft.text}
                  onChange={(event) => setDraftText(currentDraftMode, event.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  disabled={isTextareaDisabled}
                  className="min-h-[60px] w-full resize-none rounded-3xl border-0 bg-transparent px-0.5 py-1 text-[15px] leading-5 shadow-none focus-visible:ring-0 sm:min-h-[72px] sm:px-1 sm:py-1.5 sm:text-[16px] sm:leading-6 md:text-sm"
                  rows={1}
                />

                <div className="flex items-end gap-2">
                  <div className="flex flex-1 justify-start">
                    <DropdownMenu
                      open={isActionMenuOpen}
                      onOpenChange={setIsActionMenuOpen}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          className={actionMenuTriggerClassName}
                          aria-label={tComposer("moreActions")}
                        >
                          <IconPlus className={composerPrimaryIconClassName} />
                          <span className="truncate">{selectedModeLabel}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="top"
                        align="start"
                        sideOffset={10}
                        className="w-[min(19rem,calc(100vw-1rem))] rounded-2xl border border-border/80 bg-background/98 p-1.5 shadow-xl backdrop-blur"
                      >
                        {consultationMode !== "ai-doctor" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectNoteMode()
                                closeActionMenu()
                              }}
                              className={cn(
                                actionMenuButtonClassName,
                                isNoteMode && "bg-primary/10 text-foreground"
                              )}
                            >
                              <IconNotes className={cn(composerSmallIconClassName, "mt-0.5 shrink-0")} />
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-medium">
                                  {tComposer("modeNote")}
                                </div>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectDocumentMode()
                                closeActionMenu()
                              }}
                              disabled={!activeSession || isSwitching}
                              className={cn(
                                actionMenuButtonClassName,
                                "disabled:pointer-events-none disabled:opacity-50",
                                isDocumentMode && "bg-primary/10 text-foreground"
                              )}
                            >
                              <IconFileText className={cn(composerSmallIconClassName, "mt-0.5 shrink-0")} />
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-medium">
                                  {documentModeLabel}
                                </div>
                              </div>
                            </button>
                          </>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => {
                            handleToggleResearch()
                            closeActionMenu()
                          }}
                          className={cn(
                            actionMenuButtonClassName,
                            isResearchActive &&
                              "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                          )}
                        >
                          <IconSearch className={cn(composerSmallIconClassName, "mt-0.5 shrink-0")} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{tComposer("toolResearch")}</div>
                          </div>
                        </button>

                        {showIncludeInsightsButton ? (
                          <button
                            type="button"
                            onClick={() => setIncludeInsights(!includeInsights)}
                            className={cn(
                              actionMenuButtonClassName,
                              includeInsights &&
                                "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                            )}
                          >
                            <IconSearch className={cn(composerSmallIconClassName, "mt-0.5 shrink-0")} />
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium">
                                {tResearch("includeInsights")}
                              </div>
                            </div>
                          </button>
                        ) : null}

                        <DropdownMenuSeparator />

                        <button
                          type="button"
                          onClick={handleOpenImagePickerFromMenu}
                          disabled={!activeSession || isSwitching || isDocumentMode}
                          className={cn(
                            actionMenuButtonClassName,
                            "disabled:pointer-events-none disabled:opacity-50"
                          )}
                        >
                          <IconPhoto className={cn(composerSmallIconClassName, "mt-0.5 shrink-0")} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{tComposer("menuAddImage")}</div>
                          </div>
                          {currentAttachments.length > 0 ? (
                            <Badge
                              variant="secondary"
                              className="mt-0.5 rounded-full px-1.5 py-0 text-[10px]"
                            >
                              {currentAttachments.length}
                            </Badge>
                          ) : null}
                        </button>

                        {showSimulationButton ? (
                          <div className="px-1 py-0.5">
                            <SimulationDialog
                              trigger={
                                <button
                                  type="button"
                                  onClick={closeActionMenu}
                                  className={actionMenuButtonClassName}
                                >
                                  <IconTestPipe className={cn(composerSmallIconClassName, "mt-0.5 shrink-0")} />
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate font-medium">
                                      {tComposer("toolSimulation")}
                                    </div>
                                  </div>
                                </button>
                              }
                            />
                          </div>
                        ) : null}

                        {isResearchMode ? (
                          <DropdownMenuSeparator />
                        ) : null}

                        {isResearchMode && (
                          <>
                            <DropdownMenuItem
                              onClick={handleClearResearchChatFromMenu}
                              disabled={messages.length === 0}
                              className="rounded-xl px-3 py-2.5 text-[12px] text-destructive focus:text-destructive"
                            >
                              <IconTrash className={cn(composerSmallIconClassName, "mt-0.5 shrink-0")} />
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-medium">
                                  {tResearch("clearChat")}
                                </div>
                              </div>
                            </DropdownMenuItem>
                          </>
                        )}

                        <DropdownMenuSeparator />
                        <div className="px-3 py-2 text-[10px] leading-4 text-muted-foreground">
                          {actionMenuHelperText}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="ml-auto flex shrink-0 items-center gap-1.5 pl-1 sm:gap-2">
                    <Button
                      type="button"
                      variant={isMicActiveInUi ? "default" : "outline"}
                      size="icon"
                      onClick={() => {
                        void handleMicClick()
                      }}
                      disabled={isMicDisabled}
                      className={cn(
                        composerActionButtonClassName,
                        isMicActiveInUi &&
                          consultationMode !== "ai-doctor" &&
                          "bg-destructive text-white hover:bg-destructive/90",
                        isMicActiveInUi &&
                          consultationMode === "ai-doctor" &&
                          "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                      aria-label={
                        consultationMode === "ai-doctor"
                          ? isMicActive
                            ? tComposer("stopVoiceInput")
                            : tComposer("startVoiceInput")
                          : isRecording
                            ? tComposer("stopRecording")
                            : tComposer("startRecording")
                      }
                    >
                      {consultationMode === "ai-doctor" ? (
                        isMicActive ? (
                          <IconMicrophone className={cn(composerPrimaryIconClassName, "animate-pulse")} />
                        ) : (
                          <IconMicrophoneOff className={composerPrimaryIconClassName} />
                        )
                      ) : isRecording ? (
                        <IconPlayerStop className={composerPrimaryIconClassName} />
                      ) : (
                        <IconMicrophone className={composerPrimaryIconClassName} />
                      )}
                    </Button>

                    {isResearchMode && isStreaming ? (
                      <Button
                        type="button"
                        size="icon"
                        onClick={handleStopResearch}
                        className={cn(
                          composerActionButtonClassName,
                          "bg-emerald-600 text-white hover:bg-emerald-500"
                        )}
                        aria-label={tComposer("stopResearch")}
                      >
                        <IconPlayerStop className={composerPrimaryIconClassName} />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="icon"
                        onClick={handleSend}
                        disabled={isSendDisabled}
                        className={cn(
                          composerActionButtonClassName,
                          isResearchMode
                            ? "bg-emerald-600 text-white hover:bg-emerald-500"
                            : ""
                        )}
                        aria-label={
                          isResearchMode
                            ? tComposer("sendResearch")
                            : isDocumentMode
                              ? tComposer("sendDocument")
                            : tComposer("sendMessage")
                        }
                      >
                        {isSending || (!isResearchMode && isAiResponding) ? (
                          <IconLoader2 className={cn(composerPrimaryIconClassName, "animate-spin")} />
                        ) : isResearchMode ? (
                          <IconSearch className={composerPrimaryIconClassName} />
                        ) : (
                          <IconArrowUp className={composerPrimaryIconClassName} />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

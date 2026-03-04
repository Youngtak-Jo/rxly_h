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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SimulationDialog } from "@/components/consultation/simulation-dialog"
import { deleteCachedSession } from "@/hooks/use-session-loader"
import { useAiDoctor } from "@/hooks/use-ai-doctor"
import { useDeepgram } from "@/hooks/use-deepgram"
import { trackClientEvent } from "@/lib/telemetry/client-events"
import { cn } from "@/lib/utils"
import { useConsultationModeStore } from "@/stores/consultation-mode-store"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useConnectorStore } from "@/stores/connector-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useNoteStore } from "@/stores/note-store"
import { useRecordingStore } from "@/stores/recording-store"
import type { ResearchCitation } from "@/stores/research-store"
import { useResearchStore } from "@/stores/research-store"
import { useSessionStore } from "@/stores/session-store"
import { useSettingsStore } from "@/stores/settings-store"
import { toast } from "sonner"
import {
  IconArrowUp,
  IconDots,
  IconLoader2,
  IconMicrophone,
  IconMicrophoneOff,
  IconPhoto,
  IconPlayerStop,
  IconSearch,
  IconTestPipe,
  IconTrash,
  IconX,
} from "@tabler/icons-react"

type DraftMode = "note" | "research" | "aiDoctor"

interface Attachment {
  file: File
  preview: string
}

interface DraftState {
  text: string
  attachments: Attachment[]
}

type DraftMap = Record<DraftMode, DraftState>

const BRACKET_CITATION_RE = /\[\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi
const MARKDOWN_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi
const URL_RE = /https?:\/\/[^\s)\]]+/gi

function createEmptyDrafts(): DraftMap {
  return {
    note: { text: "", attachments: [] },
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

function normalizeUrl(url: string): string {
  return url.trim().replace(/[.,;:]+$/, "")
}

function sourceFromUrl(url: string): ResearchCitation["source"] {
  if (url.includes("pubmed.ncbi.nlm.nih.gov")) return "pubmed"
  if (url.includes("europepmc.org")) return "europe_pmc"
  if (url.includes("icd.who.int")) return "icd11"
  if (url.includes("api.fda.gov") || url.includes("open.fda.gov")) return "openfda"
  if (url.includes("clinicaltrials.gov")) return "clinical_trials"
  if (url.includes("dailymed.nlm.nih.gov")) return "dailymed"
  return "pubmed"
}

function parseCitations(text: string): ResearchCitation[] {
  const citations: ResearchCitation[] = []
  const seen = new Set<string>()
  const sourceMap: Record<string, ResearchCitation["source"]> = {
    PUBMED: "pubmed",
    EPMC: "europe_pmc",
    "ICD-11": "icd11",
    ICD11: "icd11",
    FDA: "openfda",
    OPENFDA: "openfda",
    TRIALS: "clinical_trials",
    "CLINICALTRIALS.GOV": "clinical_trials",
    DAILYMED: "dailymed",
  }

  const addCitation = (label: string, rawUrl: string) => {
    const url = normalizeUrl(rawUrl)
    if (!url || seen.has(url)) return

    seen.add(url)
    const normalizedLabel = label.trim().toUpperCase()
    citations.push({
      source: sourceMap[normalizedLabel] || sourceFromUrl(url),
      title: label.trim() || normalizedLabel,
      url,
    })
  }

  for (const match of text.matchAll(BRACKET_CITATION_RE)) {
    addCitation(match[1], match[2])
  }

  for (const match of text.matchAll(MARKDOWN_LINK_RE)) {
    addCitation(match[1], match[2])
  }

  for (const match of text.matchAll(URL_RE)) {
    const url = normalizeUrl(match[0])
    if (!url || seen.has(url)) continue
    citations.push({
      source: sourceFromUrl(url),
      title: sourceFromUrl(url).toUpperCase(),
      url,
    })
    seen.add(url)
  }

  return citations
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

    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const draftsRef = useRef<DraftMap>(createEmptyDrafts())
    const previousSessionIdRef = useRef<string | null>(activeSession?.id ?? null)

    const [drafts, setDrafts] = useState<DraftMap>(createEmptyDrafts)
    const [isSending, setIsSending] = useState(false)

    draftsRef.current = drafts

    const isTranscriptHydrating =
      !!activeSession && hydratingSessionId === activeSession.id
    const currentDraftMode: DraftMode =
      activeTab === "research"
        ? "research"
        : consultationMode === "ai-doctor"
          ? "aiDoctor"
          : "note"
    const currentDraft = drafts[currentDraftMode]
    const currentAttachments = currentDraft.attachments
    const hasCurrentContent =
      currentDraft.text.trim().length > 0 || currentAttachments.length > 0
    const isResearchMode = currentDraftMode === "research"
    const isAiDoctorMode = currentDraftMode === "aiDoctor"
    const hasAttachments = currentAttachments.length > 0
    const showSimulationButton = !isResearchMode
    const showIncludeInsightsButton = isResearchMode
    const isImageActive = hasAttachments
    const isResearchActive = isResearchMode
    const imageButtonLabel = isImageActive
      ? `${tComposer("toolImage")} ${currentAttachments.length}`
      : tComposer("toolImage")

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
      previousSessionIdRef.current = nextSessionId
    }, [activeSession?.id])

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
      [handleFileSelect]
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

          const citations = parseCitations(accumulated)
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
              const citations = parseCitations(current.content)
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

      if (isAiDoctorMode) {
        void handleSendAiDoctor()
        return
      }

      void handleSendNote()
    }, [handleSendAiDoctor, handleSendNote, handleSendResearch, isAiDoctorMode, isResearchMode])

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
      (isAiDoctorMode ? isAiResponding : false)

    const isSendDisabled =
      !activeSession ||
      isSwitching ||
      !hasCurrentContent ||
      isSending ||
      (isResearchMode ? isStreaming : false) ||
      (isAiDoctorMode ? isAiResponding : false)

    const isMicActiveInUi =
      consultationMode === "ai-doctor" ? isMicActive : isRecording

    return (
      <div
        data-tour="note-input"
        className="pointer-events-auto px-3 py-3 sm:px-4"
      >
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          <div className="rounded-[28px] border border-border/70 bg-background shadow-sm">
            <div className="flex flex-col gap-3 p-3 sm:p-4">
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
                <div className="flex flex-wrap gap-2">
                  {currentAttachments.map((attachment, index) => (
                    <div
                      key={`${attachment.preview}-${index}`}
                      className="group relative overflow-hidden rounded-2xl border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={attachment.preview}
                        alt={tNote("attachmentAlt")}
                        className="h-16 w-16 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 transition group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                        aria-label={tComposer("removeImage")}
                      >
                        <IconX className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                <Textarea
                  ref={textareaRef}
                  placeholder={getPlaceholder()}
                  value={currentDraft.text}
                  onChange={(event) => setDraftText(currentDraftMode, event.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  disabled={isTextareaDisabled}
                  className="min-h-[72px] w-full resize-none rounded-3xl border-0 bg-transparent px-1 py-1.5 text-[16px] leading-6 shadow-none focus-visible:ring-0 md:text-sm"
                  rows={1}
                />

                <div className="flex items-end justify-between gap-3">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleToggleResearch}
                      className={cn(
                        "h-9 rounded-full border-border/70 bg-background px-3 text-xs",
                        isResearchActive &&
                          "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/60"
                      )}
                    >
                      <IconSearch className="size-3.5" />
                      {tComposer("toolResearch")}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!activeSession || isSwitching}
                      className={cn(
                        "h-9 rounded-full border-border/70 bg-background px-3 text-xs",
                        isImageActive &&
                          "border-primary/30 bg-primary/10 text-foreground hover:bg-primary/15"
                      )}
                    >
                      <IconPhoto className="size-3.5" />
                      {imageButtonLabel}
                    </Button>

                    {showIncludeInsightsButton && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIncludeInsights(!includeInsights)}
                        className={cn(
                          "h-9 rounded-full border-border/70 bg-background px-3 text-xs",
                          includeInsights &&
                            "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/60"
                        )}
                      >
                        <IconSearch className="size-3.5" />
                        {tResearch("includeInsights")}
                      </Button>
                    )}

                    {showSimulationButton && (
                      <SimulationDialog
                        trigger={
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-full border-border/70 bg-background px-3 text-xs"
                          >
                            <IconTestPipe className="size-3.5" />
                            {tComposer("toolSimulation")}
                          </Button>
                        }
                      />
                    )}

                    {isResearchMode && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-muted-foreground"
                            aria-label={tComposer("moreActions")}
                          >
                            <IconDots className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" align="start">
                          <DropdownMenuItem
                            onClick={handleClearResearchChat}
                            disabled={messages.length === 0}
                            className="text-destructive focus:text-destructive"
                          >
                            <IconTrash className="size-4" />
                            {tResearch("clearChat")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      variant={isMicActiveInUi ? "default" : "outline"}
                      size="icon"
                      onClick={() => {
                        void handleMicClick()
                      }}
                      disabled={isMicDisabled}
                      className={cn(
                        "h-9 w-9 rounded-full",
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
                          <IconMicrophone className="size-4 animate-pulse" />
                        ) : (
                          <IconMicrophoneOff className="size-4" />
                        )
                      ) : isRecording ? (
                        <IconPlayerStop className="size-4" />
                      ) : (
                        <IconMicrophone className="size-4" />
                      )}
                    </Button>

                    {isResearchMode && isStreaming ? (
                      <Button
                        type="button"
                        size="icon"
                        onClick={handleStopResearch}
                        className="h-9 w-9 rounded-full bg-emerald-600 text-white hover:bg-emerald-500"
                        aria-label={tComposer("stopResearch")}
                      >
                        <IconPlayerStop className="size-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="icon"
                        onClick={handleSend}
                        disabled={isSendDisabled}
                        className={cn(
                          "h-9 w-9 rounded-full",
                          isResearchMode
                            ? "bg-emerald-600 text-white hover:bg-emerald-500"
                            : ""
                        )}
                        aria-label={
                          isResearchMode
                            ? tComposer("sendResearch")
                            : tComposer("sendMessage")
                        }
                      >
                        {isSending || (!isResearchMode && isAiResponding) ? (
                          <IconLoader2 className="size-4 animate-spin" />
                        ) : isResearchMode ? (
                          <IconSearch className="size-4" />
                        ) : (
                          <IconArrowUp className="size-4" />
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

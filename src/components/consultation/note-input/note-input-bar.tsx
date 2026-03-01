"use client"

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useSessionStore } from "@/stores/session-store"
import { useNoteStore } from "@/stores/note-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useConsultationModeStore } from "@/stores/consultation-mode-store"
import { useAiDoctor } from "@/hooks/use-ai-doctor"
import { deleteCachedSession } from "@/hooks/use-session-loader"
import {
  IconPaperclip,
  IconSend,
  IconX,
  IconLoader2,
  IconMicrophone,
  IconMicrophoneOff,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { trackClientEvent } from "@/lib/telemetry/client-events"

interface Attachment {
  file: File
  preview: string
}

export interface NoteInputBarHandle {
  addFiles: (files: FileList) => void
}

export const NoteInputBar = forwardRef<NoteInputBarHandle>(function NoteInputBar(_props, ref) {
  const t = useTranslations("NoteInputBar")
  const [text, setText] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isSending, setIsSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const activeSession = useSessionStore((s) => s.activeSession)

  const mode = useConsultationModeStore((s) => s.mode)
  const isAiResponding = useConsultationModeStore((s) => s.isAiResponding)
  const isMicActive = useConsultationModeStore((s) => s.isMicActive)
  const setMicActive = useConsultationModeStore((s) => s.setMicActive)

  const { sendMessage } = useAiDoctor()

  const isAiDoctorMode = mode === "ai-doctor"
  const isAiDoctorActive = isAiDoctorMode

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      attachments.forEach((a) => URL.revokeObjectURL(a.preview))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return
      const newAttachments: Attachment[] = []
      Array.from(files).forEach((file) => {
        if (!file.type.startsWith("image/")) {
          toast.error(t("onlyImages"))
          return
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(t("fileTooLarge"))
          return
        }
        newAttachments.push({
          file,
          preview: URL.createObjectURL(file),
        })
      })
      setAttachments((prev) => [...prev, ...newAttachments])
    },
    [t]
  )

  useImperativeHandle(ref, () => ({
    addFiles: (files: FileList) => handleFileSelect(files),
  }), [handleFileSelect])

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      const imageItems = Array.from(items).filter(
        (item) => item.kind === "file" && item.type.startsWith("image/")
      )
      if (imageItems.length > 0) {
        e.preventDefault()
        const files = imageItems
          .map((item) => item.getAsFile())
          .filter(Boolean) as File[]
        const dt = new DataTransfer()
        files.forEach((f) => dt.items.add(f))
        handleFileSelect(dt.files)
      }
    },
    [handleFileSelect]
  )

  const uploadAttachments = useCallback(
    async (sessionId: string): Promise<Array<{ url: string; storagePath?: string }>> => {
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
          (result): result is PromiseFulfilledResult<{ url: string; storagePath: string | undefined }> =>
            result.status === "fulfilled"
        )
        .map((result) => result.value)

      const failedCount = uploadResults.length - uploaded.length
      if (failedCount > 0) {
        console.warn(`Failed to upload ${failedCount} attachment(s)`)
        toast.error(t("imageUploadFailed", { count: failedCount }))
      }

      return uploaded
    },
    [attachments, t]
  )

  const handleSendNote = async () => {
    if ((!text.trim() && attachments.length === 0) || !activeSession) return
    setIsSending(true)

    try {
      // Upload images first (to Supabase Storage)
      const uploadedImages = await uploadAttachments(activeSession.id)
      const imageUrls = uploadedImages.map((image) => image.url)
      const storagePaths = uploadedImages
        .map((image) => image.storagePath)
        .filter((path): path is string => !!path)

      if (imageUrls.length > 0) {
        trackClientEvent({
          eventType: "image_uploaded",
          feature: "note",
          sessionId: activeSession.id,
          metadata: { count: imageUrls.length },
        })
      }

      // Send note to DB
      const noteRes = await fetch(`/api/sessions/${activeSession.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text.trim(),
          imageUrls,
          storagePaths,
        }),
      })

      if (noteRes.ok) {
        const savedNote = await noteRes.json()
        // Add to client-side note store for immediate UI display
        useNoteStore.getState().addNote({
          id: savedNote.id,
          content: savedNote.content,
          imageUrls: savedNote.imageUrls || [],
          storagePaths: savedNote.storagePaths || [],
          source: savedNote.source,
          createdAt: savedNote.createdAt,
        })

        // Trigger immediate AI re-analysis
        const trigger = useInsightsStore.getState()._noteTrigger
        if (trigger) trigger()

        trackClientEvent({
          eventType: "note_submitted",
          feature: "note",
          sessionId: activeSession.id,
          metadata: {
            textLength: text.trim().length,
            imageCount: imageUrls.length,
          },
        })
        deleteCachedSession(activeSession.id)
      }

      setText("")
      setAttachments((prev) => {
        prev.forEach((a) => URL.revokeObjectURL(a.preview))
        return []
      })
      textareaRef.current?.focus()
    } catch (error) {
      console.error("Failed to send note:", error)
      toast.error(t("sendNoteFailed"))
    } finally {
      setIsSending(false)
    }
  }

  const handleSendAiDoctor = async () => {
    if ((!text.trim() && attachments.length === 0) || !activeSession || isAiResponding) return
    setIsSending(true)

    try {
      // Upload images first (reuse same Supabase upload flow)
      const uploadedImages = await uploadAttachments(activeSession.id)

      if (uploadedImages.length > 0) {
        trackClientEvent({
          eventType: "image_uploaded",
          feature: "ai_doctor",
          sessionId: activeSession.id,
          metadata: { count: uploadedImages.length },
        })
      }

      const message = text.trim()
      setText("")
      setAttachments((prev) => {
        prev.forEach((a) => URL.revokeObjectURL(a.preview))
        return []
      })
      textareaRef.current?.focus()

      await sendMessage(
        message,
        uploadedImages.length > 0 ? uploadedImages : undefined
      )

      trackClientEvent({
        eventType: "note_submitted",
        feature: "ai_doctor_message",
        sessionId: activeSession.id,
        metadata: {
          textLength: message.length,
          imageCount: uploadedImages.length,
        },
      })
    } catch (error) {
      console.error("Failed to send AI doctor message:", error)
      toast.error(t("sendMessageFailed"))
    } finally {
      setIsSending(false)
    }
  }

  const handleSend = () => {
    if (isAiDoctorActive) {
      handleSendAiDoctor()
    } else {
      handleSendNote()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getPlaceholder = () => {
    if (!activeSession) return t("placeholderNoSession")
    if (isAiDoctorMode) return t("placeholderAiDoctor")
    return t("placeholderDefault")
  }

  const isSendDisabled =
    (!text.trim() && attachments.length === 0) ||
    !activeSession ||
    isSending ||
    (isAiDoctorActive && isAiResponding)

  return (
    <div data-tour="note-input" className="border-t p-3">
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {attachments.map((attachment, i) => (
            <div key={i} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachment.preview}
                alt={t("attachmentAlt")}
                className="h-16 w-16 rounded-md object-cover border"
              />
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity [@media(hover:none)]:opacity-100"
              >
                <IconX className="size-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFileSelect(e.target.files)}
          accept="image/*"
          multiple
          className="hidden"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={!activeSession}
        >
          <IconPaperclip className="size-4" />
        </Button>
        <Textarea
          ref={textareaRef}
          placeholder={getPlaceholder()}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={
            !activeSession ||
            isSending ||
            isAiResponding
          }
          className="min-h-9 max-h-[120px] resize-none py-1.5 text-[16px] leading-5 md:text-sm"
          rows={1}
        />
        <Button
          onClick={handleSend}
          size="icon"
          className="h-9 w-9 shrink-0"
          disabled={isSendDisabled}
        >
          {isSending || isAiResponding ? (
            <IconLoader2 className="size-4 animate-spin" />
          ) : (
            <IconSend className="size-4" />
          )}
        </Button>

        {/* Mic toggle button - available in AI doctor mode */}
        {isAiDoctorMode && (
          <Button
            variant={isMicActive ? "default" : "ghost"}
            size="icon"
            className={cn(
              "h-9 w-9 shrink-0",
              isMicActive && "bg-primary text-primary-foreground"
            )}
            onClick={() => setMicActive(!isMicActive)}
            disabled={isAiResponding}
          >
            {isMicActive ? (
              <IconMicrophone className="size-4 animate-pulse" />
            ) : (
              <IconMicrophoneOff className="size-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  )
})

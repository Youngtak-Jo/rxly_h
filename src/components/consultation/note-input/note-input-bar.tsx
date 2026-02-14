"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useSessionStore } from "@/stores/session-store"
import { useNoteStore } from "@/stores/note-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useDdxStore } from "@/stores/ddx-store"
import { useConsultationModeStore } from "@/stores/consultation-mode-store"
import { useAiDoctor } from "@/hooks/use-ai-doctor"
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

interface Attachment {
  file: File
  preview: string
}

export function NoteInputBar() {
  const [text, setText] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isSending, setIsSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const activeSession = useSessionStore((s) => s.activeSession)

  const mode = useConsultationModeStore((s) => s.mode)
  const consultationStarted = useConsultationModeStore(
    (s) => s.consultationStarted
  )
  const isAiResponding = useConsultationModeStore((s) => s.isAiResponding)
  const isMicActive = useConsultationModeStore((s) => s.isMicActive)
  const setMicActive = useConsultationModeStore((s) => s.setMicActive)

  const { sendMessage } = useAiDoctor()

  const isAiDoctorMode = mode === "ai-doctor"
  const isAiDoctorActive = isAiDoctorMode && consultationStarted

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
          toast.error("Only image files are supported")
          return
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error("File size must be under 10MB")
          return
        }
        newAttachments.push({
          file,
          preview: URL.createObjectURL(file),
        })
      })
      setAttachments((prev) => [...prev, ...newAttachments])
    },
    []
  )

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

  const handleSendNote = async () => {
    if ((!text.trim() && attachments.length === 0) || !activeSession) return
    setIsSending(true)

    try {
      // Upload images first (to Supabase Storage)
      const imageUrls: string[] = []
      const storagePaths: string[] = []
      for (const attachment of attachments) {
        const formData = new FormData()
        formData.append("file", attachment.file)
        formData.append("sessionId", activeSession.id)
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        if (res.ok) {
          const data = await res.json()
          imageUrls.push(data.url)
          if (data.path) storagePaths.push(data.path)
        }
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

        // Trigger DDx re-analysis
        const ddxTrigger = useDdxStore.getState()._noteTrigger
        if (ddxTrigger) ddxTrigger()
      }

      setText("")
      setAttachments((prev) => {
        prev.forEach((a) => URL.revokeObjectURL(a.preview))
        return []
      })
      textareaRef.current?.focus()
    } catch (error) {
      console.error("Failed to send note:", error)
      toast.error("Failed to send note")
    } finally {
      setIsSending(false)
    }
  }

  const handleSendAiDoctor = async () => {
    if ((!text.trim() && attachments.length === 0) || !activeSession || isAiResponding) return
    setIsSending(true)

    try {
      // Upload images first (reuse same Supabase upload flow)
      const imageUrls: string[] = []
      for (const attachment of attachments) {
        const formData = new FormData()
        formData.append("file", attachment.file)
        formData.append("sessionId", activeSession.id)
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        if (res.ok) {
          const data = await res.json()
          imageUrls.push(data.url)
        }
      }

      const message = text.trim()
      setText("")
      setAttachments((prev) => {
        prev.forEach((a) => URL.revokeObjectURL(a.preview))
        return []
      })
      textareaRef.current?.focus()

      await sendMessage(message, imageUrls.length > 0 ? imageUrls : undefined)
    } catch (error) {
      console.error("Failed to send AI doctor message:", error)
      toast.error("Failed to send message")
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
    if (!activeSession) return "Start a session first..."
    if (isAiDoctorActive) return "Type your message..."
    if (isAiDoctorMode) return "Start the AI consultation first..."
    return "Add a note to the consultation..."
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
              <img
                src={attachment.preview}
                alt="Attachment"
                className="h-16 w-16 rounded-md object-cover border"
              />
              <button
                onClick={() => removeAttachment(i)}
                className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
            (isAiDoctorMode && !consultationStarted) ||
            isAiResponding
          }
          className="min-h-[36px] max-h-[120px] resize-none text-sm"
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

        {/* Mic toggle button - only in AI doctor mode when consultation started */}
        {isAiDoctorActive && (
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
}

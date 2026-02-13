"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useSessionStore } from "@/stores/session-store"
import { useNoteStore } from "@/stores/note-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useDdxStore } from "@/stores/ddx-store"
import {
  IconPaperclip,
  IconSend,
  IconX,
  IconLoader2,
} from "@tabler/icons-react"
import { toast } from "sonner"

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

  const handleSend = async () => {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t p-3">
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
          placeholder={
            activeSession
              ? "Add a note to the consultation..."
              : "Start a session first..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={!activeSession || isSending}
          className="min-h-[36px] max-h-[120px] resize-none text-sm"
          rows={1}
        />
        <Button
          onClick={handleSend}
          size="icon"
          className="h-9 w-9 shrink-0"
          disabled={
            (!text.trim() && attachments.length === 0) ||
            !activeSession ||
            isSending
          }
        >
          {isSending ? (
            <IconLoader2 className="size-4 animate-spin" />
          ) : (
            <IconSend className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

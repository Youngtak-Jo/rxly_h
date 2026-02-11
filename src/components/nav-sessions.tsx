"use client"

import { useState, useRef, useEffect } from "react"
import {
  IconDots,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"

import { useSessionStore } from "@/stores/session-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useRecordStore } from "@/stores/record-store"
import { useRecordingStore } from "@/stores/recording-store"
import { useNoteStore } from "@/stores/note-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
function formatShortTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo`
  return `${Math.floor(days / 365)}y`
}

export function NavSessions() {
  const { sessions, activeSession, setActiveSession, addSession, setSessions } =
    useSessionStore()
  const transcriptStore = useTranscriptStore()
  const insightsStore = useInsightsStore()
  const recordStore = useRecordStore()
  const recordingStore = useRecordingStore()
  const noteStore = useNoteStore()

  const createSession = async () => {
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Consultation" }),
      })
      if (!res.ok) throw new Error("Failed to create session")
      const session = await res.json()
      addSession(session)
      setActiveSession(session)
      transcriptStore.reset()
      insightsStore.reset()
      recordStore.reset()
      recordingStore.reset()
      noteStore.reset()
    } catch (error) {
      console.error("Failed to create session:", error)
    }
  }

  const loadSession = async (sessionId: string) => {
    if (activeSession?.id === sessionId) return
    try {
      const res = await fetch(`/api/sessions/${sessionId}`)
      if (!res.ok) throw new Error("Failed to load session")
      const session = await res.json()
      setActiveSession(session)
      transcriptStore.reset()
      insightsStore.reset()
      recordStore.reset()
      recordingStore.reset()
      noteStore.reset()

      const transcriptRes = await fetch(
        `/api/sessions/${sessionId}/transcript`
      )
      if (transcriptRes.ok) {
        const entries = await transcriptRes.json()
        transcriptStore.loadEntries(entries)
      }

      // Load insights + checklist
      if (session.insights) {
        insightsStore.loadFromDB({
          summary: session.insights.summary,
          keyFindings: session.insights.keyFindings,
          redFlags: session.insights.redFlags,
          checklistItems: session.checklistItems || [],
        })
      }

      // Load record
      if (session.record) {
        recordStore.loadFromDB(session.record)
      }

      // Load notes
      try {
        const notesRes = await fetch(`/api/sessions/${sessionId}/notes`)
        if (notesRes.ok) {
          const notes = await notesRes.json()
          noteStore.loadNotes(
            notes.map((n: { id: string; content: string; imageUrls: string[]; source: string; createdAt: string }) => ({
              id: n.id,
              content: n.content,
              imageUrls: n.imageUrls || [],
              storagePaths: [],
              source: n.source as "MANUAL" | "STT" | "IMAGE",
              createdAt: n.createdAt,
            }))
          )
        }
      } catch {
        // Continue without notes
      }
    } catch (error) {
      console.error("Failed to load session:", error)
    }
  }

  const deleteSession = async (sessionId: string) => {
    try {
      await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" })
      setSessions(sessions.filter((s) => s.id !== sessionId))
      if (activeSession?.id === sessionId) {
        setActiveSession(null)
        transcriptStore.reset()
        insightsStore.reset()
        recordStore.reset()
        noteStore.reset()
      }
    } catch (error) {
      console.error("Failed to delete session:", error)
    }
  }

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId) inputRef.current?.focus()
  }, [editingId])

  const startRename = (sessionId: string, currentTitle: string) => {
    setEditingId(sessionId)
    setEditingTitle(currentTitle || "Untitled Session")
  }

  const commitRename = async () => {
    if (!editingId) return
    const trimmed = editingTitle.trim()
    if (trimmed) {
      try {
        await fetch(`/api/sessions/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmed }),
        })
        setSessions(
          sessions.map((s) =>
            s.id === editingId ? { ...s, title: trimmed } : s
          )
        )
        if (activeSession?.id === editingId) {
          setActiveSession({ ...activeSession, title: trimmed })
        }
      } catch (error) {
        console.error("Failed to rename session:", error)
      }
    }
    setEditingId(null)
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Sessions</SidebarGroupLabel>
      <SidebarGroupAction onClick={createSession} title="New Session">
        <IconPlus />
      </SidebarGroupAction>
      <SidebarMenu>
        {sessions.length === 0 && (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            No sessions yet. Click + to start.
          </div>
        )}
        {sessions.map((session) => (
          <SidebarMenuItem key={session.id}>
            {editingId === session.id ? (
              <input
                ref={inputRef}
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename()
                  if (e.key === "Escape") setEditingId(null)
                }}
                className="h-8 w-full rounded-md border bg-background px-2 text-sm outline-none"
              />
            ) : (
              <SidebarMenuButton
                isActive={activeSession?.id === session.id}
                onClick={() => loadSession(session.id)}
                className="group/session"
              >
                <span className="truncate">
                  {session.title || "Untitled Session"}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="ml-auto flex-shrink-0">
                      <span className="text-xs text-muted-foreground group-hover/session:hidden">
                        {formatShortTimeAgo(new Date(session.startedAt))}
                      </span>
                      <span className="hidden group-hover/session:flex items-center justify-center rounded-md hover:bg-sidebar-accent size-5">
                        <IconDots className="size-4" />
                      </span>
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start">
                    <DropdownMenuItem
                      onClick={() =>
                        startRename(session.id, session.title ?? "")
                      }
                    >
                      <IconPencil className="mr-2 size-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteSession(session.id)}
                      className="text-destructive"
                    >
                      <IconTrash className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

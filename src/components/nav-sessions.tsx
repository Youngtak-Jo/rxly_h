"use client"

import { useState, useRef, useEffect } from "react"
import {
  IconDots,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"
import { v4 as uuidv4 } from "uuid"

import { useSessionStore } from "@/stores/session-store"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useRecordStore } from "@/stores/record-store"
import { useRecordingStore } from "@/stores/recording-store"
import { useNoteStore } from "@/stores/note-store"
import { useDdxStore } from "@/stores/ddx-store"
import { useResearchStore } from "@/stores/research-store"
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
  const ddxStore = useDdxStore()
  const researchStore = useResearchStore()

  const createSession = async () => {
    const tempId = uuidv4()
    const now = new Date().toISOString()
    const optimisticSession = {
      id: tempId,
      title: "New Consultation",
      patientName: null,
      startedAt: now,
      endedAt: null,
      createdAt: now,
      updatedAt: now,
    }

    addSession(optimisticSession)
    setActiveSession(optimisticSession)
    transcriptStore.reset()
    insightsStore.reset()
    ddxStore.reset()
    recordStore.reset()
    recordingStore.reset()
    noteStore.reset()
    researchStore.reset()
    useConsultationTabStore.getState().clearAllUnseenUpdates()

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Consultation" }),
      })
      if (!res.ok) throw new Error("Failed to create session")
      const realSession = await res.json()

      const store = useSessionStore.getState()
      store.setSessions(
        store.sessions.map((s) => (s.id === tempId ? realSession : s))
      )
      if (store.activeSession?.id === tempId) {
        store.setActiveSession(realSession)
      }
    } catch (error) {
      console.error("Failed to create session:", error)
      const store = useSessionStore.getState()
      store.setSessions(store.sessions.filter((s) => s.id !== tempId))
      if (store.activeSession?.id === tempId) {
        store.setActiveSession(null)
      }
    }
  }

  const loadSession = async (sessionId: string) => {
    if (activeSession?.id === sessionId) return

    useSessionStore.getState().setLoading(true)

    try {
      const res = await fetch(`/api/sessions/${sessionId}/full`)
      if (!res.ok) throw new Error("Failed to load session")
      const { session, transcriptEntries, notes, researchMessages } = await res.json()

      transcriptStore.reset()
      insightsStore.reset()
      ddxStore.reset()
      recordStore.reset()
      recordingStore.reset()
      noteStore.reset()
      researchStore.reset()
      useConsultationTabStore.getState().clearAllUnseenUpdates()

      setActiveSession(session)

      if (transcriptEntries?.length > 0) {
        transcriptStore.loadEntries(transcriptEntries)
      }

      // Restore diagnostic keyword highlights from DB
      const savedKeywords = session.insights?.diagnosticKeywords
      if (Array.isArray(savedKeywords) && savedKeywords.length > 0) {
        transcriptStore.setDiagnosticKeywords(savedKeywords)
      }

      if (session.insights) {
        insightsStore.loadFromDB({
          summary: session.insights.summary,
          keyFindings: session.insights.keyFindings,
          redFlags: session.insights.redFlags,
          checklistItems: session.checklistItems || [],
        })
      }

      if (session.diagnoses && session.diagnoses.length > 0) {
        ddxStore.loadFromDB(
          session.diagnoses.map(
            (dx: {
              id: string
              sessionId: string
              icdCode: string
              icdUri?: string
              diseaseName: string
              confidence: string
              evidence: string
              citations: unknown
              sortOrder: number
            }) => ({
              id: dx.id,
              sessionId: dx.sessionId,
              icdCode: dx.icdCode,
              icdUri: dx.icdUri,
              diseaseName: dx.diseaseName,
              confidence: dx.confidence.toLowerCase() as
                | "high"
                | "moderate"
                | "low",
              evidence: dx.evidence,
              citations: dx.citations || [],
              sortOrder: dx.sortOrder,
            })
          )
        )
      }

      if (session.record) {
        recordStore.loadFromDB(session.record)
      }

      if (notes?.length > 0) {
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

      if (researchMessages?.length > 0) {
        researchStore.loadFromDB(
          researchMessages.map(
            (m: { id: string; role: string; content: string; citations: unknown; createdAt: string }) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
              citations: (typeof m.citations === "string" ? JSON.parse(m.citations) : m.citations) || [],
              createdAt: m.createdAt,
            })
          )
        )
      }
    } catch (error) {
      console.error("Failed to load session:", error)
    } finally {
      useSessionStore.getState().setLoading(false)
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
        ddxStore.reset()
        recordStore.reset()
        noteStore.reset()
        researchStore.reset()
        useConsultationTabStore.getState().clearAllUnseenUpdates()
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
                className="group/session h-auto items-start py-2"
              >
                <span className="line-clamp-2">
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

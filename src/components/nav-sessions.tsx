"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  IconBulb,
  IconDots,
  IconFileText,
  IconLoader2,
  IconPencil,
  IconPlus,
  IconSearch,
  IconStethoscope,
  IconTrash,
} from "@tabler/icons-react"
import { v4 as uuidv4 } from "uuid"
import { toast } from "sonner"

import { useSessionStore } from "@/stores/session-store"
import type { Session } from "@/types/session"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useRecordStore } from "@/stores/record-store"
import { useRecordingStore } from "@/stores/recording-store"
import { useNoteStore } from "@/stores/note-store"
import { useDdxStore } from "@/stores/ddx-store"
import { useResearchStore } from "@/stores/research-store"
import { useConsultationModeStore } from "@/stores/consultation-mode-store"
import {
  loadSessionById,
  getCachedSession,
  setCachedSession,
  deleteCachedSession,
} from "@/hooks/use-session-loader"
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
  const router = useRouter()
  const { sessions, activeSession, setActiveSession, addSession, setSessions } =
    useSessionStore()
  const transcriptStore = useTranscriptStore()
  const insightsStore = useInsightsStore()
  const recordStore = useRecordStore()
  const recordingStore = useRecordingStore()
  const noteStore = useNoteStore()
  const ddxStore = useDdxStore()
  const researchStore = useResearchStore()

  // Prefetch session data on hover (debounced)
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prefetchingRef = useRef<Set<string>>(new Set())

  const prefetchSession = (sessionId: string) => {
    if (activeSession?.id === sessionId) return
    if (getCachedSession(sessionId)) return
    if (prefetchingRef.current.has(sessionId)) return

    prefetchingRef.current.add(sessionId)
    fetch(`/api/sessions/${sessionId}/full`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setCachedSession(sessionId, data))
      .catch(() => { })
      .finally(() => prefetchingRef.current.delete(sessionId))
  }

  // Tab state for sub-items
  const { activeTab, setActiveTab, unseenUpdates } = useConsultationTabStore()
  const diagnosisCount = useDdxStore((s) => s.diagnoses.length)
  const isDdxProcessing = useDdxStore((s) => s.isProcessing)
  const isInsightsProcessing = useInsightsStore((s) => s.isProcessing)
  const isRecordGenerating = useRecordStore((s) => s.isGenerating)
  const isResearchStreaming = useResearchStore((s) => s.isStreaming)

  const createSession = async () => {
    // Stop any running simulation BEFORE resetting stores
    const recState = useRecordingStore.getState()
    if (recState.isSimulating && recState.simulationControls) {
      recState.simulationControls.stop({ skipFinalAnalysis: true })
    }

    const tempId = uuidv4()
    const now = new Date().toISOString()
    const optimisticSession: Session = {
      id: tempId,
      title: "New Consultation",
      patientName: null,
      mode: "DOCTOR",
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
    useConsultationModeStore.getState().reset()
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
      router.push(`/consultation/${realSession.id}`)
    } catch (error) {
      console.error("Failed to create session:", error)
      toast.error("Failed to create session")
      const store = useSessionStore.getState()
      store.setSessions(store.sessions.filter((s) => s.id !== tempId))
      if (store.activeSession?.id === tempId) {
        store.setActiveSession(null)
      }
    }
  }

  const loadSession = async (sessionId: string) => {
    if (activeSession?.id === sessionId) return
    await loadSessionById(sessionId)
    router.push(`/consultation/${sessionId}`)
  }

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const deleteSession = async (sessionId: string) => {
    setDeletingId(sessionId)

    // 1. Abort in-flight analysis BEFORE delete to prevent race conditions
    if (activeSession?.id === sessionId) {
      const recState = useRecordingStore.getState()
      if (recState.isSimulating && recState.simulationControls) {
        recState.simulationControls.stop({ skipFinalAnalysis: true })
      }
      setActiveSession(null) // Triggers hook cleanup → aborts in-flight AI calls
      transcriptStore.reset()
      insightsStore.reset()
      ddxStore.reset()
      recordStore.reset()
      recordingStore.reset()
      noteStore.reset()
      researchStore.reset()
      useConsultationModeStore.getState().reset()
      useConsultationTabStore.getState().clearAllUnseenUpdates()
    }

    // 2. Optimistic UI removal
    const previousSessions = sessions
    setSessions(sessions.filter((s) => s.id !== sessionId))
    deleteCachedSession(sessionId)

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      // Navigate back to base consultation if we just deleted the active session
      if (activeSession?.id === sessionId) {
        router.replace("/consultation")
      }
    } catch (error) {
      // Rollback on failure
      console.error("Failed to delete session:", error)
      setSessions(previousSessions)
      toast.error("Failed to delete session")
    } finally {
      setDeletingId(null)
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
        toast.error("Failed to rename session")
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
        {sessions.map((session) => {
          const isActive = activeSession?.id === session.id
          return (
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
                  isActive={isActive}
                  onClick={() => loadSession(session.id)}
                  onMouseEnter={() => {
                    if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current)
                    prefetchTimerRef.current = setTimeout(() => prefetchSession(session.id), 300)
                  }}
                  onMouseLeave={() => {
                    if (prefetchTimerRef.current) {
                      clearTimeout(prefetchTimerRef.current)
                      prefetchTimerRef.current = null
                    }
                  }}
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
                      <span className="ml-auto flex flex-col items-end flex-shrink-0">
                        <span className="text-xs text-muted-foreground hidden md:inline group-hover/session:hidden">
                          {formatShortTimeAgo(new Date(session.startedAt))}
                        </span>
                        <span className="flex md:hidden group-hover/session:flex items-center justify-center rounded-md hover:bg-sidebar-accent size-5">
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
                        disabled={!!deletingId}
                        className="text-destructive"
                      >
                        {deletingId === session.id ? (
                          <IconLoader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                          <IconTrash className="mr-2 size-4" />
                        )}
                        {deletingId === session.id ? "Deleting..." : "Delete"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuButton>
              )}
              {isActive && (
                <SidebarMenuSub>
                  {/* Live Insights */}
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={activeTab === "insights"}
                    >
                      <button onClick={() => setActiveTab("insights")}>
                        <IconBulb className="size-4" />
                        <span className="truncate">Live Insights</span>
                        {isInsightsProcessing ? (
                          <IconLoader2 className="ml-auto size-3 shrink-0 animate-spin" />
                        ) : unseenUpdates.insights && activeTab !== "insights" ? (
                          <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-green-500" />
                        ) : null}
                      </button>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  {/* Differential Dx */}
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={activeTab === "ddx"}
                    >
                      <button onClick={() => setActiveTab("ddx")}>
                        <IconStethoscope className="size-4" />
                        <span className="truncate">Differential Dx</span>
                        {isDdxProcessing && diagnosisCount === 0 ? (
                          <IconLoader2 className="ml-auto size-3 shrink-0 animate-spin" />
                        ) : diagnosisCount > 0 ? (
                          <span className="ml-auto flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                            {isDdxProcessing ? (
                              <IconLoader2 key="ddx-icon" className="size-3 animate-spin" />
                            ) : unseenUpdates.ddx && activeTab !== "ddx" ? (
                              <span key="ddx-icon" className="h-2 w-2 rounded-full bg-green-500" />
                            ) : null}
                            {diagnosisCount}
                          </span>
                        ) : unseenUpdates.ddx && activeTab !== "ddx" ? (
                          <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-green-500" />
                        ) : null}
                      </button>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  {/* Consultation Record */}
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={activeTab === "record"}
                    >
                      <button onClick={() => setActiveTab("record")}>
                        <IconFileText className="size-4" />
                        <span className="truncate">Consultation Record</span>
                        {isRecordGenerating ? (
                          <IconLoader2 className="ml-auto size-3 shrink-0 animate-spin" />
                        ) : unseenUpdates.record && activeTab !== "record" ? (
                          <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-green-500" />
                        ) : null}
                      </button>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  {/* Research */}
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={activeTab === "research"}
                    >
                      <button onClick={() => setActiveTab("research")}>
                        <IconSearch className="size-4" />
                        <span className="truncate">Research</span>
                        {isResearchStreaming ? (
                          <IconLoader2 className="ml-auto size-3 shrink-0 animate-spin" />
                        ) : unseenUpdates.research && activeTab !== "research" ? (
                          <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-green-500" />
                        ) : null}
                      </button>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

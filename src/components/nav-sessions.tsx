"use client"

import { useState, useRef, useEffect } from "react"
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
import type { Session, TranscriptEntry, DiagnosticKeyword } from "@/types/session"
import type { ChecklistItem, DiagnosisCitation } from "@/types/insights"
import type { ConsultationRecord } from "@/types/record"
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
// In-memory session data cache for fast re-visits
// Session from API includes extra fields (insights, diagnoses, record, checklistItems)
interface SessionInsights {
  summary?: string
  keyFindings?: string[]
  redFlags?: string[]
  diagnosticKeywords?: DiagnosticKeyword[]
  [key: string]: unknown
}

interface SessionDiagnosis {
  id: string
  sessionId: string
  icdCode: string
  icdUri?: string
  diseaseName: string
  confidence: string
  evidence: string
  citations: unknown
  sortOrder: number
}

interface FullSessionResponse extends Session {
  insights?: SessionInsights | null
  diagnoses?: SessionDiagnosis[]
  record?: ConsultationRecord | null
  checklistItems?: ChecklistItem[]
}

interface NoteData {
  id: string
  content: string
  imageUrls: string[]
  source: string
  createdAt: string
}

interface ResearchMessageData {
  id: string
  role: string
  content: string
  citations: unknown
  createdAt: string
}

interface CachedSessionData {
  session: FullSessionResponse
  transcriptEntries: TranscriptEntry[]
  notes: NoteData[]
  researchMessages: ResearchMessageData[]
  timestamp: number
}

const sessionCache = new Map<string, CachedSessionData>()
const MAX_CACHE_SIZE = 5
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function getCachedSession(sessionId: string): CachedSessionData | null {
  const cached = sessionCache.get(sessionId)
  if (!cached) return null
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    sessionCache.delete(sessionId)
    return null
  }
  return cached
}

function setCachedSession(sessionId: string, data: Omit<CachedSessionData, "timestamp">) {
  // Evict oldest if at capacity
  if (sessionCache.size >= MAX_CACHE_SIZE && !sessionCache.has(sessionId)) {
    const oldestKey = sessionCache.keys().next().value
    if (oldestKey) sessionCache.delete(oldestKey)
  }
  sessionCache.set(sessionId, { ...data, timestamp: Date.now() })
}

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
      .catch(() => {})
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

    // Stop any running simulation BEFORE resetting stores
    const recState = useRecordingStore.getState()
    if (recState.isSimulating && recState.simulationControls) {
      recState.simulationControls.stop({ skipFinalAnalysis: true })
    }

    const cached = getCachedSession(sessionId)
    const store = useSessionStore.getState()

    // Use isSwitching for transition (keeps previous UI visible), isLoading only for initial load
    if (activeSession) {
      store.setSwitching(true)
    } else {
      store.setLoading(true)
    }

    try {
      let session: FullSessionResponse
      let transcriptEntries: TranscriptEntry[]
      let notes: NoteData[]
      let researchMessages: ResearchMessageData[]

      if (cached) {
        // Cache hit - use cached data
        ;({ session, transcriptEntries, notes, researchMessages } = cached)
      } else {
        // Cache miss - fetch from API
        const res = await fetch(`/api/sessions/${sessionId}/full`)
        if (!res.ok) throw new Error("Failed to load session")
        ;({ session, transcriptEntries, notes, researchMessages } = await res.json())

        // Store in cache for re-visits
        setCachedSession(sessionId, { session, transcriptEntries, notes, researchMessages })
      }

      // Batch reset+load per store to minimize empty-state renders.
      // React 19 auto-batching merges these into fewer re-renders.
      useConsultationTabStore.getState().clearAllUnseenUpdates()
      useConsultationModeStore.getState().reset()
      recordingStore.reset()

      setActiveSession(session)

      // Transcript: reset then immediately load
      transcriptStore.reset()
      if (transcriptEntries?.length > 0) {
        transcriptStore.loadEntries(transcriptEntries)
      }
      const savedKeywords = session.insights?.diagnosticKeywords
      if (Array.isArray(savedKeywords) && savedKeywords.length > 0) {
        transcriptStore.setDiagnosticKeywords(savedKeywords)
      }

      // Insights: reset then immediately load
      insightsStore.reset()
      if (session.insights) {
        insightsStore.loadFromDB({
          summary: session.insights.summary || "",
          keyFindings: session.insights.keyFindings || [],
          redFlags: session.insights.redFlags || [],
          checklistItems: session.checklistItems || [],
        })
      }

      // DDx: reset then immediately load
      ddxStore.reset()
      if (session.diagnoses && session.diagnoses.length > 0) {
        ddxStore.loadFromDB(
          session.diagnoses.map(
            (dx) => ({
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
              citations: (dx.citations || []) as DiagnosisCitation[],
              sortOrder: dx.sortOrder,
            })
          )
        )
      }

      // Record: reset then immediately load
      recordStore.reset()
      if (session.record) {
        recordStore.loadFromDB(session.record)
      }

      // Notes: reset then immediately load
      noteStore.reset()
      if (notes?.length > 0) {
        noteStore.loadNotes(
          notes.map((n) => ({
            id: n.id,
            content: n.content,
            imageUrls: n.imageUrls || [],
            storagePaths: [],
            source: n.source as "MANUAL" | "STT" | "IMAGE",
            createdAt: n.createdAt,
          }))
        )
      }

      // Research: reset then immediately load
      researchStore.reset()
      if (researchMessages?.length > 0) {
        researchStore.loadFromDB(
          researchMessages.map(
            (m) => ({
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
      toast.error("Failed to load session")
    } finally {
      const s = useSessionStore.getState()
      s.setLoading(false)
      s.setSwitching(false)
    }
  }

  const deleteSession = async (sessionId: string) => {
    try {
      await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" })
      setSessions(sessions.filter((s) => s.id !== sessionId))
      if (activeSession?.id === sessionId) {
        // Stop any running simulation BEFORE resetting stores
        const recState = useRecordingStore.getState()
        if (recState.isSimulating && recState.simulationControls) {
          recState.simulationControls.stop({ skipFinalAnalysis: true })
        }

        setActiveSession(null)
        transcriptStore.reset()
        insightsStore.reset()
        ddxStore.reset()
        recordStore.reset()
        noteStore.reset()
        researchStore.reset()
        useConsultationModeStore.getState().reset()
        useConsultationTabStore.getState().clearAllUnseenUpdates()
      }
    } catch (error) {
      console.error("Failed to delete session:", error)
      toast.error("Failed to delete session")
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
                      <span className="ml-auto flex-shrink-0">
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
                        className="text-destructive"
                      >
                        <IconTrash className="mr-2 size-4" />
                        Delete
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

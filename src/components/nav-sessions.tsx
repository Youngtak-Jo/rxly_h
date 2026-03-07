"use client"

import { useState, useRef, useEffect } from "react"
import { useTranslations } from "next-intl"
import { usePathname, useRouter } from "next/navigation"
import {
  IconDots,
  IconLoader2,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { useSessionStore } from "@/stores/session-store"
import type { Session } from "@/types/session"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useRecordStore } from "@/stores/record-store"
import { useRecordingStore } from "@/stores/recording-store"
import { useRecordingSegmentStore } from "@/stores/recording-segment-store"
import { useNoteStore } from "@/stores/note-store"
import { useDdxStore } from "@/stores/ddx-store"
import { useResearchStore } from "@/stores/research-store"
import { usePatientHandoutStore } from "@/stores/patient-handout-store"
import { useConsultationModeStore } from "@/stores/consultation-mode-store"
import { useSessionDocumentStore } from "@/stores/session-document-store"
import {
  getCachedSession,
  getCoreCachedSession,
  prefetchCoreSessionById,
  deleteCachedSession,
  cancelSessionLoad,
} from "@/hooks/use-session-loader"
import { useCreateSession } from "@/hooks/use-create-session"
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
  const t = useTranslations("NavSessions")
  const router = useRouter()
  const pathname = usePathname()
  const { sessions, activeSession, setActiveSession, setSessions } =
    useSessionStore()
  const { createSession } = useCreateSession()
  const transcriptStore = useTranscriptStore()
  const insightsStore = useInsightsStore()
  const recordStore = useRecordStore()
  const recordingStore = useRecordingStore()
  const recordingSegmentStore = useRecordingSegmentStore()
  const noteStore = useNoteStore()
  const ddxStore = useDdxStore()
  const researchStore = useResearchStore()
  const patientHandoutStore = usePatientHandoutStore()

  // Prefetch session data on hover (debounced)
  const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prefetchingRef = useRef<Set<string>>(new Set())
  const prefetchControllersRef = useRef<Map<string, AbortController>>(new Map())
  const pathnameRef = useRef(pathname)
  const navigationRequestSeqRef = useRef(0)

  const stopSimulationIfRunning = () => {
    const recState = useRecordingStore.getState()
    if (recState.isSimulating && recState.simulationControls) {
      recState.simulationControls.stop({ skipFinalAnalysis: true })
    }
  }

  const resetConsultationStores = () => {
    transcriptStore.reset()
    insightsStore.reset()
    ddxStore.reset()
    recordStore.reset()
    recordingStore.reset()
    recordingSegmentStore.reset()
    noteStore.reset()
    researchStore.reset()
    patientHandoutStore.reset()
    useSessionDocumentStore.getState().reset()
    useConsultationModeStore.getState().reset()
    useConsultationTabStore.getState().clearAllUnseenUpdates()
  }

  const prefetchSession = (sessionId: string) => {
    if (activeSession?.id === sessionId) return
    if (getCoreCachedSession(sessionId)) return
    if (getCachedSession(sessionId)) return
    if (prefetchingRef.current.has(sessionId)) return

    const controller = new AbortController()
    prefetchingRef.current.add(sessionId)
    prefetchControllersRef.current.set(sessionId, controller)
    void prefetchCoreSessionById(sessionId, controller.signal)
      .finally(() => {
        prefetchingRef.current.delete(sessionId)
        prefetchControllersRef.current.delete(sessionId)
      })
  }

  useEffect(() => {
    const controllerMap = prefetchControllersRef.current
    const prefetchingSet = prefetchingRef.current

    return () => {
      if (prefetchTimerRef.current) {
        clearTimeout(prefetchTimerRef.current)
      }

      for (const controller of controllerMap.values()) {
        controller.abort()
      }
      controllerMap.clear()
      prefetchingSet.clear()
    }
  }, [])

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  const restorePreviousSessionContext = async (previousSession: Session | null) => {
    cancelSessionLoad()
    useSessionStore.getState().setSwitching(false)

    if (previousSession) {
      useSessionStore.getState().setActiveSession(previousSession)
      router.replace(`/consultation/${previousSession.id}`)
      return
    }

    useSessionStore.getState().setActiveSession(null)
    resetConsultationStores()
    router.replace("/consultation")
  }

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const renameInFlightIdRef = useRef<string | null>(null)
  const routeSessionId =
    pathname && pathname.startsWith("/consultation/")
      ? pathname.slice("/consultation/".length)
      : null

  // Only provide a visual active state if we're actually on the consultation pages
  const isConsultationRoute = pathname?.startsWith("/consultation")
  const visualActiveSessionId = isConsultationRoute
    ? (routeSessionId || activeSession?.id || null)
    : null

  const loadSession = (sessionId: string) => {
    if (editingId || deletingId === sessionId) return
    if (pathname === `/consultation/${sessionId}`) return

    navigationRequestSeqRef.current += 1
    useSessionStore.getState().setSwitching(true)
    router.push(`/consultation/${sessionId}`)
  }

  const deleteSession = async (sessionId: string) => {
    setDeletingId(sessionId)
    const storeBeforeDelete = useSessionStore.getState()
    const previousSessions = storeBeforeDelete.sessions
    const previousActiveSession = storeBeforeDelete.activeSession
    const deletingActiveSession = previousActiveSession?.id === sessionId
    const navigationSeqAtDeleteStart = navigationRequestSeqRef.current

    // Optimistic removal for both active and inactive session delete.
    setSessions(previousSessions.filter((s) => s.id !== sessionId))
    deleteCachedSession(sessionId)

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")

      // If user did not request another session after delete start and we're still on
      // the deleted route, navigate back to base consultation.
      if (deletingActiveSession) {
        const deletedSessionPath = `/consultation/${sessionId}`
        const shouldNavigateToBase =
          navigationRequestSeqRef.current === navigationSeqAtDeleteStart &&
          pathnameRef.current === deletedSessionPath

        if (shouldNavigateToBase) {
          cancelSessionLoad()
          stopSimulationIfRunning()
          setActiveSession(null)
          resetConsultationStores()
          useSessionStore.getState().setSwitching(false)
          router.replace("/consultation")
        }
      }
    } catch (error) {
      console.error("Failed to delete session:", error)
      setSessions(previousSessions)
      if (deletingActiveSession) {
        const deletedSessionPath = `/consultation/${sessionId}`
        const shouldRestore =
          navigationRequestSeqRef.current === navigationSeqAtDeleteStart &&
          pathnameRef.current === deletedSessionPath

        if (shouldRestore) {
          await restorePreviousSessionContext(previousActiveSession)
        }
      }
      toast.error(t("deleteFailed"))
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    if (editingId) inputRef.current?.focus()
  }, [editingId])

  const startRename = (sessionId: string, currentTitle: string) => {
    setEditingId(sessionId)
    setEditingTitle(currentTitle || t("untitledSession"))
  }

  const commitRename = async () => {
    if (!editingId) return
    const targetId = editingId
    if (renameInFlightIdRef.current === targetId) return
    renameInFlightIdRef.current = targetId

    const trimmed = editingTitle.trim()
    setEditingId(null)

    if (trimmed) {
      try {
        const res = await fetch(`/api/sessions/${targetId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmed }),
        })
        if (!res.ok) throw new Error("Rename failed")
        useSessionStore.getState().updateSession(targetId, { title: trimmed })
        deleteCachedSession(targetId)
      } catch (error) {
        console.error("Failed to rename session:", error)
        toast.error(t("renameFailed"))
      } finally {
        renameInFlightIdRef.current = null
      }
      return
    }

    renameInFlightIdRef.current = null
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("sectionLabel")}</SidebarGroupLabel>
      <SidebarGroupAction onClick={createSession} title={t("newSessionTitle")}>
        <IconPlus />
      </SidebarGroupAction>
      <SidebarMenu>
        {sessions.length === 0 && (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            {t("noSessions")}
          </div>
        )}
        {sessions.map((session) => {
          const isActive = visualActiveSessionId === session.id
          const isDeleting = deletingId === session.id
          return (
            <SidebarMenuItem key={session.id}>
              {editingId === session.id ? (
                <input
                  ref={inputRef}
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      e.currentTarget.blur()
                    }
                    if (e.key === "Escape") setEditingId(null)
                  }}
                  className="h-8 w-full rounded-md border bg-background px-2 text-sm outline-none"
                />
              ) : (
                <div className="group/session relative">
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
                    className="h-auto items-start py-2"
                  >
                    <span className="line-clamp-2 min-w-0 flex-1">
                      {session.title || t("untitledSession")}
                    </span>
                    <div className="ml-auto w-11 shrink-0 pr-4">
                      {isDeleting ? (
                        <div className="flex h-5 items-center justify-end text-muted-foreground">
                          <IconLoader2 className="size-3 animate-spin" />
                        </div>
                      ) : (
                        <div className="relative flex h-5 items-center justify-end">
                          <span className="hidden text-xs tabular-nums text-muted-foreground transition-opacity md:inline group-hover/session:opacity-0">
                            {formatShortTimeAgo(new Date(session.startedAt))}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(event) => event.stopPropagation()}
                              onPointerDown={(event) => event.stopPropagation()}
                            >
                              <span
                                aria-label={t("actions")}
                                className="flex size-5 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent md:absolute md:right-0 md:top-0 md:opacity-0 md:pointer-events-none md:group-hover/session:opacity-100 md:group-hover/session:pointer-events-auto"
                              >
                                <IconDots className="size-4" />
                              </span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="right" align="start">
                              <DropdownMenuItem
                                onSelect={(event) => {
                                  event.stopPropagation()
                                  startRename(session.id, session.title ?? "")
                                }}
                              >
                                <IconPencil className="mr-2 size-4" />
                                {t("rename")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(event) => {
                                  event.stopPropagation()
                                  void deleteSession(session.id)
                                }}
                                disabled={!!deletingId}
                                className="text-destructive"
                              >
                                <IconTrash className="mr-2 size-4" />
                                {t("delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </SidebarMenuButton>
                </div>
              )}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

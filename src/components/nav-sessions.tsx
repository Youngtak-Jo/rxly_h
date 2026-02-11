"use client"

import {
  IconDots,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react"

import { useSessionStore } from "@/stores/session-store"
import { useTranscriptStore } from "@/stores/transcript-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useRecordStore } from "@/stores/record-store"
import { useRecordingStore } from "@/stores/recording-store"
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
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { formatDistanceToNow } from "date-fns"

export function NavSessions() {
  const { sessions, activeSession, setActiveSession, addSession, setSessions } =
    useSessionStore()
  const transcriptStore = useTranscriptStore()
  const insightsStore = useInsightsStore()
  const recordStore = useRecordStore()
  const recordingStore = useRecordingStore()

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

      const transcriptRes = await fetch(
        `/api/sessions/${sessionId}/transcript`
      )
      if (transcriptRes.ok) {
        const entries = await transcriptRes.json()
        transcriptStore.loadEntries(entries)
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
      }
    } catch (error) {
      console.error("Failed to delete session:", error)
    }
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
            <SidebarMenuButton
              isActive={activeSession?.id === session.id}
              onClick={() => loadSession(session.id)}
            >
              <span className="truncate">
                {session.title || "Untitled Session"}
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(session.startedAt), {
                  addSuffix: true,
                })}
              </span>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction>
                  <IconDots />
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start">
                <DropdownMenuItem
                  onClick={() => deleteSession(session.id)}
                  className="text-destructive"
                >
                  <IconTrash className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

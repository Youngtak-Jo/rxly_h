"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { useSessionStore } from "@/stores/session-store"
import { useRecordingStore } from "@/stores/recording-store"

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export function SiteHeader() {
  const activeSession = useSessionStore((s) => s.activeSession)
  const { isRecording, isPaused, duration } = useRecordingStore()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">
          {activeSession?.title || "Rxly Consultation"}
        </h1>
        {isRecording && (
          <div className="ml-3 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <Badge variant="secondary" className="text-xs font-mono">
              {isPaused ? "Paused" : formatDuration(duration)}
            </Badge>
          </div>
        )}
        {activeSession && (
          <Badge variant="outline" className="ml-auto text-xs">
            {activeSession.status}
          </Badge>
        )}
      </div>
    </header>
  )
}

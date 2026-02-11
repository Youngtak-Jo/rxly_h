"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { InsightsContainer } from "./insights/insights-container"
import { RecordContainer } from "./record/record-container"
import { NoteInputBar } from "./note-input/note-input-bar"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"

export function CenterPanel() {
  const activeTab = useConsultationTabStore((s) => s.activeTab)

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          {activeTab === "insights" ? (
            <InsightsContainer />
          ) : (
            <RecordContainer />
          )}
        </div>
      </ScrollArea>
      <NoteInputBar />
    </div>
  )
}

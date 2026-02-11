"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InsightsContainer } from "./insights/insights-container"
import { RecordContainer } from "./record/record-container"
import { NoteInputBar } from "./note-input/note-input-bar"
import { IconBulb, IconFileText } from "@tabler/icons-react"

export function CenterPanel() {
  return (
    <div className="flex h-full flex-col">
      <Tabs defaultValue="insights" className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b px-4 pt-2">
          <TabsList className="h-9">
            <TabsTrigger value="insights" className="text-xs gap-1.5">
              <IconBulb className="size-3.5" />
              Live Insights
            </TabsTrigger>
            <TabsTrigger value="record" className="text-xs gap-1.5">
              <IconFileText className="size-3.5" />
              Consultation Record
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="insights" className="flex-1 overflow-auto mt-0 p-4">
          <InsightsContainer />
        </TabsContent>
        <TabsContent value="record" className="flex-1 overflow-auto mt-0 p-4">
          <RecordContainer />
        </TabsContent>
      </Tabs>
      <NoteInputBar />
    </div>
  )
}

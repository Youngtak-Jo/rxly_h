"use client"

import { ResearchMessageList } from "./research-message-list"

export function ResearchContainer() {
  return (
    <div data-tour="research-panel" className="flex flex-col h-full">
      <ResearchMessageList />
    </div>
  )
}

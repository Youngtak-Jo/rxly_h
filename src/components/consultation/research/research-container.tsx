"use client"

import { ResearchMessageList } from "./research-message-list"
import { ResearchInput } from "./research-input"

export function ResearchContainer() {
  return (
    <div data-tour="research-panel" className="flex flex-col h-full">
      <ResearchMessageList />
      <ResearchInput />
    </div>
  )
}

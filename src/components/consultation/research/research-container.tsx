"use client"

import { ResearchMessageList } from "./research-message-list"
import { ResearchInput } from "./research-input"

export function ResearchContainer() {
  return (
    <div className="flex flex-col h-full">
      <ResearchMessageList />
      <ResearchInput />
    </div>
  )
}

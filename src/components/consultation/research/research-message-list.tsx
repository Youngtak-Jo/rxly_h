"use client"

import { useRef, useEffect, useCallback } from "react"
import { useResearchStore } from "@/stores/research-store"
import { ResearchMessageBubble } from "./research-message"
import { IconSearch } from "@tabler/icons-react"

export function ResearchMessageList() {
  const messages = useResearchStore((s) => s.messages)
  const isStreaming = useResearchStore((s) => s.isStreaming)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isAtBottom = useRef(true)

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const threshold = 80
    isAtBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold
  }, [])

  // Auto-scroll when new messages arrive or content updates
  useEffect(() => {
    if (isAtBottom.current) {
      scrollToBottom()
    }
  }, [messages, scrollToBottom])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <IconSearch className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Medical Research Assistant</p>
            <p className="text-xs text-muted-foreground mt-1">
              Ask any medical question. Responses are grounded in evidence from
              PubMed, ICD-11, ClinicalTrials.gov, and more.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4"
    >
      <div className="flex flex-col gap-6 max-w-3xl mx-auto">
        {messages.map((msg, index) => (
          <ResearchMessageBubble
            key={msg.id}
            message={msg}
            isStreaming={
              isStreaming &&
              msg.role === "assistant" &&
              index === messages.length - 1
            }
          />
        ))}
      </div>
    </div>
  )
}

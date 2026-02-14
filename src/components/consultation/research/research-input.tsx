"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useSessionStore } from "@/stores/session-store"
import { useResearchStore } from "@/stores/research-store"
import { useConnectorStore } from "@/stores/connector-store"
import { useSettingsStore } from "@/stores/settings-store"
import { useInsightsStore } from "@/stores/insights-store"
import { IconSlash, IconSend, IconPlayerStop, IconTrash } from "@tabler/icons-react"
import type { ResearchCitation } from "@/stores/research-store"

const CITATION_PARSE_RE =
  /\[\[([^\]]+)\]\]\(([^)]+)\)/g

function parseCitations(text: string): ResearchCitation[] {
  const citations: ResearchCitation[] = []
  const seen = new Set<string>()

  for (const match of text.matchAll(CITATION_PARSE_RE)) {
    const label = match[1]
    const url = match[2]
    if (seen.has(url)) continue
    seen.add(url)

    const sourceMap: Record<string, ResearchCitation["source"]> = {
      PUBMED: "pubmed",
      EPMC: "europe_pmc",
      "ICD-11": "icd11",
      FDA: "openfda",
      TRIALS: "clinical_trials",
      DAILYMED: "dailymed",
    }

    citations.push({
      source: sourceMap[label] || "pubmed",
      title: label,
      url,
    })
  }

  return citations
}

export function ResearchInput() {
  const [text, setText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const activeSession = useSessionStore((s) => s.activeSession)
  const {
    messages,
    isStreaming,
    includeInsights,
    setIncludeInsights,
    addUserMessage,
    addAssistantMessage,
    updateAssistantMessage,
    finalizeAssistantMessage,
    setStreaming,
    setAbortController,
    clearMessages,
  } = useResearchStore()
  const connectors = useConnectorStore((s) => s.connectors)
  const insights = useInsightsStore()

  const handleSend = async () => {
    const question = text.trim()
    if (!question || !activeSession || isStreaming) return

    setText("")
    addUserMessage(question)
    setStreaming(true)

    const controller = new AbortController()
    setAbortController(controller)

    const assistantId = addAssistantMessage()

    try {
      // Build conversation history (previous turns only, without citations/RAG)
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const { aiModel, customInstructions } = useSettingsStore.getState()

      const body: Record<string, unknown> = {
        question,
        conversationHistory,
        enabledConnectors: connectors,
        model: aiModel.researchModel,
        customInstructions: customInstructions.research || undefined,
        insightsContext: includeInsights
          ? {
              summary: insights.summary,
              keyFindings: insights.keyFindings,
              redFlags: insights.redFlags,
            }
          : null,
      }

      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No response stream")

      const decoder = new TextDecoder()
      let accumulated = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        accumulated += decoder.decode(value, { stream: true })
        updateAssistantMessage(assistantId, accumulated)
      }

      // Finalize with parsed citations
      const citations = parseCitations(accumulated)
      finalizeAssistantMessage(assistantId, accumulated, citations)

      // Save the new user + assistant message pair to DB
      if (activeSession) {
        fetch(`/api/sessions/${activeSession.id}/research`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "user", content: question, citations: [] },
              { role: "assistant", content: accumulated, citations },
            ],
          }),
        }).catch(console.error)
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        // User cancelled — keep what was streamed so far
        const current = useResearchStore
          .getState()
          .messages.find((m) => m.id === assistantId)
        if (current) {
          const citations = parseCitations(current.content)
          finalizeAssistantMessage(assistantId, current.content, citations)
        }
      } else {
        console.error("Research stream error:", error)
        updateAssistantMessage(
          assistantId,
          "An error occurred while generating the response. Please try again."
        )
      }
    } finally {
      setStreaming(false)
      setAbortController(null)
      textareaRef.current?.focus()
    }
  }

  const handleStop = () => {
    const controller = useResearchStore.getState().abortController
    if (controller) controller.abort()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t p-3">
      <div className="flex items-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
            >
              <IconSlash className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56 sm:w-64">
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="flex items-center justify-between gap-3 py-2"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Live Insights</span>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  Include current session insights in research context
                </span>
              </div>
              <Switch
                checked={includeInsights}
                onCheckedChange={setIncludeInsights}
                size="sm"
              />
            </DropdownMenuItem>
            {messages.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    clearMessages()
                    if (activeSession) {
                      fetch(`/api/sessions/${activeSession.id}/research`, {
                        method: "DELETE",
                      }).catch(console.error)
                    }
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <IconTrash className="size-4" />
                  Clear Chat
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Textarea
          ref={textareaRef}
          placeholder={
            activeSession
              ? "Ask a medical research question..."
              : "Start a session first..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!activeSession || isStreaming}
          className="min-h-[36px] max-h-[120px] resize-none text-sm"
          rows={1}
        />
        {isStreaming ? (
          <Button
            onClick={handleStop}
            size="icon"
            variant="destructive"
            className="h-9 w-9 shrink-0"
          >
            <IconPlayerStop className="size-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSend}
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={!text.trim() || !activeSession}
          >
            <IconSend className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

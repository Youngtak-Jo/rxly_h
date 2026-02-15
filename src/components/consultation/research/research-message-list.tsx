"use client"

import { useRef, useEffect, useCallback } from "react"
import { useResearchStore } from "@/stores/research-store"
import { useConnectorStore } from "@/stores/connector-store"
import { ResearchMessageBubble } from "./research-message"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { IconPlug } from "@tabler/icons-react"
import type { ConnectorState } from "@/types/insights"

const CONNECTORS: {
  key: keyof ConnectorState
  label: string
  description: string
}[] = [
  {
    key: "pubmed",
    label: "PubMed",
    description: "NCBI biomedical literature search (36M+ articles)",
  },
  {
    key: "icd11",
    label: "ICD-11",
    description: "WHO International Classification of Diseases",
  },
  {
    key: "europe_pmc",
    label: "Europe PMC",
    description: "European biomedical literature (33M+ publications)",
  },
  {
    key: "openfda",
    label: "OpenFDA",
    description: "FDA drug adverse events & safety reports",
  },
  {
    key: "clinical_trials",
    label: "ClinicalTrials.gov",
    description: "NIH clinical trial database (440K+ studies)",
  },
  {
    key: "dailymed",
    label: "DailyMed",
    description: "FDA-approved drug labeling information",
  },
]

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

  const { connectors, toggleConnector } = useConnectorStore()

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 overflow-y-auto">
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <IconPlug className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Knowledge Connectors</p>
              <p className="text-xs text-muted-foreground mt-1">
                Select which medical databases to use for research.
              </p>
            </div>
          </div>

          <div className="w-full space-y-2">
            {CONNECTORS.map((connector) => (
              <div
                key={connector.key}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <Label
                    htmlFor={`research-connector-${connector.key}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {connector.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {connector.description}
                  </p>
                </div>
                <Switch
                  id={`research-connector-${connector.key}`}
                  checked={connectors[connector.key]}
                  onCheckedChange={() => toggleConnector(connector.key)}
                />
              </div>
            ))}
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

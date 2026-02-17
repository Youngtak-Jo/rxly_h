"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useConnectorStore } from "@/stores/connector-store"
import { useSessionStore } from "@/stores/session-store"
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
  ]

export function ConnectorsDialog() {
  const [open, setOpen] = useState(false)
  const { connectors, toggleConnector } = useConnectorStore()
  const activeSession = useSessionStore((s) => s.activeSession)
  const enabledCount = Object.values(connectors).filter(Boolean).length

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 relative"
          disabled={!activeSession}
        >
          <IconPlug className="size-4" />
          {enabledCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary text-[9px] font-medium text-primary-foreground flex items-center justify-center">
              {enabledCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Knowledge Connectors</DialogTitle>
          <DialogDescription>
            Enable external medical databases for evidence-based diagnosis
            support.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {CONNECTORS.map((connector) => (
            <div
              key={connector.key}
              className="flex items-center justify-between gap-4 rounded-lg border p-3"
            >
              <div className="space-y-0.5">
                <Label
                  htmlFor={`connector-${connector.key}`}
                  className="text-sm font-medium"
                >
                  {connector.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {connector.description}
                </p>
              </div>
              <Switch
                id={`connector-${connector.key}`}
                checked={connectors[connector.key]}
                onCheckedChange={() => toggleConnector(connector.key)}
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

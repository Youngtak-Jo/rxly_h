"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { IconLoader2, IconPlus, IconRefresh } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useDocumentWorkspaceStore } from "@/stores/document-workspace-store"
import { useSessionDocumentStore } from "@/stores/session-document-store"
import { useSessionStore } from "@/stores/session-store"
import { createEmptyDocumentContent } from "@/lib/documents/schema"
import type {
  DocumentGroupNode,
  DocumentSchemaNode,
  DocumentTemplateSchema,
  SessionDocumentRecord,
} from "@/types/document"
import { useSettingsStore } from "@/stores/settings-store"

interface SessionDocumentRouteResponse {
  sessionDocument: SessionDocumentRecord
  template: {
    id: string
    title: string
    description: string
    latestPublishedVersionId: string | null
    latestDraftVersionId: string | null
  }
  installedDocument: {
    installedVersionId: string
    installedVersionNumber: number
    latestPublishedVersionId: string | null
    latestPublishedVersionNumber: number | null
    hasUpdate: boolean
  } | null
  activeVersion: {
    id: string
    versionNumber: number
    schemaJson: DocumentTemplateSchema
  }
}

type PathSegment = string | number
type MutableCursor = Record<string, unknown> | unknown[]

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function humanizeKey(key: string) {
  return key
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function updateValueAtPath(
  content: Record<string, unknown>,
  path: PathSegment[],
  value: unknown
) {
  const next = deepClone(content)
  let cursor: MutableCursor = next

  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index]
    const nextCursor = Array.isArray(cursor)
      ? cursor[segment as number]
      : cursor[segment as string]
    if (!nextCursor || typeof nextCursor !== "object") {
      return next
    }
    cursor = nextCursor as MutableCursor
  }

  const finalSegment = path[path.length - 1]
  if (Array.isArray(cursor) && typeof finalSegment === "number") {
    cursor[finalSegment] = value
  } else if (!Array.isArray(cursor) && typeof finalSegment === "string") {
    cursor[finalSegment] = value
  }
  return next
}

function removeArrayItemAtPath(
  content: Record<string, unknown>,
  path: PathSegment[],
  indexToRemove: number
) {
  const next = deepClone(content)
  let cursor: MutableCursor = next

  for (const segment of path) {
    const nextCursor = Array.isArray(cursor)
      ? cursor[segment as number]
      : cursor[segment as string]
    if (!nextCursor || typeof nextCursor !== "object") {
      return next
    }
    cursor = nextCursor as MutableCursor
  }

  if (Array.isArray(cursor)) {
    cursor.splice(indexToRemove, 1)
  }

  return next
}

function appendArrayItemAtPath(
  content: Record<string, unknown>,
  path: PathSegment[],
  value: unknown
) {
  const next = deepClone(content)
  let cursor: MutableCursor = next

  for (const segment of path) {
    const nextCursor = Array.isArray(cursor)
      ? cursor[segment as number]
      : cursor[segment as string]
    if (!nextCursor || typeof nextCursor !== "object") {
      return next
    }
    cursor = nextCursor as MutableCursor
  }

  if (Array.isArray(cursor)) {
    cursor.push(value)
  }

  return next
}

function getGroupValue(
  parentValue: Record<string, unknown>,
  node: DocumentGroupNode
): Record<string, unknown> | Array<Record<string, unknown>> {
  const value = parentValue[node.key]
  if (node.type === "repeatableGroup") {
    return Array.isArray(value) ? value : []
  }

  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : createEmptyDocumentContent({ nodes: node.children })
}

function FieldEditor({
  node,
  value,
  onChange,
}: {
  node: DocumentSchemaNode
  value: unknown
  onChange: (value: unknown) => void
}) {
  if (node.type === "shortText") {
    return (
      <Input
        value={typeof value === "string" ? value : ""}
        placeholder={node.placeholder || node.label}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }

  if (node.type === "longText") {
    return (
      <Textarea
        value={typeof value === "string" ? value : ""}
        placeholder={node.placeholder || node.label}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-28 resize-y"
      />
    )
  }

  return (
    <Textarea
      value={Array.isArray(value) ? value.join("\n") : ""}
      placeholder={node.placeholder || `${node.label} (one item per line)`}
      onChange={(event) =>
        onChange(
          event.target.value
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      }
      className="min-h-24 resize-y"
    />
  )
}

function StructuredNodeEditor({
  node,
  content,
  path,
  onChange,
}: {
  node: DocumentSchemaNode
  content: Record<string, unknown>
  path: PathSegment[]
  onChange: (nextContent: Record<string, unknown>) => void
}) {
  if (node.type === "group" || node.type === "repeatableGroup") {
    const value = getGroupValue(content, node)

    if (node.type === "repeatableGroup") {
      const items = value as Array<Record<string, unknown>>
      return (
        <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium">{node.label || humanizeKey(node.key)}</h3>
              {node.helpText ? (
                <p className="mt-1 text-xs text-muted-foreground">{node.helpText}</p>
              ) : null}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() =>
                onChange(
                  appendArrayItemAtPath(
                    content,
                    [...path, node.key],
                    createEmptyDocumentContent({ nodes: node.children })
                  )
                )
              }
            >
              <IconPlus className="size-3.5" />
              Add item
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/70 px-3 py-4 text-sm text-muted-foreground">
              No items yet.
            </p>
          ) : (
            items.map((item, itemIndex) => (
              <div
                key={`${node.key}-${itemIndex}`}
                className="space-y-3 rounded-lg border border-border/70 bg-background p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Item {itemIndex + 1}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs text-muted-foreground"
                    onClick={() =>
                      onChange(
                        removeArrayItemAtPath(
                          content,
                          [...path, node.key],
                          itemIndex
                        )
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>

                {node.children.map((child) => (
                  <StructuredNodeEditor
                    key={`${node.key}-${itemIndex}-${child.key}`}
                    node={child}
                    content={item}
                    path={[...path, node.key, itemIndex]}
                    onChange={onChange}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      )
    }

    const groupValue = value as Record<string, unknown>
    return (
      <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
        <div>
          <h3 className="text-sm font-medium">{node.label || humanizeKey(node.key)}</h3>
          {node.helpText ? (
            <p className="mt-1 text-xs text-muted-foreground">{node.helpText}</p>
          ) : null}
        </div>
        {node.children.map((child) => (
          <StructuredNodeEditor
            key={`${node.key}-${child.key}`}
            node={child}
            content={groupValue}
            path={[...path, node.key]}
            onChange={onChange}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor={`${path.join("-")}-${node.key}`}>
          {node.label || humanizeKey(node.key)}
          {node.required ? <span className="ml-1 text-destructive">*</span> : null}
        </label>
        {node.helpText ? (
          <p className="text-xs text-muted-foreground">{node.helpText}</p>
        ) : null}
      </div>
      <FieldEditor
        node={node}
        value={content[node.key]}
        onChange={(value) =>
          onChange(updateValueAtPath(content, [...path, node.key], value))
        }
      />
    </div>
  )
}

export function StructuredDocumentContainer({
  templateId,
}: {
  templateId: string
}) {
  const activeSession = useSessionStore((state) => state.activeSession)
  const installedDocument = useDocumentWorkspaceStore((state) =>
    state.installedDocuments.find((document) => document.templateId === templateId)
  )
  const upsertSessionDocument = useSessionDocumentStore(
    (state) => state.upsertSessionDocument
  )
  const cachedSessionDocument = useSessionDocumentStore((state) =>
    activeSession
      ? state.documentsBySessionId[activeSession.id]?.[templateId] ?? null
      : null
  )
  const documentModel = useSettingsStore((state) => state.aiModel.documentModel)

  const [routeState, setRouteState] =
    useState<SessionDocumentRouteResponse | null>(null)
  const [draftContent, setDraftContent] = useState<Record<string, unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hydratedSessionKeyRef = useRef<string | null>(null)
  const lastSavedFingerprintRef = useRef<string | null>(null)

  useEffect(() => {
    if (!activeSession) {
      setRouteState(null)
      setDraftContent(null)
      return
    }

    const sessionKey = `${activeSession.id}:${templateId}`
    if (hydratedSessionKeyRef.current === sessionKey && routeState) {
      return
    }

    hydratedSessionKeyRef.current = sessionKey
    setIsLoading(true)
    setError(null)

    fetch(`/api/sessions/${activeSession.id}/documents/${templateId}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load document")
        }
        return (await response.json()) as SessionDocumentRouteResponse
      })
      .then((payload) => {
        setRouteState(payload)
        setDraftContent(payload.sessionDocument.contentJson)
        lastSavedFingerprintRef.current = JSON.stringify(
          payload.sessionDocument.contentJson
        )
        upsertSessionDocument(payload.sessionDocument)
      })
      .catch((fetchError) => {
        console.error("Failed to load structured document", fetchError)
        setError("Failed to load document")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [activeSession, routeState, templateId, upsertSessionDocument])

  useEffect(() => {
    if (!activeSession || !routeState || !draftContent) return

    const fingerprint = JSON.stringify(draftContent)
    if (lastSavedFingerprintRef.current === fingerprint) {
      return
    }

    const saveTimer = setTimeout(async () => {
      try {
        setIsSaving(true)
        const response = await fetch(
          `/api/sessions/${activeSession.id}/documents/${templateId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              templateVersionId:
                cachedSessionDocument?.templateVersionId ?? routeState.activeVersion.id,
              contentJson: draftContent,
              generatedAt: cachedSessionDocument?.generatedAt ?? null,
            }),
          }
        )

        if (!response.ok) {
          throw new Error("Failed to save document")
        }

        const savedDocument = (await response.json()) as SessionDocumentRecord
        lastSavedFingerprintRef.current = JSON.stringify(savedDocument.contentJson)
        upsertSessionDocument(savedDocument)
      } catch (saveError) {
        console.error("Failed to autosave structured document", saveError)
      } finally {
        setIsSaving(false)
      }
    }, 900)

    return () => clearTimeout(saveTimer)
  }, [
    activeSession,
    cachedSessionDocument?.generatedAt,
    cachedSessionDocument?.templateVersionId,
    draftContent,
    routeState,
    templateId,
    upsertSessionDocument,
  ])

  const schema = routeState?.activeVersion.schemaJson ?? { nodes: [] }
  const hasUpdateAvailable =
    !!installedDocument &&
    !!cachedSessionDocument &&
    cachedSessionDocument.templateVersionId !== installedDocument.installedVersionId

  const versionLabel = useMemo(() => {
    if (installedDocument?.installedVersionNumber) {
      return `v${installedDocument.installedVersionNumber}`
    }
    if (routeState?.activeVersion.versionNumber) {
      return `v${routeState.activeVersion.versionNumber}`
    }
    return "Draft"
  }, [installedDocument?.installedVersionNumber, routeState?.activeVersion.versionNumber])

  if (!activeSession) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
        Start a consultation to use this document.
      </div>
    )
  }

  if (isLoading || !routeState || !draftContent) {
    return (
      <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
        <IconLoader2 className="size-4 animate-spin" />
        Loading document
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">{routeState.template.title}</h2>
            <Badge variant="secondary">{versionLabel}</Badge>
            {isSaving ? <Badge variant="outline">Saving</Badge> : null}
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {routeState.template.description}
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          className="gap-1.5"
          disabled={isGenerating}
          onClick={async () => {
            try {
              setIsGenerating(true)
              const response = await fetch(
                `/api/sessions/${activeSession.id}/documents/${templateId}/generate`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    model: documentModel,
                  }),
                }
              )
              if (!response.ok) {
                throw new Error("Failed to generate document")
              }

              const payload = (await response.json()) as {
                sessionDocument: SessionDocumentRecord
                templateVersionId: string
              }
              upsertSessionDocument(payload.sessionDocument)
              lastSavedFingerprintRef.current = JSON.stringify(
                payload.sessionDocument.contentJson
              )
              setDraftContent(payload.sessionDocument.contentJson)
            } catch (generateError) {
              console.error("Failed to generate structured document", generateError)
              setError("Failed to generate document")
            } finally {
              setIsGenerating(false)
            }
          }}
        >
          {isGenerating ? <IconLoader2 className="size-3.5 animate-spin" /> : <IconRefresh className="size-3.5" />}
          {cachedSessionDocument?.generatedAt ? "Regenerate" : "Generate"}
        </Button>
      </div>

      {hasUpdateAvailable ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          A newer template version is installed. Regenerate this document to apply it.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="space-y-4">
        {schema.nodes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
            This document has no fields yet.
          </div>
        ) : (
          schema.nodes.map((node) => (
            <StructuredNodeEditor
              key={node.key}
              node={node}
              content={draftContent}
              path={[]}
              onChange={setDraftContent}
            />
          ))
        )}
      </div>
    </div>
  )
}

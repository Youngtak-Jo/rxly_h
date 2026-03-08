"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { IconLoader2, IconPlus, IconRefresh } from "@tabler/icons-react"
import { useTranslations } from "next-intl"

import { GenericDocumentPreview } from "@/components/documents/generic-document-preview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { buildGenericDocumentSections } from "@/lib/documents/preview"
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
import { deleteCachedSession } from "@/hooks/use-session-loader"

interface SessionDocumentRouteResponse {
  sessionDocument: SessionDocumentRecord | null
  initialContentJson: Record<string, unknown>
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

interface SessionDocumentSaveResponse {
  sessionDocument: SessionDocumentRecord
  activeVersion: SessionDocumentRouteResponse["activeVersion"]
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
  const tBuilder = useTranslations("DocumentBuilder")

  if (node.type === "group" || node.type === "repeatableGroup") {
    const value = getGroupValue(content, node)

    if (node.type === "repeatableGroup") {
      const items = value as Array<Record<string, unknown>>
      const itemLabel = node.itemLabel?.trim() || tBuilder("preview.sampleItem")
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
              {tBuilder("preview.addNamedItem", { itemLabel })}
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/70 px-3 py-4 text-sm text-muted-foreground">
              {tBuilder("preview.noSampleItems")}
            </p>
          ) : (
            items.map((item, itemIndex) => (
              <div
                key={`${node.key}-${itemIndex}`}
                className="space-y-3 rounded-lg border border-border/70 bg-background p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {itemLabel} {itemIndex + 1}
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
                    {tBuilder("preview.removeItem")}
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
  const tBuilder = useTranslations("DocumentBuilder")
  const activeSession = useSessionStore((state) => state.activeSession)
  const installedDocument = useDocumentWorkspaceStore((state) =>
    state.installedDocuments.find((document) => document.templateId === templateId)
  )
  const upsertSessionDocument = useSessionDocumentStore(
    (state) => state.upsertSessionDocument
  )
  const cacheSessionDocumentSchema = useSessionDocumentStore(
    (state) => state.cacheSessionDocumentSchema
  )
  const documentModel = useSettingsStore((state) => state.aiModel.documentModel)

  const [routeState, setRouteState] =
    useState<SessionDocumentRouteResponse | null>(null)
  const [draftContent, setDraftContent] = useState<Record<string, unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview")
  const hydratedSessionKeyRef = useRef<string | null>(null)
  const lastSavedFingerprintRef = useRef<string | null>(null)

  useEffect(() => {
    if (!activeSession) {
      hydratedSessionKeyRef.current = null
      lastSavedFingerprintRef.current = null
      setRouteState(null)
      setDraftContent(null)
      setError(null)
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
        const initialContent =
          payload.sessionDocument?.contentJson ?? payload.initialContentJson
        setDraftContent(initialContent)
        lastSavedFingerprintRef.current = JSON.stringify(initialContent)
        if (payload.sessionDocument) {
          upsertSessionDocument(payload.sessionDocument)
        }
        setError(null)
      })
      .catch((fetchError) => {
        console.error("Failed to load structured document", fetchError)
        setError("Failed to load document")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [activeSession, routeState, templateId, upsertSessionDocument])

  const currentSessionDocument = routeState?.sessionDocument ?? null

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
              templateVersionId: routeState.activeVersion.id,
              contentJson: draftContent,
              generatedAt: currentSessionDocument?.generatedAt ?? null,
            }),
          }
        )

        if (!response.ok) {
          throw new Error("Failed to save document")
        }

        const payload = (await response.json()) as SessionDocumentSaveResponse
        lastSavedFingerprintRef.current = JSON.stringify(
          payload.sessionDocument.contentJson
        )
        setRouteState((current) =>
          current
            ? {
                ...current,
                sessionDocument: payload.sessionDocument,
                activeVersion: payload.activeVersion,
              }
            : current
        )
        upsertSessionDocument(payload.sessionDocument)
        deleteCachedSession(activeSession.id)
        setError(null)
      } catch (saveError) {
        console.error("Failed to autosave structured document", saveError)
      } finally {
        setIsSaving(false)
      }
    }, 900)

    return () => clearTimeout(saveTimer)
  }, [
    activeSession,
    draftContent,
    currentSessionDocument?.generatedAt,
    routeState,
    templateId,
    upsertSessionDocument,
  ])

  useEffect(() => {
    if (!activeSession || !routeState) return

    cacheSessionDocumentSchema(
      activeSession.id,
      templateId,
      routeState.activeVersion.schemaJson.nodes
    )
  }, [activeSession, cacheSessionDocumentSchema, routeState, templateId])

  const schema = routeState?.activeVersion.schemaJson ?? { nodes: [] }
  const hasUpdateAvailable =
    !!installedDocument &&
    !!currentSessionDocument &&
    currentSessionDocument.templateVersionId !== installedDocument.installedVersionId
  const renderedSections = useMemo(
    () =>
      draftContent
        ? buildGenericDocumentSections(draftContent, schema.nodes)
        : [],
    [draftContent, schema.nodes]
  )

  const versionLabel = useMemo(() => {
    if (routeState?.activeVersion.versionNumber) {
      return `v${routeState.activeVersion.versionNumber}`
    }
    return "Draft"
  }, [routeState?.activeVersion.versionNumber])

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

        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-border/70 bg-muted/20 p-1">
            <button
              type="button"
              className={`rounded-md px-2.5 py-1 text-xs ${viewMode === "preview" ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground"}`}
              onClick={() => setViewMode("preview")}
            >
              {tBuilder("workspace.previewTab")}
            </button>
            <button
              type="button"
              className={`rounded-md px-2.5 py-1 text-xs ${viewMode === "edit" ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground"}`}
              onClick={() => setViewMode("edit")}
            >
              {tBuilder("workspace.editTab")}
            </button>
          </div>

          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            disabled={isGenerating || !installedDocument}
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
                  activeVersion: SessionDocumentRouteResponse["activeVersion"]
                }
                setRouteState((current) =>
                  current
                    ? {
                        ...current,
                        sessionDocument: payload.sessionDocument,
                        activeVersion: payload.activeVersion,
                      }
                    : current
                )
                upsertSessionDocument(payload.sessionDocument)
                lastSavedFingerprintRef.current = JSON.stringify(
                  payload.sessionDocument.contentJson
                )
                setDraftContent(payload.sessionDocument.contentJson)
                deleteCachedSession(activeSession.id)
                setError(null)
              } catch (generateError) {
                console.error("Failed to generate structured document", generateError)
                setError("Failed to generate document")
              } finally {
                setIsGenerating(false)
              }
            }}
          >
            {isGenerating ? (
              <IconLoader2 className="size-3.5 animate-spin" />
            ) : (
              <IconRefresh className="size-3.5" />
            )}
            {currentSessionDocument?.generatedAt ? "Regenerate" : "Generate"}
          </Button>
        </div>
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
        ) : viewMode === "preview" ? (
          <div className="rounded-xl border border-border/70 bg-card px-4 py-4">
            <GenericDocumentPreview sections={renderedSections} variant="session" />
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

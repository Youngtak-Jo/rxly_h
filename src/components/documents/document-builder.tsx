"use client"

import { useEffect, useMemo, useState } from "react"
import {
  IconArrowDown,
  IconArrowUp,
  IconLoader2,
  IconSparkles,
  IconTrash,
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { DocumentsHeader } from "@/components/documents/documents-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  DOCUMENT_CONTEXT_SOURCES,
  type DocumentBuilderDraft,
  type DocumentSchemaNode,
  type DocumentSchemaNodeType,
  type DocumentTemplateSchema,
} from "@/types/document"
import type { UiLocale } from "@/i18n/config"
import { DEFAULT_DOCUMENT_REGION } from "@/lib/documents/language-region"
import { useDocumentWorkspaceStore } from "@/stores/document-workspace-store"
import { useSettingsStore } from "@/stores/settings-store"

interface TemplateRouteResponse {
  template: {
    id: string
    title: string
    description: string
    iconKey: string
    category: string
    language: DocumentBuilderDraft["language"]
    region: DocumentBuilderDraft["region"]
    visibility: "PRIVATE" | "PUBLIC"
    sourceKind: "BUILT_IN" | "USER"
  }
  installed: {
    installedVersionNumber: number
  } | null
  latestDraftVersion: {
    versionNumber: number
    schemaJson: DocumentTemplateSchema
    generationConfigJson: DocumentBuilderDraft["generationConfig"]
  } | null
  latestPublishedVersion: {
    versionNumber: number
    schemaJson: DocumentTemplateSchema
    generationConfigJson: DocumentBuilderDraft["generationConfig"]
  } | null
}

function createEmptyDraft(locale: UiLocale): DocumentBuilderDraft {
  return {
    title: "",
    description: "",
    iconKey: "file-text",
    category: locale === "ko" ? "문서" : "documentation",
    language: locale,
    region: DEFAULT_DOCUMENT_REGION,
    visibility: "PRIVATE",
    schema: {
      nodes: [],
    },
    generationConfig: {
      audience: locale === "ko" ? "의료진" : "clinician",
      outputTone: locale === "ko" ? "임상적" : "clinical",
      contextSources: ["transcript", "doctorNotes", "insights"],
      systemInstructions: "",
      emptyValuePolicy: "BLANK",
    },
  }
}

function isPristineDraftForLocale(
  draft: DocumentBuilderDraft,
  locale: UiLocale
): boolean {
  return JSON.stringify(draft) === JSON.stringify(createEmptyDraft(locale))
}

function createNode(type: DocumentSchemaNodeType): DocumentSchemaNode {
  const suffix = Math.random().toString(36).slice(2, 8)
  const base = {
    key: `${type}_${suffix}`,
    label: "",
    helpText: "",
    required: false,
    placeholder: "",
  }

  if (type === "group" || type === "repeatableGroup") {
    return {
      ...base,
      type,
      children: [],
    }
  }

  return {
    ...base,
    type,
  }
}

function updateNodeAtPath(
  nodes: DocumentSchemaNode[],
  path: number[],
  updater: (node: DocumentSchemaNode) => DocumentSchemaNode
): DocumentSchemaNode[] {
  if (path.length === 0) return nodes

  const [index, ...rest] = path
  return nodes.map((node, nodeIndex) => {
    if (nodeIndex !== index) return node
    if (rest.length === 0) return updater(node)
    if (node.type !== "group" && node.type !== "repeatableGroup") return node
    return {
      ...node,
      children: updateNodeAtPath(node.children, rest, updater),
    }
  })
}

function removeNodeAtPath(nodes: DocumentSchemaNode[], path: number[]): DocumentSchemaNode[] {
  if (path.length === 1) {
    return nodes.filter((_, index) => index !== path[0])
  }

  const [index, ...rest] = path
  return nodes.map((node, nodeIndex) => {
    if (nodeIndex !== index) return node
    if (node.type !== "group" && node.type !== "repeatableGroup") return node
    return {
      ...node,
      children: removeNodeAtPath(node.children, rest),
    }
  })
}

function appendChildAtPath(
  nodes: DocumentSchemaNode[],
  path: number[] | null,
  child: DocumentSchemaNode
): DocumentSchemaNode[] {
  if (!path || path.length === 0) {
    return [...nodes, child]
  }

  return updateNodeAtPath(nodes, path, (node) => {
    if (node.type !== "group" && node.type !== "repeatableGroup") return node
    return {
      ...node,
      children: [...node.children, child],
    }
  })
}

function moveNodeAtPath(
  nodes: DocumentSchemaNode[],
  path: number[],
  direction: "up" | "down"
): DocumentSchemaNode[] {
  const targetIndex = path[path.length - 1]
  const nextIndex = direction === "up" ? targetIndex - 1 : targetIndex + 1

  if (nextIndex < 0) return nodes

  if (path.length === 1) {
    if (nextIndex >= nodes.length) return nodes
    const next = [...nodes]
    ;[next[targetIndex], next[nextIndex]] = [next[nextIndex], next[targetIndex]]
    return next
  }

  const parentPath = path.slice(0, -1)
  return updateNodeAtPath(nodes, parentPath, (node) => {
    if (node.type !== "group" && node.type !== "repeatableGroup") return node
    if (nextIndex >= node.children.length) return node
    const nextChildren = [...node.children]
    ;[nextChildren[targetIndex], nextChildren[nextIndex]] = [
      nextChildren[nextIndex],
      nextChildren[targetIndex],
    ]
    return {
      ...node,
      children: nextChildren,
    }
  })
}

function SchemaNodeEditor({
  node,
  path,
  siblingCount,
  onUpdate,
  onRemove,
  onMove,
  onAddChild,
}: {
  node: DocumentSchemaNode
  path: number[]
  siblingCount: number
  onUpdate: (path: number[], updater: (node: DocumentSchemaNode) => DocumentSchemaNode) => void
  onRemove: (path: number[]) => void
  onMove: (path: number[], direction: "up" | "down") => void
  onAddChild: (path: number[], type: DocumentSchemaNodeType) => void
}) {
  const t = useTranslations("DocumentBuilder")
  const canHaveChildren = node.type === "group" || node.type === "repeatableGroup"
  const typeLabel =
    node.type === "shortText"
      ? t("schemaNode.types.shortText")
      : node.type === "longText"
        ? t("schemaNode.types.longText")
        : node.type === "stringList"
          ? t("schemaNode.types.stringList")
          : node.type === "group"
            ? t("schemaNode.types.group")
            : t("schemaNode.types.repeatableGroup")

  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{typeLabel}</Badge>
          <span className="text-sm font-medium">{node.label || node.key}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8"
            disabled={path[path.length - 1] === 0}
            onClick={() => onMove(path, "up")}
          >
            <IconArrowUp className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8"
            disabled={path[path.length - 1] >= siblingCount - 1}
            onClick={() => onMove(path, "down")}
          >
            <IconArrowDown className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 text-destructive"
            onClick={() => onRemove(path)}
          >
            <IconTrash className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("schemaNode.typeLabel")}</Label>
          <Select
            value={node.type}
            onValueChange={(value) =>
              onUpdate(path, (currentNode) => {
                if (value === "group" || value === "repeatableGroup") {
                  return {
                    ...currentNode,
                    type: value,
                    children:
                      "children" in currentNode && Array.isArray(currentNode.children)
                        ? currentNode.children
                        : [],
                  } as DocumentSchemaNode
                }

                return {
                  ...currentNode,
                  type: value,
                } as DocumentSchemaNode
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("schemaNode.selectType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shortText">{t("schemaNode.types.shortText")}</SelectItem>
              <SelectItem value="longText">{t("schemaNode.types.longText")}</SelectItem>
              <SelectItem value="stringList">{t("schemaNode.types.stringList")}</SelectItem>
              <SelectItem value="group">{t("schemaNode.types.group")}</SelectItem>
              <SelectItem value="repeatableGroup">
                {t("schemaNode.types.repeatableGroup")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("schemaNode.keyLabel")}</Label>
          <Input
            value={node.key}
            onChange={(event) =>
              onUpdate(path, (currentNode) => ({
                ...currentNode,
                key: event.target.value,
              }))
            }
            placeholder={t("schemaNode.keyPlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("schemaNode.fieldLabel")}</Label>
          <Input
            value={node.label}
            onChange={(event) =>
              onUpdate(path, (currentNode) => ({
                ...currentNode,
                label: event.target.value,
              }))
            }
            placeholder={t("schemaNode.labelPlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("schemaNode.placeholderLabel")}</Label>
          <Input
            value={node.placeholder}
            onChange={(event) =>
              onUpdate(path, (currentNode) => ({
                ...currentNode,
                placeholder: event.target.value,
              }))
            }
            placeholder={t("schemaNode.inputPlaceholder")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("schemaNode.helpTextLabel")}</Label>
        <Textarea
          value={node.helpText}
          onChange={(event) =>
            onUpdate(path, (currentNode) => ({
              ...currentNode,
              helpText: event.target.value,
            }))
          }
          className="min-h-20 resize-y"
          placeholder={t("schemaNode.helpTextPlaceholder")}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={node.required}
          onCheckedChange={(checked) =>
            onUpdate(path, (currentNode) => ({
              ...currentNode,
              required: checked === true,
            }))
          }
        />
        {t("schemaNode.required")}
      </label>

      {canHaveChildren ? (
        <div className="space-y-3 rounded-xl border border-dashed border-border/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">{t("schemaNode.children")}</span>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => onAddChild(path, "shortText")}>
                {t("schemaEditor.addField")}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => onAddChild(path, "group")}>
                {t("schemaEditor.addGroup")}
              </Button>
            </div>
          </div>
          {node.children.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("schemaNode.noChildren")}</p>
          ) : (
            <div className="space-y-3">
              {node.children.map((child, index) => (
                <SchemaNodeEditor
                  key={`${child.key}-${index}`}
                  node={child}
                  path={[...path, index]}
                  siblingCount={node.children.length}
                  onUpdate={onUpdate}
                  onRemove={onRemove}
                  onMove={onMove}
                  onAddChild={onAddChild}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function PreviewNode({ node }: { node: DocumentSchemaNode }) {
  const t = useTranslations("DocumentBuilder")
  const canHaveChildren = node.type === "group" || node.type === "repeatableGroup"
  const typeLabel =
    node.type === "shortText"
      ? t("schemaNode.types.shortText")
      : node.type === "longText"
        ? t("schemaNode.types.longText")
        : node.type === "stringList"
          ? t("schemaNode.types.stringList")
          : node.type === "group"
            ? t("schemaNode.types.group")
            : t("schemaNode.types.repeatableGroup")

  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-background p-3">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{typeLabel}</Badge>
        <span className="text-sm font-medium">{node.label || node.key}</span>
      </div>
      {node.helpText ? (
        <p className="text-xs text-muted-foreground">{node.helpText}</p>
      ) : null}
      {canHaveChildren ? (
        <div className="space-y-2">
          {node.children.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("preview.noChildFields")}</p>
          ) : (
            node.children.map((child, index) => (
              <PreviewNode key={`${child.key}-${index}`} node={child} />
            ))
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs text-muted-foreground">
          {node.placeholder || t("preview.inputPlaceholder")}
        </div>
      )}
    </div>
  )
}

export function DocumentBuilder({
  templateId,
}: {
  templateId?: string
}) {
  const router = useRouter()
  const locale = useLocale() as UiLocale
  const t = useTranslations("DocumentBuilder")
  const documentModel = useSettingsStore((state) => state.aiModel.documentModel)
  const refreshWorkspaceSnapshot = useDocumentWorkspaceStore(
    (state) => state.refreshWorkspaceSnapshot
  )

  const [draft, setDraft] = useState<DocumentBuilderDraft>(() => createEmptyDraft(locale))
  const [aiPrompt, setAiPrompt] = useState("")
  const [loading, setLoading] = useState(!!templateId)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [resolvedTemplateId, setResolvedTemplateId] = useState<string | null>(
    templateId ?? null
  )
  const [publishedVersionNumber, setPublishedVersionNumber] = useState<number | null>(null)
  const [installedVersionNumber, setInstalledVersionNumber] = useState<number | null>(null)

  useEffect(() => {
    if (templateId || resolvedTemplateId) return

    const otherLocale = locale === "ko" ? "en" : "ko"
    if (!isPristineDraftForLocale(draft, otherLocale)) return

    setDraft(createEmptyDraft(locale))
  }, [draft, locale, resolvedTemplateId, templateId])

  useEffect(() => {
    if (!templateId) return

    setLoading(true)
    fetch(`/api/documents/${templateId}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(t("toasts.loadTemplateFailed"))
        }
        return (await response.json()) as TemplateRouteResponse
      })
      .then((payload) => {
        const editableVersion =
          payload.latestDraftVersion ?? payload.latestPublishedVersion
        if (!editableVersion) {
          throw new Error("No editable version found")
        }

        setDraft({
          title: payload.template.title,
          description: payload.template.description,
          iconKey: payload.template.iconKey,
          category: payload.template.category,
          language: payload.template.language,
          region: payload.template.region,
          visibility: payload.template.visibility,
          schema: editableVersion.schemaJson,
          generationConfig: editableVersion.generationConfigJson,
        })
        setResolvedTemplateId(payload.template.id)
        setPublishedVersionNumber(payload.latestPublishedVersion?.versionNumber ?? null)
        setInstalledVersionNumber(payload.installed?.installedVersionNumber ?? null)
      })
      .catch((error) => {
        console.error("Failed to load template", error)
        toast.error(t("toasts.loadTemplateFailed"))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [t, templateId])

  const updateNodes = (
    updater: (nodes: DocumentSchemaNode[]) => DocumentSchemaNode[]
  ) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      schema: {
        nodes: updater(currentDraft.schema.nodes),
      },
    }))
  }

  const handleAiDraft = async () => {
    if (aiPrompt.trim().length < 10) {
      toast.error(t("toasts.promptTooShort"))
      return
    }

    try {
      setAiLoading(true)
      const endpoint = resolvedTemplateId
        ? `/api/documents/${resolvedTemplateId}/ai-revise`
        : "/api/documents/ai/draft"
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          resolvedTemplateId
            ? { prompt: aiPrompt, draft, model: documentModel }
            : {
                prompt: aiPrompt,
                defaultLanguage: locale,
                defaultRegion: DEFAULT_DOCUMENT_REGION,
                model: documentModel,
              }
        ),
      })
      if (!response.ok) {
        throw new Error(t("toasts.generateFailed"))
      }
      const payload = (await response.json()) as DocumentBuilderDraft
      setDraft(payload)
      toast.success(
        resolvedTemplateId ? t("toasts.draftRevised") : t("toasts.draftGenerated")
      )
    } catch (error) {
      console.error("Failed to generate document draft", error)
      toast.error(t("toasts.generateFailed"))
    } finally {
      setAiLoading(false)
    }
  }

  const saveDraft = async (): Promise<string | null> => {
    try {
      setSaving(true)
      if (resolvedTemplateId) {
        const response = await fetch(`/api/documents/${resolvedTemplateId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        })
        if (!response.ok) {
          throw new Error(t("toasts.saveFailed"))
        }
        toast.success(t("toasts.draftSaved"))
        return resolvedTemplateId
      }

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      })
      if (!response.ok) {
        throw new Error(t("toasts.saveFailed"))
      }

      const payload = (await response.json()) as { id: string }
      setResolvedTemplateId(payload.id)
      toast.success(t("toasts.draftCreated"))
      router.replace(`/documents/${payload.id}/edit`)
      return payload.id
    } catch (error) {
      console.error("Failed to save document draft", error)
      toast.error(t("toasts.saveFailed"))
      return null
    } finally {
      setSaving(false)
    }
  }

  const publishDraft = async () => {
    try {
      setPublishing(true)
      let currentTemplateId = resolvedTemplateId
      if (!currentTemplateId) {
        currentTemplateId = await saveDraft()
      }
      if (!currentTemplateId) {
        throw new Error("Template id is missing")
      }

      const response = await fetch(`/api/documents/${currentTemplateId}/publish`, {
        method: "POST",
      })
      if (!response.ok) {
        throw new Error(t("toasts.publishFailed"))
      }

      const payload = (await response.json()) as {
        latestPublishedVersion: { versionNumber: number } | null
      }
      setPublishedVersionNumber(payload.latestPublishedVersion?.versionNumber ?? null)
      toast.success(t("toasts.documentPublished"))
    } catch (error) {
      console.error("Failed to publish document", error)
      toast.error(t("toasts.publishFailed"))
    } finally {
      setPublishing(false)
    }
  }

  const installPublished = async () => {
    if (!resolvedTemplateId) {
      toast.error(t("toasts.saveAndPublishFirst"))
      return
    }

    try {
      setInstalling(true)
      const response = await fetch(
        `/api/documents/${resolvedTemplateId}/install?locale=${encodeURIComponent(locale)}`,
        {
          method: "POST",
        }
      )
      if (!response.ok) {
        throw new Error(t("toasts.installFailed"))
      }
      const snapshot = await refreshWorkspaceSnapshot({ locale })
      const installedDocument =
        snapshot?.installedDocuments.find(
          (document) => document.templateId === resolvedTemplateId
        ) ?? null
      setInstalledVersionNumber(installedDocument?.installedVersionNumber ?? null)
      toast.success(t("toasts.documentInstalled"))
    } catch (error) {
      console.error("Failed to install document", error)
      toast.error(t("toasts.installFailed"))
    } finally {
      setInstalling(false)
    }
  }

  const headerActions = (
    <>
      <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => void saveDraft()}>
        {saving ? <IconLoader2 className="size-3.5 animate-spin" /> : null}
        {t("headerActions.saveDraft")}
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={publishing} onClick={() => void publishDraft()}>
        {publishing ? <IconLoader2 className="size-3.5 animate-spin" /> : null}
        {t("headerActions.publish")}
      </Button>
      <Button type="button" size="sm" disabled={installing || !publishedVersionNumber} onClick={() => void installPublished()}>
        {installing ? <IconLoader2 className="size-3.5 animate-spin" /> : null}
        {t("headerActions.install")}
      </Button>
    </>
  )

  const previewNodes = useMemo(() => draft.schema.nodes, [draft.schema.nodes])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <DocumentsHeader
        title={resolvedTemplateId ? t("titleEdit") : t("titleNew")}
        subtitle={t("subtitle")}
        actions={headerActions}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 lg:px-6">
        {loading ? (
          <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
            <IconLoader2 className="size-4 animate-spin" />
            {t("loadingTemplate")}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">{t("aiDraft.title")}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("aiDraft.description")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {publishedVersionNumber ? (
                    <Badge variant="secondary">
                      {t("badges.publishedVersion", {
                        version: publishedVersionNumber,
                      })}
                    </Badge>
                  ) : null}
                  {installedVersionNumber ? (
                    <Badge variant="outline">
                      {t("badges.installedVersion", {
                        version: installedVersionNumber,
                      })}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-3 lg:flex-row">
                <Textarea
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                  className="min-h-28 flex-1 resize-y"
                  placeholder={t("aiDraft.placeholder")}
                />
                <Button
                  type="button"
                  className="gap-1.5 self-start"
                  disabled={aiLoading}
                  onClick={() => void handleAiDraft()}
                >
                  {aiLoading ? (
                    <IconLoader2 className="size-4 animate-spin" />
                  ) : (
                    <IconSparkles className="size-4" />
                  )}
                  {resolvedTemplateId ? t("aiDraft.revise") : t("aiDraft.generate")}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-card p-5">
                  <h2 className="text-base font-semibold">{t("templateSettings.title")}</h2>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t("templateSettings.titleLabel")}</Label>
                      <Input
                        value={draft.title}
                        onChange={(event) =>
                          setDraft((currentDraft) => ({
                            ...currentDraft,
                            title: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("templateSettings.categoryLabel")}</Label>
                      <Input
                        value={draft.category}
                        onChange={(event) =>
                          setDraft((currentDraft) => ({
                            ...currentDraft,
                            category: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("templateSettings.iconKeyLabel")}</Label>
                      <Input
                        value={draft.iconKey}
                        onChange={(event) =>
                          setDraft((currentDraft) => ({
                            ...currentDraft,
                            iconKey: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("templateSettings.visibilityLabel")}</Label>
                      <Select
                        value={draft.visibility}
                        onValueChange={(value: "PRIVATE" | "PUBLIC") =>
                          setDraft((currentDraft) => ({
                            ...currentDraft,
                            visibility: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRIVATE">
                            {t("templateSettings.visibility.private")}
                          </SelectItem>
                          <SelectItem value="PUBLIC">
                            {t("templateSettings.visibility.public")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label>{t("templateSettings.descriptionLabel")}</Label>
                    <Textarea
                      value={draft.description}
                      onChange={(event) =>
                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          description: event.target.value,
                        }))
                      }
                      className="min-h-24 resize-y"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold">{t("schemaEditor.title")}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("schemaEditor.description")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => updateNodes((nodes) => [...nodes, createNode("shortText")])}
                      >
                        {t("schemaEditor.addField")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => updateNodes((nodes) => [...nodes, createNode("group")])}
                      >
                        {t("schemaEditor.addGroup")}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    {draft.schema.nodes.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                        {t("schemaEditor.empty")}
                      </div>
                    ) : (
                      draft.schema.nodes.map((node, index) => (
                        <SchemaNodeEditor
                          key={`${node.key}-${index}`}
                          node={node}
                          path={[index]}
                          siblingCount={draft.schema.nodes.length}
                          onUpdate={(path, updater) =>
                            updateNodes((nodes) => updateNodeAtPath(nodes, path, updater))
                          }
                          onRemove={(path) =>
                            updateNodes((nodes) => removeNodeAtPath(nodes, path))
                          }
                          onMove={(path, direction) =>
                            updateNodes((nodes) => moveNodeAtPath(nodes, path, direction))
                          }
                          onAddChild={(path, type) =>
                            updateNodes((nodes) =>
                              appendChildAtPath(nodes, path, createNode(type))
                            )
                          }
                        />
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card p-5">
                  <h2 className="text-base font-semibold">{t("generationSettings.title")}</h2>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t("generationSettings.audienceLabel")}</Label>
                      <Input
                        value={draft.generationConfig.audience}
                        onChange={(event) =>
                          setDraft((currentDraft) => ({
                            ...currentDraft,
                            generationConfig: {
                              ...currentDraft.generationConfig,
                              audience: event.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("generationSettings.outputToneLabel")}</Label>
                      <Input
                        value={draft.generationConfig.outputTone}
                        onChange={(event) =>
                          setDraft((currentDraft) => ({
                            ...currentDraft,
                            generationConfig: {
                              ...currentDraft.generationConfig,
                              outputTone: event.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Label>{t("generationSettings.systemInstructionsLabel")}</Label>
                    <Textarea
                      value={draft.generationConfig.systemInstructions}
                      onChange={(event) =>
                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          generationConfig: {
                            ...currentDraft.generationConfig,
                            systemInstructions: event.target.value,
                          },
                        }))
                      }
                      className="min-h-24 resize-y"
                    />
                  </div>

                  <div className="mt-4 space-y-3">
                    <Label>{t("generationSettings.contextSourcesLabel")}</Label>
                    <div className="grid gap-2 md:grid-cols-2">
                      {DOCUMENT_CONTEXT_SOURCES.map((source) => {
                        const checked = draft.generationConfig.contextSources.includes(source)
                        return (
                          <label key={source} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(nextChecked) =>
                                setDraft((currentDraft) => ({
                                  ...currentDraft,
                                  generationConfig: {
                                    ...currentDraft.generationConfig,
                                    contextSources:
                                      nextChecked === true
                                        ? Array.from(
                                            new Set([
                                              ...currentDraft.generationConfig.contextSources,
                                              source,
                                            ])
                                          )
                                        : currentDraft.generationConfig.contextSources.filter(
                                            (item) => item !== source
                                          ),
                                  },
                                }))
                              }
                            />
                            {t(`contextSources.${source}`)}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-card p-5">
                  <h2 className="text-base font-semibold">{t("preview.title")}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("preview.description")}
                  </p>
                  <div className="mt-4 space-y-3">
                    {previewNodes.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center text-sm text-muted-foreground">
                        {t("preview.empty")}
                      </div>
                    ) : (
                      previewNodes.map((node, index) => (
                        <PreviewNode key={`${node.key}-${index}`} node={node} />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

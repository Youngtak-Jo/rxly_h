"use client"

import {
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react"
import {
  IconArrowDown,
  IconArrowUp,
  IconChevronDown,
  IconChevronRight,
  IconLoader2,
  IconPlus,
  IconSparkles,
  IconTrash,
} from "@tabler/icons-react"
import { useTranslations } from "next-intl"

import {
  appendChildAtPath,
  createNode,
  moveNodeAtPath,
  removeNodeAtPath,
  updateNodeAtPath,
} from "@/components/documents/document-builder-utils"
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
import { createEmptyDocumentContent } from "@/lib/documents/schema"
import { cn } from "@/lib/utils"
import {
  DOCUMENT_CONTEXT_SOURCES,
  type DocumentBuilderDraft,
  type DocumentSchemaNode,
  type DocumentSchemaNodeType,
} from "@/types/document"

type PathSegment = string | number
type MutableCursor = Record<string, unknown> | unknown[]

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function humanizeKey(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
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

function getValueAtPath(
  content: Record<string, unknown>,
  path: PathSegment[]
): unknown {
  let cursor: unknown = content

  for (const segment of path) {
    if (Array.isArray(cursor) && typeof segment === "number") {
      cursor = cursor[segment]
      continue
    }

    if (
      cursor &&
      typeof cursor === "object" &&
      !Array.isArray(cursor) &&
      typeof segment === "string"
    ) {
      cursor = (cursor as Record<string, unknown>)[segment]
      continue
    }

    return undefined
  }

  return cursor
}

function toNodePathId(path: number[]) {
  return path.join(".")
}

function coerceNodeType(
  currentNode: DocumentSchemaNode,
  nextType: DocumentSchemaNodeType
): DocumentSchemaNode {
  if (nextType === "group" || nextType === "repeatableGroup") {
    return {
      ...currentNode,
      type: nextType,
      children:
        "children" in currentNode && Array.isArray(currentNode.children)
          ? currentNode.children
          : [],
    } as DocumentSchemaNode
  }

  return {
    key: currentNode.key,
    label: currentNode.label,
    helpText: currentNode.helpText,
    required: currentNode.required,
    placeholder: currentNode.placeholder,
    type: nextType,
  }
}

function ExampleFieldInput({
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
        placeholder={node.placeholder || node.label || humanizeKey(node.key)}
        onChange={(event) => onChange(event.target.value)}
      />
    )
  }

  if (node.type === "longText") {
    return (
      <Textarea
        value={typeof value === "string" ? value : ""}
        placeholder={node.placeholder || node.label || humanizeKey(node.key)}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[120px] resize-y"
      />
    )
  }

  return (
    <Textarea
      value={Array.isArray(value) ? value.join("\n") : ""}
      placeholder={node.placeholder || `${node.label || humanizeKey(node.key)} (one item per line)`}
      onChange={(event) =>
        onChange(
          event.target.value
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      }
      className="min-h-[120px] resize-y"
    />
  )
}

function CompactActionButton({
  label,
  disabled,
  destructive = false,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  destructive?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "size-8 rounded-full border border-transparent text-muted-foreground hover:border-border/70 hover:text-foreground",
        destructive && "text-destructive hover:text-destructive"
      )}
    >
      {children}
    </Button>
  )
}

function NodeDetailsPanel({
  node,
  path,
  onUpdate,
}: {
  node: DocumentSchemaNode
  path: number[]
  onUpdate: (
    path: number[],
    updater: (node: DocumentSchemaNode) => DocumentSchemaNode
  ) => void
}) {
  const t = useTranslations("DocumentBuilder")

  return (
    <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("schemaNode.typeLabel")}</Label>
          <Select
            value={node.type}
            onValueChange={(value) =>
              onUpdate(path, (currentNode) =>
                coerceNodeType(currentNode, value as DocumentSchemaNodeType)
              )
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

        <div className="space-y-2 md:col-span-2">
          <Label>{t("schemaNode.helpTextLabel")}</Label>
          <Textarea
            value={node.helpText}
            onChange={(event) =>
              onUpdate(path, (currentNode) => ({
                ...currentNode,
                helpText: event.target.value,
              }))
            }
            className="min-h-24 resize-y"
            placeholder={t("schemaNode.helpTextPlaceholder")}
          />
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm">
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
    </div>
  )
}

function SampleValuePanel({
  node,
  value,
  onChange,
}: {
  node: DocumentSchemaNode
  value: unknown
  onChange: (value: unknown) => void
}) {
  const t = useTranslations("DocumentBuilder")

  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold">{t("preview.sampleTitle")}</h4>
        <p className="text-sm text-muted-foreground">
          {t("preview.sampleDescription")}
        </p>
      </div>
      <div className="mt-4">
        <ExampleFieldInput node={node} value={value} onChange={onChange} />
      </div>
    </div>
  )
}

function UnifiedSchemaNodeEditor({
  node,
  path,
  depth,
  siblingCount,
  contentPath,
  rootContent,
  expandedNodeIds,
  repeatableGroupActiveItem,
  onToggleExpanded,
  onExpand,
  onSetRepeatableGroupActiveItem,
  onPreviewContentChange,
  onUpdateNode,
  onRemoveNode,
  onMoveNode,
  onAddChild,
}: {
  node: DocumentSchemaNode
  path: number[]
  depth: number
  siblingCount: number
  contentPath: PathSegment[]
  rootContent: Record<string, unknown>
  expandedNodeIds: string[]
  repeatableGroupActiveItem: Record<string, number>
  onToggleExpanded: (pathId: string) => void
  onExpand: (pathId: string) => void
  onSetRepeatableGroupActiveItem: (pathId: string, index: number) => void
  onPreviewContentChange: (nextContent: Record<string, unknown>) => void
  onUpdateNode: (
    path: number[],
    updater: (node: DocumentSchemaNode) => DocumentSchemaNode
  ) => void
  onRemoveNode: (path: number[]) => void
  onMoveNode: (path: number[], direction: "up" | "down") => void
  onAddChild: (path: number[], type: DocumentSchemaNodeType) => void
}) {
  const t = useTranslations("DocumentBuilder")
  const pathId = toNodePathId(path)
  const isExpanded = expandedNodeIds.includes(pathId)
  const isGroup = node.type === "group" || node.type === "repeatableGroup"
  const currentValue = getValueAtPath(rootContent, contentPath)
  const nodeTitle = node.label || humanizeKey(node.key)
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

  const repeatableItems =
    node.type === "repeatableGroup" && Array.isArray(currentValue)
      ? (currentValue as Array<Record<string, unknown>>)
      : []
  const activeRepeatableItemIndex =
    node.type === "repeatableGroup" && repeatableItems.length > 0
      ? Math.min(
          repeatableGroupActiveItem[pathId] ?? 0,
          Math.max(repeatableItems.length - 1, 0)
        )
      : 0

  const addRepeatableItem = () => {
    if (node.type !== "repeatableGroup") return
    onPreviewContentChange(
      appendArrayItemAtPath(
        rootContent,
        contentPath,
        createEmptyDocumentContent({ nodes: node.children })
      )
    )
    onSetRepeatableGroupActiveItem(pathId, repeatableItems.length)
    onExpand(pathId)
  }

  const removeActiveRepeatableItem = () => {
    if (node.type !== "repeatableGroup" || repeatableItems.length === 0) return
    onPreviewContentChange(
      removeArrayItemAtPath(rootContent, contentPath, activeRepeatableItemIndex)
    )
    onSetRepeatableGroupActiveItem(
      pathId,
      Math.max(0, activeRepeatableItemIndex - 1)
    )
  }

  const childContentBasePath =
    node.type === "repeatableGroup"
      ? [...contentPath, activeRepeatableItemIndex]
      : contentPath

  return (
    <div
      className={cn(
        "space-y-4",
        depth > 0 && "ml-4 border-l border-border/50 pl-4"
      )}
    >
      <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border/70 bg-muted/20 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  {typeLabel}
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  {nodeTitle}
                </h3>
                {isGroup ? (
                  <span className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground">
                    {node.type === "repeatableGroup"
                      ? t("schemaNode.itemCount", {
                          count: repeatableItems.length,
                        })
                      : t("schemaNode.childCount", {
                          count: node.children.length,
                        })}
                  </span>
                ) : null}
                {!isGroup && node.required ? (
                  <span className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground">
                    {t("schemaNode.required")}
                  </span>
                ) : null}
              </div>
              <code className="block overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-foreground">
                {node.key}
              </code>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-1">
              <CompactActionButton
                label={
                  isExpanded
                    ? t("schemaNode.actions.collapse")
                    : t("schemaNode.actions.expand")
                }
                onClick={() => onToggleExpanded(pathId)}
              >
                {isExpanded ? (
                  <IconChevronDown className="size-4" />
                ) : (
                  <IconChevronRight className="size-4" />
                )}
              </CompactActionButton>
              <CompactActionButton
                label={t("schemaNode.actions.moveUp")}
                disabled={path[path.length - 1] === 0}
                onClick={() => onMoveNode(path, "up")}
              >
                <IconArrowUp className="size-4" />
              </CompactActionButton>
              <CompactActionButton
                label={t("schemaNode.actions.moveDown")}
                disabled={path[path.length - 1] >= siblingCount - 1}
                onClick={() => onMoveNode(path, "down")}
              >
                <IconArrowDown className="size-4" />
              </CompactActionButton>
              <CompactActionButton
                label={t("schemaNode.actions.delete")}
                destructive
                onClick={() => onRemoveNode(path)}
              >
                <IconTrash className="size-4" />
              </CompactActionButton>
            </div>
          </div>

          {isExpanded ? (
            <div className="space-y-4 border-t border-border/60 pt-4">
              <NodeDetailsPanel node={node} path={path} onUpdate={onUpdateNode} />

              {isGroup ? (
                <>
                  {node.type === "repeatableGroup" ? (
                    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold">
                              {t("preview.sampleTitle")}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {t("preview.repeatableDescription")}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="gap-1.5"
                              onClick={addRepeatableItem}
                            >
                              <IconPlus className="size-3.5" />
                              {t("preview.addSampleItem")}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={repeatableItems.length === 0}
                              onClick={removeActiveRepeatableItem}
                            >
                              {t("preview.removeItem")}
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {repeatableItems.length === 0 ? (
                            <span className="text-sm text-muted-foreground">
                              {t("preview.noSampleItems")}
                            </span>
                          ) : (
                            repeatableItems.map((_, index) => (
                              <button
                                key={`${pathId}-item-${index}`}
                                type="button"
                                aria-label={t("schemaNode.actions.activateItem", {
                                  index: index + 1,
                                })}
                                className={cn(
                                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                                  index === activeRepeatableItemIndex
                                    ? "border-foreground bg-foreground text-background"
                                    : "border-border/70 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                                )}
                                onClick={() =>
                                  onSetRepeatableGroupActiveItem(pathId, index)
                                }
                              >
                                {t("preview.sampleItem")} {index + 1}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-border/70 bg-muted/15 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold">
                          {t("schemaNode.children")}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {t("schemaEditor.description")}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => {
                            onAddChild(path, "shortText")
                            onExpand(pathId)
                          }}
                        >
                          <IconPlus className="size-3.5" />
                          {t("schemaEditor.addField")}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => {
                            onAddChild(path, "group")
                            onExpand(pathId)
                          }}
                        >
                          <IconPlus className="size-3.5" />
                          {t("schemaEditor.addGroup")}
                        </Button>
                      </div>
                    </div>

                    {node.type === "repeatableGroup" && repeatableItems.length === 0 ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
                        {t("preview.noSampleItems")}
                      </div>
                    ) : node.children.length === 0 ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
                        {t("schemaNode.noChildren")}
                      </div>
                    ) : (
                      <div className="mt-4 space-y-4">
                        {node.children.map((child, index) => (
                          <UnifiedSchemaNodeEditor
                            key={`${pathId}-${child.key}-${index}`}
                            node={child}
                            path={[...path, index]}
                            depth={depth + 1}
                            siblingCount={node.children.length}
                            contentPath={[...childContentBasePath, child.key]}
                            rootContent={rootContent}
                            expandedNodeIds={expandedNodeIds}
                            repeatableGroupActiveItem={repeatableGroupActiveItem}
                            onToggleExpanded={onToggleExpanded}
                            onExpand={onExpand}
                            onSetRepeatableGroupActiveItem={
                              onSetRepeatableGroupActiveItem
                            }
                            onPreviewContentChange={onPreviewContentChange}
                            onUpdateNode={onUpdateNode}
                            onRemoveNode={onRemoveNode}
                            onMoveNode={onMoveNode}
                            onAddChild={onAddChild}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <SampleValuePanel
                  node={node}
                  value={currentValue}
                  onChange={(value) =>
                    onPreviewContentChange(
                      updateValueAtPath(rootContent, contentPath, value)
                    )
                  }
                />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function SectionToggle({
  title,
  description,
  open,
  onToggle,
}: {
  title: string
  description: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-start justify-between gap-4 text-left"
    >
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <span
        className={cn(
          "mt-1 rounded-full border border-border/70 p-1 text-muted-foreground transition-transform",
          open && "rotate-180"
        )}
      >
        <IconChevronDown className="size-4" />
      </span>
    </button>
  )
}

export function DocumentBuilderStepStructure({
  draft,
  setDraft,
  previewContent,
  aiLoading,
  aiPrompt,
  showAiRevisePanel,
  documentModelLabel,
  onAiPromptChange,
  onAiRevise,
  onOpenModelSettings,
  onPreviewContentChange,
  onResetToServerVersion,
  restoredLocalChanges,
  validationError,
}: {
  draft: DocumentBuilderDraft
  setDraft: Dispatch<SetStateAction<DocumentBuilderDraft>>
  previewContent: Record<string, unknown>
  aiLoading: boolean
  aiPrompt: string
  showAiRevisePanel: boolean
  documentModelLabel: string
  onAiPromptChange: (value: string) => void
  onAiRevise: () => Promise<void>
  onOpenModelSettings: () => void
  onPreviewContentChange: (nextContent: Record<string, unknown>) => void
  onResetToServerVersion: (() => void) | null
  restoredLocalChanges: boolean
  validationError: string | null
}) {
  const t = useTranslations("DocumentBuilder")
  const [expandedNodeIds, setExpandedNodeIds] = useState<string[]>([])
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [advancedPanelOpen, setAdvancedPanelOpen] = useState(false)
  const [repeatableGroupActiveItem, setRepeatableGroupActiveItem] = useState<
    Record<string, number>
  >({})

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

  const toggleExpanded = (pathId: string) => {
    setExpandedNodeIds((current) =>
      current.includes(pathId)
        ? current.filter((id) => id !== pathId)
        : [...current, pathId]
    )
  }

  const expandNode = (pathId: string) => {
    setExpandedNodeIds((current) =>
      current.includes(pathId) ? current : [...current, pathId]
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold">
              {t("templateSettings.basicTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("templateSettings.basicDescription")}
            </p>
          </div>

          <div className="mt-5 grid gap-4">
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

            <div className="grid gap-4 md:grid-cols-2">
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
          </div>
        </div>

        {restoredLocalChanges ? (
          <div className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{t("localDraft.restoredTitle")}</p>
              <p className="text-xs opacity-80">
                {t("localDraft.restoredDescription")}
              </p>
            </div>
            {onResetToServerVersion ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onResetToServerVersion}
              >
                {t("localDraft.resetToServer")}
              </Button>
            ) : null}
          </div>
        ) : null}

        {validationError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {validationError}
          </div>
        ) : null}

        {showAiRevisePanel ? (
          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
            <SectionToggle
              title={t("aiDraft.revisePanelTitle")}
              description={t("aiDraft.revisePanelDescription")}
              open={aiPanelOpen}
              onToggle={() => setAiPanelOpen((current) => !current)}
            />

            {aiPanelOpen ? (
              <div className="mt-5 border-t border-border/60 pt-5">
                <Textarea
                  value={aiPrompt}
                  onChange={(event) => onAiPromptChange(event.target.value)}
                  className="min-h-[140px] resize-y"
                  placeholder={t("aiDraft.revisePlaceholder")}
                />
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                    <p className="text-sm text-muted-foreground">
                      {t("model.currentLabel", { model: documentModelLabel })}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onOpenModelSettings}
                    >
                      {t("model.changeInSettings")}
                    </Button>
                  </div>

                  <Button
                    type="button"
                    className="gap-2 self-end"
                    disabled={aiLoading}
                    onClick={() => void onAiRevise()}
                  >
                    {aiLoading ? (
                      <IconLoader2 className="size-4 animate-spin" />
                    ) : (
                      <IconSparkles className="size-4" />
                    )}
                    {t("aiDraft.revise")}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <SectionToggle
            title={t("generationSettings.advancedTitle")}
            description={t("generationSettings.advancedDescription")}
            open={advancedPanelOpen}
            onToggle={() => setAdvancedPanelOpen((current) => !current)}
          />

          {advancedPanelOpen ? (
            <div className="mt-5 space-y-5 border-t border-border/60 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  {t("model.currentLabel", { model: documentModelLabel })}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onOpenModelSettings}
                >
                  {t("model.changeInSettings")}
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

              <div className="space-y-2">
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
                  className="min-h-32 resize-y"
                />
              </div>

              <div className="space-y-3">
                <Label>{t("generationSettings.contextSourcesLabel")}</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {DOCUMENT_CONTEXT_SOURCES.map((source) => {
                    const checked =
                      draft.generationConfig.contextSources.includes(source)
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
                                          ...currentDraft.generationConfig
                                            .contextSources,
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
                        {t(`contextSources.${source}` as never)}
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold">{t("schemaEditor.title")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("schemaEditor.canvasDescription")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                onClick={() =>
                  updateNodes((nodes) => [...nodes, createNode("shortText")])
                }
              >
                <IconPlus className="size-4" />
                {t("schemaEditor.addField")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                onClick={() => updateNodes((nodes) => [...nodes, createNode("group")])}
              >
                <IconPlus className="size-4" />
                {t("schemaEditor.addGroup")}
              </Button>
            </div>
          </div>

          {draft.schema.nodes.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-border/70 px-4 py-12 text-center text-sm text-muted-foreground">
              {t("schemaEditor.empty")}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {draft.schema.nodes.map((node, index) => (
                <UnifiedSchemaNodeEditor
                  key={`${node.key}-${index}`}
                  node={node}
                  path={[index]}
                  depth={0}
                  siblingCount={draft.schema.nodes.length}
                  contentPath={[node.key]}
                  rootContent={previewContent}
                  expandedNodeIds={expandedNodeIds}
                  repeatableGroupActiveItem={repeatableGroupActiveItem}
                  onToggleExpanded={toggleExpanded}
                  onExpand={expandNode}
                  onSetRepeatableGroupActiveItem={(pathId, index) =>
                    setRepeatableGroupActiveItem((current) => ({
                      ...current,
                      [pathId]: index,
                    }))
                  }
                  onPreviewContentChange={onPreviewContentChange}
                  onUpdateNode={(nodePath, updater) =>
                    updateNodes((nodes) => updateNodeAtPath(nodes, nodePath, updater))
                  }
                  onRemoveNode={(nodePath) =>
                    updateNodes((nodes) => removeNodeAtPath(nodes, nodePath))
                  }
                  onMoveNode={(nodePath, direction) =>
                    updateNodes((nodes) => moveNodeAtPath(nodes, nodePath, direction))
                  }
                  onAddChild={(nodePath, type) =>
                    updateNodes((nodes) =>
                      appendChildAtPath(nodes, nodePath, createNode(type))
                    )
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

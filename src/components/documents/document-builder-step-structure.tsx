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
  getDocumentCategoryOptions,
  normalizeDocumentCategory,
} from "@/lib/documents/categories"
import {
  DOCUMENT_CONTEXT_SOURCES,
  type DocumentBuilderDraft,
  type DocumentSchemaNode,
  type DocumentSchemaNodeType,
} from "@/types/document"

type PathSegment = string | number
type MutableCursor = Record<string, unknown> | unknown[]
const DOCUMENT_CATEGORY_OPTIONS = getDocumentCategoryOptions()

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
  onClick: (e: React.MouseEvent) => void
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
    <div className="flex flex-col gap-1 w-full overflow-hidden">
      <div className="flex flex-col gap-5">
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


function getActiveNodeByPath(nodes: DocumentSchemaNode[], pathId: string | null): { node: DocumentSchemaNode, path: number[] } | null {
  if (!pathId) return null;
  const path = pathId.split('.').map(Number);
  let currentNodes = nodes;
  let targetNode: DocumentSchemaNode | null = null;
  for (let i = 0; i < path.length; i++) {
    const idx = path[i];
    if (!currentNodes[idx]) return null;
    targetNode = currentNodes[idx];
    if (i < path.length - 1 && 'children' in targetNode) {
      if (!Array.isArray(targetNode.children)) return null;
      currentNodes = targetNode.children;
    } else if (i < path.length - 1) {
      return null;
    }
  }
  if (!targetNode) return null;
  return { node: targetNode, path };
}

function CanvasBlockEditor({
  node,
  path,
  depth,
  siblingCount,
  activeNodePathId,
  onSetActiveNode,
  onUpdateNode,
  onRemoveNode,
  onMoveNode,
  onAddChild,
}: {
  node: DocumentSchemaNode
  path: number[]
  depth: number
  siblingCount: number
  activeNodePathId: string | null
  onSetActiveNode: (pathId: string) => void
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
  const isActive = activeNodePathId === pathId
  const isGroup = node.type === "group" || node.type === "repeatableGroup"
  const nodeTitle = node.label || humanizeKey(node.key) || "Unlabeled Field"

  return (
    <div
      className={cn(
        "group/block relative rounded-xl border transition-all duration-200 ease-out",
        isActive
          ? "border-primary/50 bg-primary/5 ring-4 ring-primary/10 shadow-sm z-10"
          : "border-border/60 bg-card hover:border-border/80 hover:bg-muted/10 shadow-sm"
      )}
      onClick={(e) => {
        e.stopPropagation()
        onSetActiveNode(pathId)
      }}
    >
      <div className={cn(
        "absolute -right-3 -top-3 z-20 flex shrink-0 items-center gap-1 rounded-full border border-border/80 bg-background p-1 shadow-md transition-all duration-200",
        isActive ? "opacity-100 scale-100" : "opacity-0 scale-95 group-hover/block:opacity-100 group-hover/block:scale-100"
      )}>
        <CompactActionButton
          label={t("schemaNode.actions.moveUp")}
          disabled={path[path.length - 1] === 0}
          onClick={(e) => { e.stopPropagation(); onMoveNode(path, "up") }}
        >
          <IconArrowUp className="size-3.5" />
        </CompactActionButton>
        <CompactActionButton
          label={t("schemaNode.actions.moveDown")}
          disabled={path[path.length - 1] >= siblingCount - 1}
          onClick={(e) => { e.stopPropagation(); onMoveNode(path, "down") }}
        >
          <IconArrowDown className="size-3.5" />
        </CompactActionButton>
        <CompactActionButton
          label={t("schemaNode.actions.delete")}
          destructive
          onClick={(e) => { e.stopPropagation(); onRemoveNode(path) }}
        >
          <IconTrash className="size-3.5" />
        </CompactActionButton>
      </div>

      <div className="p-4 sm:p-5">
        {isGroup ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="flex flex-wrap items-center gap-2 text-base font-semibold text-foreground">
                {nodeTitle}
                {node.type === "repeatableGroup" && (
                  <span className="rounded-md bg-muted border border-border/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("schemaNode.types.repeatableGroup")}</span>
                )}
                {node.required && <span className="text-destructive font-bold">*</span>}
              </label>
              {node.helpText && <p className="text-sm text-muted-foreground leading-relaxed">{node.helpText}</p>}
            </div>

            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 min-h-24">
              {node.children.length === 0 ? (
                <div className="py-2 text-center text-sm text-muted-foreground/70">
                  {t("schemaNode.noChildren")}
                </div>
              ) : (
                <div className="space-y-3">
                  {node.children.map((child, index) => (
                    <CanvasBlockEditor
                      key={`${pathId}-${child.key}-${index}`}
                      node={child}
                      path={[...path, index]}
                      depth={depth + 1}
                      siblingCount={node.children.length}
                      activeNodePathId={activeNodePathId}
                      onSetActiveNode={onSetActiveNode}
                      onUpdateNode={onUpdateNode}
                      onRemoveNode={onRemoveNode}
                      onMoveNode={onMoveNode}
                      onAddChild={onAddChild}
                    />
                  ))}
                </div>
              )}
              <div className="mt-4 flex flex-wrap justify-center gap-2 opacity-0 group-hover/block:opacity-100 transition-opacity focus-within:opacity-100" onClick={(e) => e.stopPropagation()}>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 rounded-full border-dashed bg-background shadow-xs text-muted-foreground hover:text-foreground hover:border-solid hover:bg-muted/50"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddChild(path, "shortText")
                    onSetActiveNode(toNodePathId([...path, node.children.length]))
                  }}
                >
                  <IconPlus className="size-3.5" />
                  {t("schemaEditor.addField")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 rounded-full border-dashed bg-background shadow-xs text-muted-foreground hover:text-foreground hover:border-solid hover:bg-muted/50"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddChild(path, "group")
                    onSetActiveNode(toNodePathId([...path, node.children.length]))
                  }}
                >
                  <IconPlus className="size-3.5" />
                  {t("schemaEditor.addGroup")}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="pointer-events-none space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              {nodeTitle}
              {node.required && <span className="text-destructive font-bold">*</span>}
              <span className="rounded-md bg-muted/80 border border-border/50 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {node.type === "shortText" ? t("schemaNode.types.shortText") : node.type === "longText" ? t("schemaNode.types.longText") : t("schemaNode.types.stringList")}
              </span>
            </label>
            {node.helpText && <p className="text-xs text-muted-foreground">{node.helpText}</p>}
            {node.type === "shortText" ? (
              <Input readOnly placeholder={node.placeholder ? node.placeholder : "..."} className="h-10 bg-background/60 shadow-none border-border/60 transition-colors" tabIndex={-1} />
            ) : node.type === "longText" ? (
              <Textarea readOnly placeholder={node.placeholder ? node.placeholder : "..."} className="min-h-[100px] resize-none bg-background/60 shadow-none border-border/60 transition-colors" tabIndex={-1} />
            ) : (
              <Textarea readOnly placeholder={node.placeholder ? node.placeholder : "Item 1\nItem 2..."} className="min-h-[100px] resize-none bg-background/60 shadow-none border-border/60 transition-colors" tabIndex={-1} />
            )}
          </div>
        )}
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
  const [activeNodePathId, setActiveNodePathId] = useState<string | null>(null)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [advancedPanelOpen, setAdvancedPanelOpen] = useState(false)

  const activeNodeData = getActiveNodeByPath(draft.schema.nodes, activeNodePathId)

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



  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth sm:px-6 sm:py-6" onClick={() => setActiveNodePathId(null)}>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6" onClick={(e) => e.stopPropagation()}>
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

              <div className="flex flex-col gap-5">
                <div className="space-y-2">
                  <Label>{t("templateSettings.categoryLabel")}</Label>
                  <Select
                    value={normalizeDocumentCategory(draft.category)}
                    onValueChange={(value) =>
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        category: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(option.labelKey as never)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

          <section className="mt-4 border-t border-border/40 pt-8 pb-12">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold">{t("schemaEditor.title")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("schemaEditor.canvasDescription")}
              </p>
            </div>

            <div className="mt-8 rounded-3xl border border-border/40 bg-muted/10 p-4 sm:p-6 shadow-sm">
              {draft.schema.nodes.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-border/60 bg-card px-4 py-20 text-center transition-colors hover:border-primary/30">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-muted shadow-sm">
                    <IconPlus className="size-6 text-foreground/70" />
                  </div>
                  <h3 className="text-base font-semibold">{t("schemaEditor.empty")}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">Click below to add fields and start building your document template graphically.</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 h-10 px-5 rounded-full shadow-sm"
                      onClick={() => {
                        updateNodes((nodes) => [...nodes, createNode("shortText")])
                        setActiveNodePathId(toNodePathId([draft.schema.nodes.length]))
                      }}
                    >
                      <IconPlus className="size-4" />
                      {t("schemaEditor.addField")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 h-10 px-5 rounded-full shadow-sm"
                      onClick={() => {
                        updateNodes((nodes) => [...nodes, createNode("group")])
                        setActiveNodePathId(toNodePathId([draft.schema.nodes.length]))
                      }}
                    >
                      <IconPlus className="size-4" />
                      {t("schemaEditor.addGroup")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 relative">
                  <div className="absolute -left-3 -right-3 -top-3 -bottom-3 border border-border/0 rounded-[28px] pointer-events-none"></div>
                  {draft.schema.nodes.map((node, index) => (
                    <CanvasBlockEditor
                      key={`${node.key}-${index}`}
                      node={node}
                      path={[index]}
                      depth={0}
                      siblingCount={draft.schema.nodes.length}
                      activeNodePathId={activeNodePathId}
                      onSetActiveNode={setActiveNodePathId}
                      onUpdateNode={(nodePath, updater) =>
                        updateNodes((nodes) => updateNodeAtPath(nodes, nodePath, updater))
                      }
                      onRemoveNode={(nodePath) => {
                        updateNodes((nodes) => removeNodeAtPath(nodes, nodePath))
                        if (activeNodePathId && activeNodePathId.startsWith(toNodePathId(nodePath))) {
                          setActiveNodePathId(null)
                        }
                      }}
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

                  <div className="mt-6 pt-4 flex justify-center gap-3 relative z-10">
                    <Button
                      type="button"
                      variant="secondary"
                      className="gap-2 rounded-full h-10 px-5 bg-background shadow-sm border border-border/50 hover:border-border/80"
                      onClick={() => {
                        updateNodes((nodes) => [...nodes, createNode("shortText")])
                        setActiveNodePathId(toNodePathId([draft.schema.nodes.length]))
                      }}
                    >
                      <IconPlus className="size-4" />
                      {t("schemaEditor.addField")}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="gap-2 rounded-full h-10 px-5 bg-background shadow-sm border border-border/50 hover:border-border/80"
                      onClick={() => {
                        updateNodes((nodes) => [...nodes, createNode("group")])
                        setActiveNodePathId(toNodePathId([draft.schema.nodes.length]))
                      }}
                    >
                      <IconPlus className="size-4" />
                      {t("schemaEditor.addGroup")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Sidebar Inspector */}
      <div className="w-[340px] shrink-0 overflow-y-auto border-l border-border bg-card shadow-[-8px_0_24px_-12px_rgba(0,0,0,0.05)] z-20 xl:w-[400px]">
        <div className="sticky top-0 z-10 flex min-h-[60px] items-center border-b border-border/60 bg-card/95 px-5 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">{"Field Properties"}</h3>
        </div>
        <div className="p-5">
          {activeNodeData ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 ease-out">
              <NodeDetailsPanel
                node={activeNodeData.node}
                path={activeNodeData.path}
                onUpdate={(nodePath, updater) => {
                  updateNodes((nodes) => updateNodeAtPath(nodes, nodePath, updater))
                }}
              />
            </div>
          ) : (
            <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-center text-muted-foreground animate-in fade-in duration-500">
              <div className="rounded-full bg-muted/60 p-4 ring-1 ring-border/50 shadow-inner">
                <IconSparkles className="size-6 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/80">{"Select a field"}</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">Click on any block in the canvas to edit its properties here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

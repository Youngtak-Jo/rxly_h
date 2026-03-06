"use client"

import {
  useState,
  type Dispatch,
  type MouseEvent,
  type ReactNode,
  type SetStateAction,
} from "react"
import {
  IconArrowDown,
  IconArrowUp,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type {
  DocumentBuilderDraft,
  DocumentSchemaNode,
  DocumentSchemaNodeType,
} from "@/types/document"

function humanizeKey(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
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
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
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
        "size-7 rounded-md text-muted-foreground hover:text-foreground",
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
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label className="text-xs">{t("schemaNode.typeLabel")}</Label>
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
            <SelectItem value="shortText">
              {t("schemaNode.types.shortText")}
            </SelectItem>
            <SelectItem value="longText">
              {t("schemaNode.types.longText")}
            </SelectItem>
            <SelectItem value="stringList">
              {t("schemaNode.types.stringList")}
            </SelectItem>
            <SelectItem value="group">{t("schemaNode.types.group")}</SelectItem>
            <SelectItem value="repeatableGroup">
              {t("schemaNode.types.repeatableGroup")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">{t("schemaNode.keyLabel")}</Label>
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
        <Label className="text-xs">{t("schemaNode.fieldLabel")}</Label>
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
        <Label className="text-xs">{t("schemaNode.placeholderLabel")}</Label>
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
        <Label className="text-xs">{t("schemaNode.helpTextLabel")}</Label>
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
    </div>
  )
}

function getActiveNodeByPath(
  nodes: DocumentSchemaNode[],
  pathId: string | null
): { node: DocumentSchemaNode; path: number[] } | null {
  if (!pathId) return null

  const path = pathId.split(".").map(Number)
  let currentNodes = nodes
  let targetNode: DocumentSchemaNode | null = null

  for (let index = 0; index < path.length; index += 1) {
    const nodeIndex = path[index]
    if (!currentNodes[nodeIndex]) return null

    targetNode = currentNodes[nodeIndex]
    if (index < path.length - 1 && "children" in targetNode) {
      if (!Array.isArray(targetNode.children)) return null
      currentNodes = targetNode.children
    } else if (index < path.length - 1) {
      return null
    }
  }

  if (!targetNode) return null
  return { node: targetNode, path }
}

function CanvasBlockEditor({
  node,
  path,
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
  const nodeTitle =
    node.label || humanizeKey(node.key) || t("schemaEditor.nodeUntitled")

  return (
    <div
      className={cn(
        "group/block relative rounded-lg border bg-background transition-colors",
        isActive
          ? "border-primary/40 ring-1 ring-primary/20"
          : "border-border/60 hover:border-border"
      )}
      onClick={(event) => {
        event.stopPropagation()
        onSetActiveNode(pathId)
      }}
    >
      <div
        className={cn(
          "absolute -right-2 -top-2 z-20 flex items-center gap-0.5 rounded-md border border-border/80 bg-background px-0.5 py-0.5 shadow-sm transition-opacity",
          isActive
            ? "opacity-100"
            : "opacity-0 group-hover/block:opacity-100 group-focus-within/block:opacity-100"
        )}
      >
        <CompactActionButton
          label={t("schemaNode.actions.moveUp")}
          disabled={path[path.length - 1] === 0}
          onClick={(event) => {
            event.stopPropagation()
            onMoveNode(path, "up")
          }}
        >
          <IconArrowUp className="size-3" />
        </CompactActionButton>
        <CompactActionButton
          label={t("schemaNode.actions.moveDown")}
          disabled={path[path.length - 1] >= siblingCount - 1}
          onClick={(event) => {
            event.stopPropagation()
            onMoveNode(path, "down")
          }}
        >
          <IconArrowDown className="size-3" />
        </CompactActionButton>
        <CompactActionButton
          label={t("schemaNode.actions.delete")}
          destructive
          onClick={(event) => {
            event.stopPropagation()
            onRemoveNode(path)
          }}
        >
          <IconTrash className="size-3" />
        </CompactActionButton>
      </div>

      <div className="space-y-3 p-3.5 sm:p-4">
        {isGroup ? (
          <>
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                <span>{nodeTitle}</span>
                {node.type === "repeatableGroup" ? (
                  <span className="rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {t("schemaNode.types.repeatableGroup")}
                  </span>
                ) : null}
                {node.required ? (
                  <span className="font-bold text-destructive">*</span>
                ) : null}
              </div>
              {node.helpText ? (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {node.helpText}
                </p>
              ) : null}
            </div>

            <div className="space-y-2.5 rounded-md border border-dashed border-border/50 bg-muted/10 p-3">
              {node.children.length === 0 ? (
                <div className="py-3 text-center text-xs text-muted-foreground">
                  {t("schemaNode.noChildren")}
                </div>
              ) : (
                node.children.map((child, index) => (
                  <CanvasBlockEditor
                    key={`${pathId}-${child.key}-${index}`}
                    node={child}
                    path={[...path, index]}
                    siblingCount={node.children.length}
                    activeNodePathId={activeNodePathId}
                    onSetActiveNode={onSetActiveNode}
                    onUpdateNode={onUpdateNode}
                    onRemoveNode={onRemoveNode}
                    onMoveNode={onMoveNode}
                    onAddChild={onAddChild}
                  />
                ))
              )}

              <div
                className="flex flex-wrap justify-center gap-1.5"
                onClick={(event) => event.stopPropagation()}
              >
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-xs"
                  onClick={(event) => {
                    event.stopPropagation()
                    onAddChild(path, "shortText")
                    onSetActiveNode(toNodePathId([...path, node.children.length]))
                  }}
                >
                  <IconPlus className="size-3" />
                  {t("schemaEditor.addField")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-xs"
                  onClick={(event) => {
                    event.stopPropagation()
                    onAddChild(path, "group")
                    onSetActiveNode(toNodePathId([...path, node.children.length]))
                  }}
                >
                  <IconPlus className="size-3" />
                  {t("schemaEditor.addGroup")}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="pointer-events-none space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
              <span>{nodeTitle}</span>
              {node.required ? (
                <span className="font-bold text-destructive">*</span>
              ) : null}
              <span className="rounded border border-border/50 bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {node.type === "shortText"
                  ? t("schemaNode.types.shortText")
                  : node.type === "longText"
                    ? t("schemaNode.types.longText")
                    : t("schemaNode.types.stringList")}
              </span>
            </div>
            {node.helpText ? (
              <p className="text-xs text-muted-foreground">{node.helpText}</p>
            ) : null}
            {node.type === "shortText" ? (
              <Input
                readOnly
                tabIndex={-1}
                placeholder={node.placeholder || "..."}
                className="h-9 border-border/50 bg-muted/20 shadow-none"
              />
            ) : (
              <Textarea
                readOnly
                tabIndex={-1}
                placeholder={
                  node.placeholder ||
                  (node.type === "stringList" ? "Item 1\nItem 2..." : "...")
                }
                className="min-h-[80px] resize-none border-border/50 bg-muted/20 shadow-none"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function DocumentBuilderStepSchema({
  draft,
  setDraft,
  aiLoading,
  aiPrompt,
  showAiRevisePanel,
  documentModelLabel,
  onAiPromptChange,
  onAiRevise,
  onOpenModelSettings,
  validationError,
}: {
  draft: DocumentBuilderDraft
  setDraft: Dispatch<SetStateAction<DocumentBuilderDraft>>
  aiLoading: boolean
  aiPrompt: string
  showAiRevisePanel: boolean
  documentModelLabel: string
  onAiPromptChange: (value: string) => void
  onAiRevise: () => Promise<void>
  onOpenModelSettings: () => void
  validationError: string | null
}) {
  const t = useTranslations("DocumentBuilder")
  const [activeNodePathId, setActiveNodePathId] = useState<string | null>(null)
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
      <div
        className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6"
        onClick={() => setActiveNodePathId(null)}
      >
        <div
          className="mx-auto flex w-full max-w-3xl flex-col gap-6"
          onClick={(event) => event.stopPropagation()}
        >
          {validationError ? (
            <p className="text-sm text-destructive">{validationError}</p>
          ) : null}

          {showAiRevisePanel ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t("aiDraft.revisePanelTitle")}
                </CardTitle>
                <CardDescription>
                  {t("aiDraft.revisePanelDescription")}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <Textarea
                  value={aiPrompt}
                  onChange={(event) => onAiPromptChange(event.target.value)}
                  className="min-h-[120px] resize-y"
                  placeholder={t("aiDraft.revisePlaceholder")}
                />

                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3.5 py-2.5">
                  <p className="text-xs text-muted-foreground">
                    {t("model.currentLabel", { model: documentModelLabel })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={onOpenModelSettings}
                    >
                      {t("model.changeInSettings")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="gap-1.5"
                      disabled={aiLoading}
                      onClick={() => void onAiRevise()}
                    >
                      {aiLoading ? (
                        <IconLoader2 className="size-3.5 animate-spin" />
                      ) : (
                        <IconSparkles className="size-3.5" />
                      )}
                      {t("aiDraft.revise")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="space-y-3">
            <div className="space-y-0.5">
              <h2 className="text-sm font-semibold">{t("schemaEditor.title")}</h2>
              <p className="text-xs text-muted-foreground">
                {t("schemaEditor.canvasDescription")}
              </p>
            </div>

            <div className="space-y-3 rounded-lg border border-border/50 bg-muted/5 p-4">
              {draft.schema.nodes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/50 bg-background px-4 py-12 text-center">
                  <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
                    <IconPlus className="size-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold">
                    {t("schemaEditor.empty")}
                  </h3>
                  <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                    {t("schemaEditor.emptyDescription")}
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        updateNodes((nodes) => [...nodes, createNode("shortText")])
                        setActiveNodePathId(
                          toNodePathId([draft.schema.nodes.length])
                        )
                      }}
                    >
                      <IconPlus className="size-3.5" />
                      {t("schemaEditor.addField")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        updateNodes((nodes) => [...nodes, createNode("group")])
                        setActiveNodePathId(
                          toNodePathId([draft.schema.nodes.length])
                        )
                      }}
                    >
                      <IconPlus className="size-3.5" />
                      {t("schemaEditor.addGroup")}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {draft.schema.nodes.map((node, index) => (
                      <CanvasBlockEditor
                        key={`${node.key}-${index}`}
                        node={node}
                        path={[index]}
                        siblingCount={draft.schema.nodes.length}
                        activeNodePathId={activeNodePathId}
                        onSetActiveNode={setActiveNodePathId}
                        onUpdateNode={(nodePath, updater) =>
                          updateNodes((nodes) =>
                            updateNodeAtPath(nodes, nodePath, updater)
                          )
                        }
                        onRemoveNode={(nodePath) => {
                          updateNodes((nodes) => removeNodeAtPath(nodes, nodePath))
                          const removedPathId = toNodePathId(nodePath)
                          if (
                            activeNodePathId === removedPathId ||
                            activeNodePathId?.startsWith(`${removedPathId}.`)
                          ) {
                            setActiveNodePathId(null)
                          }
                        }}
                        onMoveNode={(nodePath, direction) =>
                          updateNodes((nodes) =>
                            moveNodeAtPath(nodes, nodePath, direction)
                          )
                        }
                        onAddChild={(nodePath, type) =>
                          updateNodes((nodes) =>
                            appendChildAtPath(nodes, nodePath, createNode(type))
                          )
                        }
                      />
                    ))}
                  </div>

                  <div className="flex justify-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        updateNodes((nodes) => [...nodes, createNode("shortText")])
                        setActiveNodePathId(
                          toNodePathId([draft.schema.nodes.length])
                        )
                      }}
                    >
                      <IconPlus className="size-3.5" />
                      {t("schemaEditor.addField")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        updateNodes((nodes) => [...nodes, createNode("group")])
                        setActiveNodePathId(
                          toNodePathId([draft.schema.nodes.length])
                        )
                      }}
                    >
                      <IconPlus className="size-3.5" />
                      {t("schemaEditor.addGroup")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <aside className="hidden w-[320px] shrink-0 border-l bg-card md:block xl:w-[360px]">
        <div className="border-b px-4 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("schemaEditor.inspectorTitle")}
          </h3>
        </div>

        <div className="min-h-0 overflow-y-auto p-4">
          {activeNodeData ? (
            <NodeDetailsPanel
              node={activeNodeData.node}
              path={activeNodeData.path}
              onUpdate={(nodePath, updater) => {
                updateNodes((nodes) => updateNodeAtPath(nodes, nodePath, updater))
              }}
            />
          ) : (
            <div className="flex h-[260px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <div className="rounded-full bg-muted/50 p-3">
                <IconSparkles className="size-5 text-muted-foreground/40" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-foreground/70">
                  {t("schemaEditor.inspectorEmptyTitle")}
                </p>
                <p className="mx-auto max-w-[200px] text-[11px] text-muted-foreground">
                  {t("schemaEditor.inspectorEmptyDescription")}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

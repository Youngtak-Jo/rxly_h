"use client"

import {
  useState,
  type Dispatch,
  type MouseEvent,
  type ReactNode,
  type SetStateAction,
} from "react"
import {
  MouseSensor,
  TouchSensor,
  DndContext,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import type { LucideIcon } from "lucide-react"
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  FolderClosed,
  GripVertical,
  List,
  Loader2,
  Plus,
  Repeat2,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react"
import { useTranslations } from "next-intl"
import {
  createNode,
  getNodeAtPath,
  insertNodeAtPath,
  moveNodeAtPath,
  moveNodeToTarget,
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useMobileViewport } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import type {
  DocumentBuilderDraft,
  DocumentSchemaNode,
  DocumentSchemaNodeType,
} from "@/types/document"

const BLOCK_TYPE_ORDER: DocumentSchemaNodeType[] = [
  "shortText",
  "longText",
  "stringList",
  "group",
  "repeatableGroup",
]

const BLOCK_TYPE_META: Record<
  DocumentSchemaNodeType,
  {
    icon: LucideIcon
    iconClassName: string
    surfaceClassName: string
  }
> = {
  shortText: {
    icon: Type,
    iconClassName: "text-sky-700",
    surfaceClassName: "bg-sky-100",
  },
  longText: {
    icon: AlignLeft,
    iconClassName: "text-cyan-700",
    surfaceClassName: "bg-cyan-100",
  },
  stringList: {
    icon: List,
    iconClassName: "text-amber-700",
    surfaceClassName: "bg-amber-100",
  },
  group: {
    icon: FolderClosed,
    iconClassName: "text-emerald-700",
    surfaceClassName: "bg-emerald-100",
  },
  repeatableGroup: {
    icon: Repeat2,
    iconClassName: "text-violet-700",
    surfaceClassName: "bg-violet-100",
  },
}

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

function buildNodeDragId(path: number[]) {
  return `node:${toNodePathId(path)}`
}

function parseNodeDragId(value: string) {
  if (!value.startsWith("node:")) return null

  const rawPath = value.slice("node:".length)
  if (!rawPath) return null
  return rawPath.split(".").map(Number)
}

function buildSlotDropId(parentPath: number[], index: number) {
  const parentPathId = parentPath.length > 0 ? parentPath.join(".") : "root"
  return `slot:${parentPathId}:${index}`
}

function parseSlotDropId(value: string): { parentPath: number[]; index: number } | null {
  if (!value.startsWith("slot:")) return null

  const [, parentPathId, rawIndex] = value.split(":")
  const index = Number(rawIndex)
  if (Number.isNaN(index)) return null

  return {
    parentPath:
      parentPathId === "root" || !parentPathId
        ? []
        : parentPathId.split(".").map(Number),
    index,
  }
}

function isPathWithinPath(path: number[], ancestorPath: number[]) {
  if (ancestorPath.length > path.length) return false
  return ancestorPath.every((segment, index) => path[index] === segment)
}

function isGroupNode(
  node: DocumentSchemaNode
): node is Extract<DocumentSchemaNode, { children: DocumentSchemaNode[] }> {
  return node.type === "group" || node.type === "repeatableGroup"
}

function getActiveNodeByPath(
  nodes: DocumentSchemaNode[],
  pathId: string | null
): { node: DocumentSchemaNode; path: number[] } | null {
  if (!pathId) return null
  const path = pathId.split(".").map(Number)
  const node = getNodeAtPath(nodes, path)
  return node ? { node, path } : null
}

function findNodePathByReference(
  nodes: DocumentSchemaNode[],
  targetNode: DocumentSchemaNode
): number[] | null {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]
    if (node === targetNode) {
      return [index]
    }

    if (!isGroupNode(node)) continue
    const childPath = findNodePathByReference(node.children, targetNode)
    if (childPath) {
      return [index, ...childPath]
    }
  }

  return null
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
        "size-5 rounded text-muted-foreground hover:text-foreground",
        destructive && "text-destructive hover:bg-destructive/10 hover:text-destructive"
      )}
    >
      {children}
    </Button>
  )
}

function BlockTypeMenu({
  onSelect,
  compact = false,
}: {
  onSelect: (type: DocumentSchemaNodeType) => void
  compact?: boolean
}) {
  const t = useTranslations("DocumentBuilder")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={compact ? "outline" : "secondary"}
          size={compact ? "icon" : "sm"}
          className={cn(
            compact
              ? "size-6 rounded-full border border-dashed bg-background shadow-none"
              : "gap-2 rounded-full border border-border/60 bg-background shadow-none"
          )}
          aria-label={t("schemaNode.actions.insert")}
          onClick={(event) => event.stopPropagation()}
        >
          <Plus className={compact ? "size-3" : "size-4"} />
          {!compact ? <span>{t("schemaEditor.insertHere")}</span> : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-64">
        {BLOCK_TYPE_ORDER.map((type) => {
          const meta = BLOCK_TYPE_META[type]
          const Icon = meta.icon

          return (
            <DropdownMenuItem
              key={type}
              className="items-start gap-3 py-2"
              onSelect={() => onSelect(type)}
            >
              <div
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl",
                  meta.surfaceClassName
                )}
              >
                <Icon className={cn("size-4", meta.iconClassName)} />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium">
                  {t(`schemaNode.types.${type}`)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(`schemaEditor.typeDescriptions.${type}`)}
                </p>
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function InsertionSlot({
  parentPath,
  index,
  onInsertNode,
  emptyState = false,
}: {
  parentPath: number[]
  index: number
  onInsertNode: (parentPath: number[], index: number, type: DocumentSchemaNodeType) => void
  emptyState?: false | "root" | "group"
}) {
  const t = useTranslations("DocumentBuilder")
  const { setNodeRef, isOver } = useDroppable({
    id: buildSlotDropId(parentPath, index),
  })

  return (
    <div
      ref={setNodeRef}
      className="relative"
      onClick={(event) => event.stopPropagation()}
    >
      {emptyState ? (
        <div
          className={cn(
            "rounded-xl border border-dashed px-3 py-3 text-center transition-colors",
            isOver
              ? "border-primary bg-primary/5"
              : "border-border/60 bg-background/70"
          )}
        >
          <div className="mx-auto flex flex-col items-center gap-2">
            <BlockTypeMenu
              onSelect={(type) => onInsertNode(parentPath, index, type)}
              compact={false}
            />
            <p className="text-xs text-muted-foreground">
              {isOver
                ? t("schemaEditor.dropHere")
                : emptyState === "root"
                  ? t("schemaEditor.emptyDescription")
                  : t("schemaEditor.emptyGroupDescription")}
            </p>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "flex transition-all",
            isOver ? "bg-primary/5 h-5 items-center" : "h-0.5"
          )}
        >
          <div
            className={cn(
              "h-px flex-1 transition-colors",
              isOver ? "bg-primary/50" : "bg-transparent"
            )}
          />
        </div>
      )}
    </div>
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
          <SelectTrigger className="h-10">
            <SelectValue placeholder={t("schemaNode.selectType")}>
              {node.type && (
                <div className="flex items-center gap-2">
                  <div className={cn("flex size-5 shrink-0 items-center justify-center rounded", BLOCK_TYPE_META[node.type].surfaceClassName)}>
                    {(() => {
                      const Icon = BLOCK_TYPE_META[node.type].icon;
                      return <Icon className={cn("size-3", BLOCK_TYPE_META[node.type].iconClassName)} />;
                    })()}
                  </div>
                  <span>{t(`schemaNode.types.${node.type}`)}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {BLOCK_TYPE_ORDER.map((type) => {
              const meta = BLOCK_TYPE_META[type]
              const Icon = meta.icon
              return (
                <SelectItem key={type} value={type} className="py-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-lg",
                        meta.surfaceClassName
                      )}
                    >
                      <Icon className={cn("size-3.5", meta.iconClassName)} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-medium">{t(`schemaNode.types.${type}`)}</span>
                      <span className="text-[11px] text-muted-foreground">{t(`schemaEditor.typeDescriptions.${type}`)}</span>
                    </div>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">{t("schemaNode.fieldLabel")}</Label>
        <Input
          value={node.label}
          onChange={(event) => {
            const nextLabel = event.target.value
            let derivedKey = nextLabel
              .toLowerCase()
              .replace(/[^a-z0-9_ ]/g, "")
              .replace(/\s+/g, "_")
            if (derivedKey.length > 0 && /^[^a-z]/.test(derivedKey)) {
              derivedKey = derivedKey.replace(/^[^a-z]+/, "")
            }
            if (!derivedKey) {
              const suffix = Math.random().toString(36).slice(2, 8)
              derivedKey = `${node.type.toLowerCase()}_${suffix}`
            }

            onUpdate(path, (currentNode) => ({
              ...currentNode,
              label: nextLabel,
              key: derivedKey.slice(0, 50),
            }))
          }}
          placeholder={t("schemaNode.labelPlaceholder")}
        />
      </div>

      {node.type !== "group" && node.type !== "repeatableGroup" ? (
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
      ) : null}

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
          className="min-h-24 resize-y"
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

function SchemaCanvasLevel({
  nodes,
  parentPath,
  activeNodePathId,
  draggingNodePathId,
  onSetActiveNode,
  onMoveNode,
  onRemoveNode,
  onInsertNode,
}: {
  nodes: DocumentSchemaNode[]
  parentPath: number[]
  activeNodePathId: string | null
  draggingNodePathId: string | null
  onSetActiveNode: (pathId: string) => void
  onMoveNode: (path: number[], direction: "up" | "down") => void
  onRemoveNode: (path: number[]) => void
  onInsertNode: (parentPath: number[], index: number, type: DocumentSchemaNodeType) => void
}) {
  if (nodes.length === 0) {
    return (
      <InsertionSlot
        parentPath={parentPath}
        index={0}
        onInsertNode={onInsertNode}
        emptyState={parentPath.length === 0 ? "root" : "group"}
      />
    )
  }

  return (
    <div className="flex flex-col">
      {nodes.map((node, index) => (
        <div key={`${parentPath.join(".")}-${node.key}-${index}`} className="flex flex-col">
          <InsertionSlot
            parentPath={parentPath}
            index={index}
            onInsertNode={onInsertNode}
          />
          <SchemaBlockChip
            node={node}
            path={[...parentPath, index]}
            siblingCount={nodes.length}
            activeNodePathId={activeNodePathId}
            draggingNodePathId={draggingNodePathId}
            onSetActiveNode={onSetActiveNode}
            onMoveNode={onMoveNode}
            onRemoveNode={onRemoveNode}
            onInsertNode={onInsertNode}
          />
        </div>
      ))}
      <InsertionSlot
        parentPath={parentPath}
        index={nodes.length}
        onInsertNode={onInsertNode}
      />
      <div className="mt-0.5 flex items-center justify-center">
        <BlockTypeMenu
          onSelect={(type) => onInsertNode(parentPath, nodes.length, type)}
          compact={true}
        />
      </div>
    </div>
  )
}

function SchemaBlockChip({
  node,
  path,
  siblingCount,
  activeNodePathId,
  draggingNodePathId,
  onSetActiveNode,
  onMoveNode,
  onRemoveNode,
  onInsertNode,
}: {
  node: DocumentSchemaNode
  path: number[]
  siblingCount: number
  activeNodePathId: string | null
  draggingNodePathId: string | null
  onSetActiveNode: (pathId: string) => void
  onMoveNode: (path: number[], direction: "up" | "down") => void
  onRemoveNode: (path: number[]) => void
  onInsertNode: (parentPath: number[], index: number, type: DocumentSchemaNodeType) => void
}) {
  const t = useTranslations("DocumentBuilder")
  const pathId = toNodePathId(path)
  const isActive = activeNodePathId === pathId
  const isDraggingSelf = draggingNodePathId === pathId
  const meta = BLOCK_TYPE_META[node.type]
  const Icon = meta.icon
  const title = node.label || humanizeKey(node.key) || t("schemaEditor.nodeUntitled")
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: buildNodeDragId(path),
    })

  return (
    <div className="flex flex-col">
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Translate.toString(transform),
        }}
        className={cn(
          "group/block relative flex items-center gap-1 rounded-lg border bg-card px-1 py-0.5 transition-all",
          isActive
            ? "border-primary ring-1 ring-primary"
            : "border-border/50 hover:border-border",
          (isDragging || isDraggingSelf) && "z-20 opacity-75 shadow-lg"
        )}
        onClick={(event) => {
          event.stopPropagation()
          onSetActiveNode(pathId)
        }}
      >
        <div
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
          className="flex cursor-grab items-center justify-center rounded p-0.5 text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
        >
          <GripVertical className="size-3" />
        </div>

        <div
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded",
            meta.surfaceClassName
          )}
        >
          <Icon className={cn("size-3", meta.iconClassName)} />
        </div>

        <span className="min-w-0 flex-1 truncate text-xs font-medium pl-0.5">{title}</span>

        {node.required ? (
          <span className="text-[10px] font-bold text-destructive">*</span>
        ) : null}

        <div
          className={cn(
            "flex shrink-0 items-center transition-opacity",
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
            <ArrowUp className="size-3" />
          </CompactActionButton>
          <CompactActionButton
            label={t("schemaNode.actions.moveDown")}
            disabled={path[path.length - 1] >= siblingCount - 1}
            onClick={(event) => {
              event.stopPropagation()
              onMoveNode(path, "down")
            }}
          >
            <ArrowDown className="size-3" />
          </CompactActionButton>
          <CompactActionButton
            label={t("schemaNode.actions.delete")}
            destructive
            onClick={(event) => {
              event.stopPropagation()
              onRemoveNode(path)
            }}
          >
            <Trash2 className="size-3" />
          </CompactActionButton>
        </div>
      </div>

      {isGroupNode(node) ? (
        <div
          className={cn(
            "ml-3.5 border-l-2 pl-3 pt-0.5",
            meta.iconClassName === "text-emerald-700"
              ? "border-emerald-300 dark:border-emerald-700"
              : "border-violet-300 dark:border-violet-700"
          )}
        >
          <SchemaCanvasLevel
            nodes={node.children}
            parentPath={path}
            activeNodePathId={activeNodePathId}
            draggingNodePathId={draggingNodePathId}
            onSetActiveNode={onSetActiveNode}
            onMoveNode={onMoveNode}
            onRemoveNode={onRemoveNode}
            onInsertNode={onInsertNode}
          />
        </div>
      ) : null}
    </div>
  )
}


function SchemaInspector({
  activeNodeData,
  onUpdateNode,
}: {
  activeNodeData: { node: DocumentSchemaNode; path: number[] } | null
  onUpdateNode: (
    path: number[],
    updater: (node: DocumentSchemaNode) => DocumentSchemaNode
  ) => void
}) {
  const t = useTranslations("DocumentBuilder")

  if (!activeNodeData) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
        <div className="rounded-full bg-muted/50 p-3">
          <Sparkles className="size-5 text-muted-foreground/40" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-foreground/70">
            {t("schemaEditor.inspectorEmptyTitle")}
          </p>
          <p className="mx-auto max-w-[220px] text-[11px] text-muted-foreground">
            {t("schemaEditor.inspectorEmptyDescription")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <NodeDetailsPanel
      node={activeNodeData.node}
      path={activeNodeData.path}
      onUpdate={onUpdateNode}
    />
  )
}

export function DocumentBuilderStepSchema({
  draft,
  setDraft,
  aiLoading,
  aiPrompt,
  showAiRevisePanel,
  onAiPromptChange,
  onAiRevise,
  validationError,
}: {
  draft: DocumentBuilderDraft
  setDraft: Dispatch<SetStateAction<DocumentBuilderDraft>>
  aiLoading: boolean
  aiPrompt: string
  showAiRevisePanel: boolean
  onAiPromptChange: (value: string) => void
  onAiRevise: () => Promise<void>
  validationError: string | null
}) {
  const t = useTranslations("DocumentBuilder")
  const { isMobile } = useMobileViewport()
  const [activeNodePathId, setActiveNodePathId] = useState<string | null>(null)
  const [draggingNodePathId, setDraggingNodePathId] = useState<string | null>(null)
  const activeNodeData = getActiveNodeByPath(draft.schema.nodes, activeNodePathId)
  const resolvedActiveNodePathId = activeNodeData ? activeNodePathId : null

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 6,
      },
    })
  )

  const commitNodes = (nextNodes: DocumentSchemaNode[]) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      schema: {
        nodes: nextNodes,
      },
    }))
  }

  const focusNode = (nextNodes: DocumentSchemaNode[], node: DocumentSchemaNode | null) => {
    if (!node) {
      setActiveNodePathId(null)
      return
    }

    const nextPath = findNodePathByReference(nextNodes, node)
    setActiveNodePathId(nextPath ? toNodePathId(nextPath) : null)
  }

  const handleInsertNode = (
    parentPath: number[],
    index: number,
    type: DocumentSchemaNodeType
  ) => {
    const node = createNode(type)
    const nextNodes = insertNodeAtPath(draft.schema.nodes, parentPath, index, node)
    commitNodes(nextNodes)
    focusNode(nextNodes, node)
  }

  const handleRemoveNode = (path: number[]) => {
    const selectedNode = activeNodeData?.node ?? null
    const nextNodes = removeNodeAtPath(draft.schema.nodes, path)
    commitNodes(nextNodes)
    focusNode(nextNodes, selectedNode)
  }

  const handleMoveByDirection = (path: number[], direction: "up" | "down") => {
    const selectedNode = activeNodeData?.node ?? null
    const nextNodes = moveNodeAtPath(draft.schema.nodes, path, direction)
    commitNodes(nextNodes)
    focusNode(nextNodes, selectedNode)
  }

  const handleDragStart = (event: DragStartEvent) => {
    if (typeof event.active.id !== "string") return
    const path = parseNodeDragId(event.active.id)
    setDraggingNodePathId(path ? toNodePathId(path) : null)
  }

  const resetDragState = () => {
    setDraggingNodePathId(null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    resetDragState()

    if (typeof event.active.id !== "string" || typeof event.over?.id !== "string") {
      return
    }

    const sourcePath = parseNodeDragId(event.active.id)
    const target = parseSlotDropId(event.over.id)
    if (!sourcePath || !target) return

    const movedNode = getNodeAtPath(draft.schema.nodes, sourcePath)
    if (!movedNode) return

    const selectedNode =
      activeNodeData && isPathWithinPath(activeNodeData.path, sourcePath)
        ? activeNodeData.node
        : movedNode

    const result = moveNodeToTarget(
      draft.schema.nodes,
      sourcePath,
      target.parentPath,
      target.index
    )

    if (!result) return

    commitNodes(result.nodes)
    focusNode(result.nodes, selectedNode)
  }

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden bg-background">
      <div
        className="min-h-0 flex-1 overflow-y-auto p-4"
        onClick={() => setActiveNodePathId(null)}
      >
        <div
          className="mx-auto flex w-full max-w-2xl flex-col gap-4"
          onClick={(event) => event.stopPropagation()}
        >
          {validationError ? (
            <p className="text-sm text-destructive">{validationError}</p>
          ) : null}

          {showAiRevisePanel ? (
            <Card>
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-sm">
                  {t("aiDraft.revisePanelTitle")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t("aiDraft.revisePanelDescription")}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 p-4 pt-0">
                <Textarea
                  value={aiPrompt}
                  onChange={(event) => onAiPromptChange(event.target.value)}
                  className="min-h-[120px] resize-y"
                  placeholder={t("aiDraft.revisePlaceholder")}
                />

                <div className="flex justify-end rounded-md border border-border/50 bg-muted/30 px-3 py-2">
                  <Button
                    type="button"
                    size="sm"
                    className="gap-1.5"
                    disabled={aiLoading}
                    onClick={() => void onAiRevise()}
                  >
                    {aiLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="size-3.5" />
                    )}
                    {t("aiDraft.revise")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}


          <div className="space-y-2">
            <div className="space-y-0.5">
              <h2 className="text-xs font-semibold">{t("schemaEditor.title")}</h2>
              <p className="text-[11px] text-muted-foreground">
                {t("schemaEditor.canvasDescription")}
              </p>
            </div>

            <div className="rounded-lg border border-border/50 bg-muted/5 p-2.5">
              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={resetDragState}
              >
                <SchemaCanvasLevel
                  nodes={draft.schema.nodes}
                  parentPath={[]}
                  activeNodePathId={resolvedActiveNodePathId}
                  draggingNodePathId={draggingNodePathId}
                  onSetActiveNode={setActiveNodePathId}
                  onMoveNode={handleMoveByDirection}
                  onRemoveNode={handleRemoveNode}
                  onInsertNode={handleInsertNode}
                />
              </DndContext>
            </div>
          </div>
        </div>
      </div>

      <aside className="hidden w-[260px] shrink-0 border-l bg-card md:block xl:w-[280px]">
        <div className="border-b px-4 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("schemaEditor.inspectorTitle")}
          </h3>
        </div>

        <div className="min-h-0 overflow-y-auto p-4">
          <SchemaInspector
            activeNodeData={activeNodeData}
            onUpdateNode={(nodePath, updater) => {
              commitNodes(updateNodeAtPath(draft.schema.nodes, nodePath, updater))
            }}
          />
        </div>
      </aside>

      {isMobile ? (
        <Drawer
          open={!!activeNodeData}
          onOpenChange={(open) => {
            if (!open) {
              setActiveNodePathId(null)
            }
          }}
          direction="bottom"
        >
          <DrawerContent>
            <DrawerHeader className="gap-1">
              <DrawerTitle>{t("schemaEditor.mobileInspectorTitle")}</DrawerTitle>
              <DrawerDescription>
                {activeNodeData
                  ? activeNodeData.node.label ||
                  humanizeKey(activeNodeData.node.key) ||
                  t("schemaEditor.nodeUntitled")
                  : t("schemaEditor.mobileInspectorDescription")}
              </DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto px-4 pb-6">
              <SchemaInspector
                activeNodeData={activeNodeData}
                onUpdateNode={(nodePath, updater) => {
                  commitNodes(
                    updateNodeAtPath(draft.schema.nodes, nodePath, updater)
                  )
                }}
              />
            </div>
          </DrawerContent>
        </Drawer>
      ) : null}
    </div>
  )
}

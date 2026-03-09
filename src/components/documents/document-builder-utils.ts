"use client"

import type { UiLocale } from "@/i18n/config"
import type { DocumentTemplateRegion } from "@/types/document"
import type {
  DocumentBuilderDraft,
  DocumentSchemaNode,
  DocumentSchemaNodeType,
} from "@/types/document"
import { createDocumentGenerationConfig } from "@/lib/documents/generation-config"

export function createEmptyDraft(
  locale: UiLocale,
  region: DocumentTemplateRegion
): DocumentBuilderDraft {
  return {
    title: "",
    description: "",
    category: "clinical-documentation",
    language: locale,
    region,
    schema: {
      nodes: [],
    },
    generationConfig: createDocumentGenerationConfig(),
  }
}

export function isPristineDraftForLocale(
  draft: DocumentBuilderDraft,
  locale: UiLocale,
  region: DocumentTemplateRegion
): boolean {
  return JSON.stringify(draft) === JSON.stringify(createEmptyDraft(locale, region))
}

export function createNode(type: DocumentSchemaNodeType): DocumentSchemaNode {
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

export function updateNodeAtPath(
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

export function getNodeAtPath(
  nodes: DocumentSchemaNode[],
  path: number[]
): DocumentSchemaNode | null {
  if (path.length === 0) return null

  let currentNodes = nodes
  let currentNode: DocumentSchemaNode | null = null

  for (const index of path) {
    const nextNode = currentNodes[index]
    if (!nextNode) return null
    currentNode = nextNode
    currentNodes =
      nextNode.type === "group" || nextNode.type === "repeatableGroup"
        ? nextNode.children
        : []
  }

  return currentNode
}

export function removeNodeAtPath(
  nodes: DocumentSchemaNode[],
  path: number[]
): DocumentSchemaNode[] {
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

export function insertNodeAtPath(
  nodes: DocumentSchemaNode[],
  parentPath: number[],
  index: number,
  child: DocumentSchemaNode
): DocumentSchemaNode[] {
  if (parentPath.length === 0) {
    const next = [...nodes]
    next.splice(Math.max(0, Math.min(index, next.length)), 0, child)
    return next
  }

  return updateNodeAtPath(nodes, parentPath, (node) => {
    if (node.type !== "group" && node.type !== "repeatableGroup") return node

    const nextChildren = [...node.children]
    nextChildren.splice(
      Math.max(0, Math.min(index, nextChildren.length)),
      0,
      child
    )

    return {
      ...node,
      children: nextChildren,
    }
  })
}

export function appendChildAtPath(
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

export function getNodeSubtreeDepth(node: DocumentSchemaNode): number {
  if (node.type !== "group" && node.type !== "repeatableGroup") {
    return 1
  }

  return (
    1 +
    node.children.reduce((maxDepth, child) => {
      return Math.max(maxDepth, getNodeSubtreeDepth(child))
    }, 0)
  )
}

function isPathWithinPath(path: number[], ancestorPath: number[]): boolean {
  if (ancestorPath.length > path.length) return false

  return ancestorPath.every((segment, index) => path[index] === segment)
}

function rebasePathAfterRemoval(
  path: number[],
  removedPath: number[]
): number[] | null {
  const limit = Math.min(path.length, removedPath.length)

  for (let index = 0; index < limit; index += 1) {
    if (path[index] === removedPath[index]) continue

    if (path[index] > removedPath[index]) {
      return [
        ...path.slice(0, index),
        path[index] - 1,
        ...path.slice(index + 1),
      ]
    }

    return path
  }

  if (removedPath.length <= path.length && isPathWithinPath(path, removedPath)) {
    return null
  }

  return path
}

export function moveNodeToTarget(
  nodes: DocumentSchemaNode[],
  sourcePath: number[],
  targetParentPath: number[],
  targetIndex: number
):
  | {
      nodes: DocumentSchemaNode[]
      insertedPath: number[]
    }
  | null {
  const sourceNode = getNodeAtPath(nodes, sourcePath)
  if (!sourceNode) return null

  if (isPathWithinPath(targetParentPath, sourcePath)) {
    return null
  }

  if (targetParentPath.length + getNodeSubtreeDepth(sourceNode) > 3) {
    return null
  }

  const rebasedTargetParentPath = rebasePathAfterRemoval(
    targetParentPath,
    sourcePath
  )
  if (!rebasedTargetParentPath) return null

  const sourceParentPath = sourcePath.slice(0, -1)
  const sourceIndex = sourcePath[sourcePath.length - 1]
  const sameParent =
    sourceParentPath.length === targetParentPath.length &&
    sourceParentPath.every((segment, index) => targetParentPath[index] === segment)

  const adjustedTargetIndex =
    sameParent && targetIndex > sourceIndex ? targetIndex - 1 : targetIndex

  const nextNodes = insertNodeAtPath(
    removeNodeAtPath(nodes, sourcePath),
    rebasedTargetParentPath,
    adjustedTargetIndex,
    sourceNode
  )

  return {
    nodes: nextNodes,
    insertedPath: [...rebasedTargetParentPath, adjustedTargetIndex],
  }
}

export function moveNodeAtPath(
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

export function countSchemaLeafNodes(nodes: DocumentSchemaNode[]): number {
  return nodes.reduce((count, node) => {
    if (node.type === "group" || node.type === "repeatableGroup") {
      return count + countSchemaLeafNodes(node.children)
    }

    return count + 1
  }, 0)
}

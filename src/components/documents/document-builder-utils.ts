"use client"

import type { UiLocale } from "@/i18n/config"
import type { DocumentTemplateRegion } from "@/types/document"
import type {
  DocumentBuilderDraft,
  DocumentSchemaNode,
  DocumentSchemaNodeType,
} from "@/types/document"

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
    generationConfig: {
      contextSources: ["insights", "doctorNotes"],
      systemInstructions: "",
      emptyValuePolicy: "BLANK",
    },
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

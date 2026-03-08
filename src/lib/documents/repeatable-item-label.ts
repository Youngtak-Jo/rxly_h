import type {
  DocumentSchemaNode,
  DocumentTemplateSchema,
} from "@/types/document"

function humanizeDocumentKey(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function singularizeEnglishLabel(label: string) {
  const normalized = label.trim()
  if (!normalized) return "Item"

  const applyReplacementCase = (source: string, replacement: string) =>
    /^[A-Z]/.test(source)
      ? `${replacement.charAt(0).toUpperCase()}${replacement.slice(1)}`
      : replacement

  const exactRules: Array<[RegExp, string]> = [
    [/\bservice lines$/i, "service line"],
    [/\bclaim items$/i, "claim item"],
    [/\bline items$/i, "line item"],
  ]

  for (const [pattern, replacement] of exactRules) {
    if (pattern.test(normalized)) {
      return normalized.replace(pattern, (match) =>
        applyReplacementCase(match, replacement)
      )
    }
  }

  const suffixRules: Array<[RegExp, string]> = [
    [/\bitems$/i, "item"],
    [/\bentries$/i, "entry"],
    [/\brecords$/i, "record"],
    [/\blines$/i, "line"],
    [/\bnotes$/i, "note"],
    [/\bproblems$/i, "problem"],
    [/\bdiagnoses$/i, "diagnosis"],
    [/\bmedications$/i, "medication"],
    [/\bprocedures$/i, "procedure"],
    [/\bservices$/i, "service"],
    [/\bresults$/i, "result"],
    [/\borders$/i, "order"],
    [/\bplans$/i, "plan"],
  ]

  for (const [pattern, replacement] of suffixRules) {
    if (pattern.test(normalized)) {
      return normalized.replace(pattern, (match) =>
        applyReplacementCase(match, replacement)
      )
    }
  }

  const words = normalized.split(/\s+/)
  const lastWord = words[words.length - 1]
  if (/^[A-Za-z]+ies$/.test(lastWord)) {
    words[words.length - 1] = `${lastWord.slice(0, -3)}y`
    return words.join(" ")
  }
  if (/^[A-Za-z]+s$/.test(lastWord) && !/ss$/i.test(lastWord)) {
    words[words.length - 1] = lastWord.slice(0, -1)
    return words.join(" ")
  }

  return normalized
}

export function deriveRepeatableItemLabel(input: {
  label: string
  key: string
}) {
  const source = input.label.trim() || humanizeDocumentKey(input.key)
  if (!source) return "Item"

  if (/[가-힣]/.test(source)) {
    return source
  }

  return singularizeEnglishLabel(source)
}

function buildExistingItemLabelMap(nodes: DocumentSchemaNode[]) {
  const itemLabels = new Map<string, string>()

  for (const node of nodes) {
    if ("children" in node) {
      if (node.type === "repeatableGroup" && node.itemLabel?.trim()) {
        itemLabels.set(node.key, node.itemLabel.trim())
      }
      const nested = buildExistingItemLabelMap(node.children)
      for (const [key, value] of nested.entries()) {
        itemLabels.set(key, value)
      }
    }
  }

  return itemLabels
}

export function ensureRepeatableItemLabels(
  schema: DocumentTemplateSchema,
  existingSchema?: DocumentTemplateSchema
): DocumentTemplateSchema {
  const existingItemLabels = existingSchema
    ? buildExistingItemLabelMap(existingSchema.nodes)
    : new Map<string, string>()

  const normalizeNodes = (nodes: DocumentSchemaNode[]): DocumentSchemaNode[] =>
    nodes.map((node) => {
      if (!("children" in node)) {
        return node
      }

      const children = normalizeNodes(node.children)
      if (node.type !== "repeatableGroup") {
        return {
          ...node,
          children,
        }
      }

      const itemLabel =
        node.itemLabel?.trim() ||
        existingItemLabels.get(node.key) ||
        deriveRepeatableItemLabel(node)

      return {
        ...node,
        itemLabel,
        children,
      }
    })

  return {
    ...schema,
    nodes: normalizeNodes(schema.nodes),
  }
}

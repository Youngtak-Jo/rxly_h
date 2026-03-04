import type { DocumentBuilderDraft } from "@/types/document"

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([left], [right]) => left.localeCompare(right)
  )

  return `{${entries
    .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableSerialize(nestedValue)}`)
    .join(",")}}`
}

function hashString(value: string): string {
  let hash = 5381
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index)
  }

  return (hash >>> 0).toString(16).padStart(8, "0")
}

export function buildDocumentPreviewInputChecksum(input: {
  title: string
  description: string
  category: string
  schema: DocumentBuilderDraft["schema"]
  generationConfig: DocumentBuilderDraft["generationConfig"]
  locale: string
}): string {
  return hashString(
    stableSerialize({
      title: input.title,
      description: input.description,
      category: input.category,
      schema: input.schema,
      generationConfig: input.generationConfig,
      locale: input.locale,
    })
  )
}

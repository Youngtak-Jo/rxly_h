const DEFAULT_BLANK_DOCUMENT_TITLES = [
  "Untitled Document",
  "제목 없는 문서",
] as const

function normalizeTitle(title: string | null | undefined): string | null {
  if (typeof title !== "string") return null
  const trimmed = title.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function isSystemBlankDocumentTitle(
  title: string | null | undefined
): boolean {
  const normalized = normalizeTitle(title)
  if (!normalized) return true

  const lowered = normalized.toLocaleLowerCase("en-US")
  return DEFAULT_BLANK_DOCUMENT_TITLES.some(
    (candidate) => candidate.toLocaleLowerCase("en-US") === lowered
  )
}

export function resolveBlankDocumentTitle(args: {
  currentTitle?: string | null
  aiTitle?: string | null
}): string | null {
  const currentTitle = normalizeTitle(args.currentTitle)
  const aiTitle = normalizeTitle(args.aiTitle)

  if (!currentTitle) {
    return aiTitle
  }

  if (isSystemBlankDocumentTitle(currentTitle)) {
    return aiTitle ?? currentTitle
  }

  return currentTitle
}

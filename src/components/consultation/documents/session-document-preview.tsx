"use client"

import { useMemo } from "react"
import {
  isRichTextDocument,
  normalizeRichTextDocument,
  richTextDocumentToHtml,
  type RichTextDocument,
} from "@/lib/documents/rich-text"
import type { SessionDocumentRecord } from "@/types/document"

function nodeHasMeaningfulContent(
  node: RichTextDocument | Record<string, unknown> | null | undefined
): boolean {
  if (!node) return false

  if ("type" in node && node.type === "text") {
    return typeof node.text === "string" && node.text.trim().length > 0
  }

  if ("type" in node && node.type === "image") {
    return (
      !!node.attrs &&
      typeof node.attrs === "object" &&
      typeof (node.attrs as { src?: unknown }).src === "string" &&
      !!(node.attrs as { src: string }).src.trim()
    )
  }

  const content =
    "content" in node && Array.isArray(node.content)
      ? (node.content as Array<RichTextDocument | Record<string, unknown>>)
      : []

  return content.some((child) => nodeHasMeaningfulContent(child))
}

export function hasSessionDocumentPreviewContent(
  document: SessionDocumentRecord | null | undefined
): boolean {
  if (!document || !isRichTextDocument(document.contentJson)) {
    return false
  }

  const normalized = normalizeRichTextDocument(document.contentJson)
  return (
    Array.isArray(normalized.content) &&
    normalized.content.some((node) => nodeHasMeaningfulContent(node))
  )
}

export function SessionDocumentPreview({
  document,
}: {
  document: SessionDocumentRecord
}) {
  const html = useMemo(() => {
    if (!hasSessionDocumentPreviewContent(document)) {
      return ""
    }

    return richTextDocumentToHtml(normalizeRichTextDocument(document.contentJson))
  }, [document])

  if (!html.trim()) {
    return null
  }

  return (
    <div className="pointer-events-none flex h-full items-start justify-start overflow-hidden">
      <div className="origin-top-left scale-[0.32] transform-gpu">
        <div
          className="min-h-[820px] w-[620px] overflow-hidden bg-white px-11 py-9 [&_.rxly-document-root]:text-slate-900 [&_.rxly-document-root_h1]:text-slate-950 [&_.rxly-document-root_h2]:text-slate-800 [&_.rxly-document-root_h3]:text-slate-900 [&_.rxly-document-root_blockquote]:text-slate-600 [&_.rxly-document-root_th]:bg-slate-100 [&_.rxly-document-root_th]:text-slate-500"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}

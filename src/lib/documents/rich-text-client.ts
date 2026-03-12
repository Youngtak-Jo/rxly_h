"use client"

import { generateJSON } from "@tiptap/html"
import {
  createRichTextExtensions,
  normalizeRichTextDocument,
  type RichTextDocument,
} from "@/lib/documents/rich-text"

export function htmlToRichTextDocument(html: string): RichTextDocument {
  const json = generateJSON(
    html.trim(),
    createRichTextExtensions({ includePlaceholder: false })
  )

  return normalizeRichTextDocument(json)
}

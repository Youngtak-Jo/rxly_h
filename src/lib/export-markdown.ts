import rehypeStringify from "rehype-stringify"
import remarkGfm from "remark-gfm"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { unified } from "unified"

const CITATION_PRE_RE = /\[\[([^\]]+)\]\]\(([^)]+)\)/g
const SINGLE_PARAGRAPH_RE = /^<p>([\s\S]*)<\/p>\s*$/

const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeStringify)

export function preprocessExportMarkdown(value: string): string {
  return value.replace(CITATION_PRE_RE, "[$1]($2)")
}

export function renderMarkdownBlock(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""

  return String(markdownProcessor.processSync(preprocessExportMarkdown(trimmed)))
}

export function renderMarkdownInline(value: string): string {
  const html = renderMarkdownBlock(value)
  if (!html) return ""

  const paragraphMatch = html.match(SINGLE_PARAGRAPH_RE)
  return paragraphMatch ? paragraphMatch[1] : html.trim()
}

export function renderMarkdownBulletList(items: string[]): string {
  const normalized = items.map((item) => item.trim()).filter(Boolean)
  if (normalized.length === 0) return ""

  return `<ul>${normalized
    .map((item) => `<li>${renderMarkdownInline(item)}</li>`)
    .join("")}</ul>`
}

export function renderMarkdownOrderedList(items: string[]): string {
  const normalized = items.map((item) => item.trim()).filter(Boolean)
  if (normalized.length === 0) return ""

  return `<ol>${normalized
    .map((item) => `<li>${renderMarkdownInline(item)}</li>`)
    .join("")}</ol>`
}

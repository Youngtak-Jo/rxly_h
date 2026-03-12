import sanitizeHtml from "sanitize-html"
import { extractStandaloneExportFragment } from "@/lib/export-document"

const EXPORT_ALLOWED_TAGS = [
  "style",
  "main",
  "article",
  "section",
  "header",
  "footer",
  "figure",
  "figcaption",
  "label",
  "input",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "br",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "b",
  "i",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "span",
  "div",
  "hr",
  "a",
  "pre",
  "code",
  "img",
] as const

const EXPORT_ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  "*": ["class", "style", "data-callout", "data-type"],
  a: ["href", "target", "rel"],
  img: ["src", "alt"],
  input: ["checked", "disabled", "type"],
}

export function sanitizeStandaloneExportHtml(standaloneHtml: string): string {
  return sanitizeHtml(extractStandaloneExportFragment(standaloneHtml), {
    allowedTags: [...EXPORT_ALLOWED_TAGS],
    allowedAttributes: EXPORT_ALLOWED_ATTRIBUTES,
  })
}

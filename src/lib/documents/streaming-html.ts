export function sanitizeStreamingHtml(value: string): string {
  return value
    .replace(/^\uFEFF?/, "")
    .replace(/^\s*```(?:html)?\s*/i, "")
    .replace(/\s*```+\s*$/i, "")
}

export function sanitizeFinalStreamingHtml(value: string): string {
  return sanitizeStreamingHtml(value).trim()
}

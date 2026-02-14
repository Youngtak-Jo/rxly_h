type LogLevel = "info" | "warn" | "error"

const PHI_KEYS = new Set([
  "patientname",
  "chiefcomplaint",
  "hpitext",
  "medications",
  "rostext",
  "pmh",
  "socialhistory",
  "familyhistory",
  "physicalexam",
  "labsstudies",
  "assessment",
  "plan",
  "text",
  "transcript",
  "content",
  "summary",
  "keyfindings",
  "redflags",
  "vitals",
  "evidence",
  "diseasename",
  "utterances",
  "doctornotes",
  "html",
  "question",
  "selectedtext",
  "comment",
])

function sanitize(data: unknown): unknown {
  if (data === null || data === undefined) return data

  if (data instanceof Error) {
    return { name: data.name, message: data.message, stack: data.stack }
  }

  if (typeof data === "string") {
    return data.length > 200 ? `${data.slice(0, 100)}...[TRUNCATED]` : data
  }

  if (typeof data !== "object") return data

  if (Array.isArray(data)) {
    return data.map(sanitize)
  }

  const obj = data as Record<string, unknown>
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (PHI_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]"
    } else {
      sanitized[key] = sanitize(value)
    }
  }
  return sanitized
}

function log(level: LogLevel, message: string, ...args: unknown[]) {
  const sanitizedArgs = args.map(sanitize)
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`

  switch (level) {
    case "error":
      console.error(prefix, message, ...sanitizedArgs)
      break
    case "warn":
      console.warn(prefix, message, ...sanitizedArgs)
      break
    default:
      console.log(prefix, message, ...sanitizedArgs)
  }
}

export const logger = {
  info: (message: string, ...args: unknown[]) => log("info", message, ...args),
  warn: (message: string, ...args: unknown[]) => log("warn", message, ...args),
  error: (message: string, ...args: unknown[]) =>
    log("error", message, ...args),
}

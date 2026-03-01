export const UI_LOCALE_COOKIE = "rxly-ui-locale"
export const UI_TIMEZONE_COOKIE = "rxly-ui-timezone"
export const DEFAULT_UI_TIME_ZONE = "Asia/Seoul"

export const UI_LOCALES = ["en", "ko"] as const

export type UiLocale = (typeof UI_LOCALES)[number]

export function normalizeUiLocale(locale: string | null | undefined): UiLocale | undefined {
  if (!locale) return undefined

  const normalized = locale.trim().toLowerCase()

  if (normalized.startsWith("ko")) return "ko"
  if (normalized.startsWith("en")) return "en"

  return undefined
}

export function detectRequestUiLocale(acceptLanguage: string | null | undefined): UiLocale {
  if (!acceptLanguage) return "en"

  const candidates = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0]?.trim())
    .filter(Boolean)

  for (const candidate of candidates) {
    const locale = normalizeUiLocale(candidate)
    if (locale) return locale
  }

  return "en"
}

export function normalizeUiTimeZone(timeZone: string | null | undefined): string | undefined {
  if (!timeZone) return undefined

  const normalized = timeZone.trim()

  if (!normalized) return undefined

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: normalized,
    }).resolvedOptions().timeZone
  } catch {
    return undefined
  }
}

export function toIntlLocale(locale: UiLocale): "en-US" | "ko-KR" {
  return locale === "ko" ? "ko-KR" : "en-US"
}

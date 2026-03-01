export const UI_LOCALE_COOKIE = "rxly-ui-locale"

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

export function toIntlLocale(locale: UiLocale): "en-US" | "ko-KR" {
  return locale === "ko" ? "ko-KR" : "en-US"
}

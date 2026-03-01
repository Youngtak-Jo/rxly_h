import { toIntlLocale, type UiLocale } from "@/i18n/config"

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value)
}

export function formatDate(
  value: Date | string,
  locale: UiLocale,
  options?: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), options).format(
    toDate(value)
  )
}

export function formatDateTime(
  value: Date | string,
  locale: UiLocale,
  options?: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  }).format(toDate(value))
}

export function formatNumber(
  value: number,
  locale: UiLocale,
  options?: Intl.NumberFormatOptions
) {
  return new Intl.NumberFormat(toIntlLocale(locale), options).format(value)
}

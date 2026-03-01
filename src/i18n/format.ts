import { toIntlLocale, type UiLocale } from "@/i18n/config"

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value)
}

export function formatDate(
  value: Date | string,
  locale: UiLocale,
  timeZone: string,
  options?: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    timeZone,
    ...options,
  }).format(toDate(value))
}

export function formatDateTime(
  value: Date | string,
  locale: UiLocale,
  timeZone: string,
  options?: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
    ...options,
  }).format(toDate(value))
}

export function formatTime(
  value: Date | string,
  locale: UiLocale,
  timeZone: string,
  options?: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    hour: "numeric",
    hourCycle: "h23",
    minute: "2-digit",
    timeZone,
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

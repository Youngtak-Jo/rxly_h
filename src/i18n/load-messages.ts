import type { UiLocale } from "@/i18n/config"

const messageLoaders = {
  en: () => import("@/messages/en"),
  ko: () => import("@/messages/ko"),
} as const

export async function loadMessages(locale: UiLocale) {
  return (await messageLoaders[locale]()).default
}

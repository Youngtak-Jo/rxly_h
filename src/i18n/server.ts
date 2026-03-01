import "server-only"

import { cookies, headers } from "next/headers"

import {
  UI_LOCALE_COOKIE,
  detectRequestUiLocale,
  normalizeUiLocale,
  type UiLocale,
} from "@/i18n/config"

export async function resolveServerUiLocale(): Promise<UiLocale> {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const defaultLocale = detectRequestUiLocale(
    headerStore.get("accept-language")
  )

  return normalizeUiLocale(cookieStore.get(UI_LOCALE_COOKIE)?.value) ?? defaultLocale
}

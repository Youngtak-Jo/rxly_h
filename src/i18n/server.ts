import "server-only"

import { cookies, headers } from "next/headers"

import {
  DEFAULT_UI_TIME_ZONE,
  UI_LOCALE_COOKIE,
  UI_TIMEZONE_COOKIE,
  detectRequestUiLocale,
  normalizeUiLocale,
  normalizeUiTimeZone,
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

export async function resolveServerUiTimeZone(): Promise<{
  timeZone: string
  hasStoredTimeZone: boolean
}> {
  const cookieStore = await cookies()
  const storedTimeZone = normalizeUiTimeZone(
    cookieStore.get(UI_TIMEZONE_COOKIE)?.value
  )

  if (storedTimeZone) {
    return {
      timeZone: storedTimeZone,
      hasStoredTimeZone: true,
    }
  }

  return {
    timeZone: DEFAULT_UI_TIME_ZONE,
    hasStoredTimeZone: false,
  }
}

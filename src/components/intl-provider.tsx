"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { NextIntlClientProvider } from "next-intl"

import type { UiLocale } from "@/i18n/config"
import {
  UI_LOCALE_COOKIE,
  UI_TIMEZONE_COOKIE,
  normalizeUiTimeZone,
} from "@/i18n/config"

type UiLocaleContextValue = {
  defaultLocale: UiLocale
  locale: UiLocale
  resetLocale: () => void
  setLocale: (locale: UiLocale) => void
}

const UiLocaleContext = React.createContext<UiLocaleContextValue | null>(null)

export function IntlProvider({
  children,
  defaultLocale,
  hasStoredTimeZone,
  locale,
  messages,
  timeZone,
}: {
  children: React.ReactNode
  defaultLocale: UiLocale
  hasStoredTimeZone: boolean
  locale: UiLocale
  messages: Record<string, unknown>
  timeZone: string
}) {
  const router = useRouter()
  const [, startTransition] = React.useTransition()

  React.useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  React.useEffect(() => {
    const browserTimeZone = normalizeUiTimeZone(
      Intl.DateTimeFormat().resolvedOptions().timeZone
    )

    if (!browserTimeZone) return

    if (hasStoredTimeZone && browserTimeZone === timeZone) return

    document.cookie = `${UI_TIMEZONE_COOKIE}=${browserTimeZone}; path=/; max-age=31536000; samesite=lax`

    if (browserTimeZone !== timeZone) {
      startTransition(() => {
        router.refresh()
      })
    }
  }, [hasStoredTimeZone, router, startTransition, timeZone])

  const setLocale = React.useCallback((nextLocale: UiLocale) => {
    if (nextLocale === locale) return

    document.documentElement.lang = nextLocale
    document.cookie = `${UI_LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000; samesite=lax`

    startTransition(() => {
      router.refresh()
    })
  }, [locale, router, startTransition])

  const resetLocale = React.useCallback(() => {
    document.documentElement.lang = defaultLocale
    document.cookie = `${UI_LOCALE_COOKIE}=; path=/; max-age=0; samesite=lax`

    startTransition(() => {
      router.refresh()
    })
  }, [defaultLocale, router, startTransition])

  const value = React.useMemo(
    () => ({
      defaultLocale,
      locale,
      resetLocale,
      setLocale,
    }),
    [defaultLocale, locale, resetLocale, setLocale]
  )

  return (
    <UiLocaleContext.Provider value={value}>
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone={timeZone}
      >
        {children}
      </NextIntlClientProvider>
    </UiLocaleContext.Provider>
  )
}

export function useUiLocale() {
  const context = React.useContext(UiLocaleContext)

  if (!context) {
    throw new Error("useUiLocale must be used within IntlProvider")
  }

  return context
}

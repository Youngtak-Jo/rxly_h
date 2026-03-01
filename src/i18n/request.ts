import { getRequestConfig } from "next-intl/server"

import { loadMessages } from "@/i18n/load-messages"
import { resolveServerUiLocale, resolveServerUiTimeZone } from "@/i18n/server"

export default getRequestConfig(async () => {
  const [locale, { timeZone }] = await Promise.all([
    resolveServerUiLocale(),
    resolveServerUiTimeZone(),
  ])

  return {
    locale,
    messages: await loadMessages(locale),
    timeZone,
  }
})

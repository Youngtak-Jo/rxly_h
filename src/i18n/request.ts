import { getRequestConfig } from "next-intl/server"

import { loadMessages } from "@/i18n/load-messages"
import { resolveServerUiLocale } from "@/i18n/server"

export default getRequestConfig(async () => {
  const locale = await resolveServerUiLocale()

  return {
    locale,
    messages: await loadMessages(locale),
  }
})

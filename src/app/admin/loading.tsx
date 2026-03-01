import { Loader2 } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function AdminLoading() {
  const t = await getTranslations("AdminShell")

  return (
    <div className="flex min-h-56 items-center justify-center">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t("loading")}
      </div>
    </div>
  )
}

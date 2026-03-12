"use client"

import { useTranslations } from "next-intl"
import { IconPrinter } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

interface ShareToolbarProps {
  title: string | null
}

export function ShareToolbar({ title }: ShareToolbarProps) {
  const t = useTranslations("PublicShareViewer")

  return (
    <div className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">
            {title?.trim() || t("defaultTitle")}
          </p>
          <p className="text-xs text-slate-600">{t("toolbarDescription")}</p>
        </div>
        <Button
          type="button"
          className="shrink-0"
          onClick={() => {
            window.print()
          }}
        >
          <IconPrinter className="size-4" />
          {t("printButton")}
        </Button>
      </div>
    </div>
  )
}

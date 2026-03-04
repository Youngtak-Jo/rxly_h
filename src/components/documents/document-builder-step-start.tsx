"use client"

import { IconLoader2, IconSparkles } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function DocumentBuilderStepStart({
  aiLoading,
  aiPrompt,
  documentModelLabel,
  onAiPromptChange,
  onOpenModelSettings,
  onGenerateDraft,
  onStartBlank,
}: {
  aiLoading: boolean
  aiPrompt: string
  documentModelLabel: string
  onAiPromptChange: (value: string) => void
  onOpenModelSettings: () => void
  onGenerateDraft: () => Promise<void>
  onStartBlank: () => void
}) {
  const t = useTranslations("DocumentBuilder")

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center">
        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{t("aiDraft.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("aiDraft.description")}
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <Textarea
              value={aiPrompt}
              onChange={(event) => onAiPromptChange(event.target.value)}
              className="min-h-40 resize-y"
              placeholder={t("aiDraft.placeholder")}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                {t("model.currentLabel", { model: documentModelLabel })}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onOpenModelSettings}
              >
                {t("model.changeInSettings")}
              </Button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onStartBlank}>
                {t("aiDraft.startBlank")}
              </Button>
              <Button
                type="button"
                className="gap-2"
                disabled={aiLoading}
                onClick={() => void onGenerateDraft()}
              >
                {aiLoading ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : (
                  <IconSparkles className="size-4" />
                )}
                {t("aiDraft.generate")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

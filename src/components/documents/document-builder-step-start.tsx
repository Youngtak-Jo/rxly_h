"use client"

import { IconLoader2, IconSparkles } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
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
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("aiDraft.title")}</CardTitle>
            <CardDescription>{t("aiDraft.description")}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="sr-only">{t("aiDraft.title")}</Label>
              <Textarea
                value={aiPrompt}
                onChange={(event) => onAiPromptChange(event.target.value)}
                className="min-h-40 resize-y"
                placeholder={t("aiDraft.placeholder")}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-3.5 py-2.5">
              <p className="text-xs text-muted-foreground">
                {t("model.currentLabel", { model: documentModelLabel })}
              </p>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={onOpenModelSettings}
              >
                {t("model.changeInSettings")}
              </Button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onStartBlank}
              >
                {t("aiDraft.startBlank")}
              </Button>
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                disabled={aiLoading}
                onClick={() => void onGenerateDraft()}
              >
                {aiLoading ? (
                  <IconLoader2 className="size-3.5 animate-spin" />
                ) : (
                  <IconSparkles className="size-3.5" />
                )}
                {t("aiDraft.generate")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

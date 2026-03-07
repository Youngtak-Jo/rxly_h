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
  onAiPromptChange,
  onGenerateDraft,
  onStartBlank,
}: {
  aiLoading: boolean
  aiPrompt: string
  onAiPromptChange: (value: string) => void
  onGenerateDraft: () => Promise<void>
  onStartBlank: () => void
}) {
  const t = useTranslations("DocumentBuilder")

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Card className="gap-4 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-sm">{t("aiDraft.title")}</CardTitle>
            <CardDescription className="text-xs">{t("aiDraft.description")}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-4">
            <div className="space-y-1.5">
              <Label className="sr-only">{t("aiDraft.title")}</Label>
              <Textarea
                value={aiPrompt}
                onChange={(event) => onAiPromptChange(event.target.value)}
                className="min-h-32 resize-y text-sm"
                placeholder={t("aiDraft.placeholder")}
              />
            </div>



            <div className="flex items-center justify-end gap-2">
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

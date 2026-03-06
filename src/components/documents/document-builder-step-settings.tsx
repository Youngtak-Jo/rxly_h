"use client"

import type { Dispatch, SetStateAction } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  getDocumentCategoryOptions,
  normalizeDocumentCategory,
} from "@/lib/documents/categories"
import {
  getDocumentLanguageOptions,
  getDocumentRegionOptions,
} from "@/lib/documents/language-region"
import {
  DOCUMENT_CONTEXT_SOURCES,
  type DocumentBuilderDraft,
} from "@/types/document"

const DOCUMENT_CATEGORY_OPTIONS = getDocumentCategoryOptions()
const DOCUMENT_LANGUAGE_OPTIONS = getDocumentLanguageOptions()
const DOCUMENT_REGION_OPTIONS = getDocumentRegionOptions()

export function DocumentBuilderStepSettings({
  draft,
  setDraft,
  documentModelLabel,
  onOpenModelSettings,
  onResetToServerVersion,
  restoredLocalChanges,
  validationError,
}: {
  draft: DocumentBuilderDraft
  setDraft: Dispatch<SetStateAction<DocumentBuilderDraft>>
  documentModelLabel: string
  onOpenModelSettings: () => void
  onResetToServerVersion: (() => void) | null
  restoredLocalChanges: boolean
  validationError: string | null
}) {
  const t = useTranslations("DocumentBuilder")
  const tMeta = useTranslations("DocumentMetadata")

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        {restoredLocalChanges ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="min-w-0">
              <p className="font-medium text-[13px]">{t("localDraft.restoredTitle")}</p>
              <p className="text-xs opacity-70">
                {t("localDraft.restoredDescription")}
              </p>
            </div>
            {onResetToServerVersion ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={onResetToServerVersion}
              >
                {t("localDraft.resetToServer")}
              </Button>
            ) : null}
          </div>
        ) : null}

        {validationError ? (
          <p className="text-sm text-destructive">{validationError}</p>
        ) : null}

        {/* ── Basic info ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("templateSettings.basicTitle")}
            </CardTitle>
            <CardDescription>
              {t("templateSettings.basicDescription")}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("templateSettings.titleLabel")}</Label>
              <Input
                value={draft.title}
                onChange={(event) =>
                  setDraft((d) => ({ ...d, title: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("templateSettings.descriptionLabel")}</Label>
              <Textarea
                value={draft.description}
                onChange={(event) =>
                  setDraft((d) => ({ ...d, description: event.target.value }))
                }
                className="min-h-24 resize-y"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="min-w-0 space-y-2">
                <Label>{t("templateSettings.categoryLabel")}</Label>
                <Select
                  value={normalizeDocumentCategory(draft.category)}
                  onValueChange={(value) =>
                    setDraft((d) => ({ ...d, category: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.labelKey as never)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0 space-y-2">
                <Label>{t("templateSettings.languageLabel")}</Label>
                <Select
                  value={draft.language}
                  onValueChange={(value: DocumentBuilderDraft["language"]) =>
                    setDraft((d) => ({ ...d, language: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_LANGUAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {tMeta(option.labelKey as never)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0 space-y-2">
                <Label>{t("templateSettings.regionLabel")}</Label>
                <Select
                  value={draft.region}
                  onValueChange={(value: DocumentBuilderDraft["region"]) =>
                    setDraft((d) => ({ ...d, region: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_REGION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {tMeta(option.labelKey as never)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* ── Advanced generation settings ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("generationSettings.advancedTitle")}
            </CardTitle>
            <CardDescription>
              {t("generationSettings.advancedDescription")}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
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

            <div className="space-y-2">
              <Label>{t("generationSettings.systemInstructionsLabel")}</Label>
              <Textarea
                value={draft.generationConfig.systemInstructions}
                onChange={(event) =>
                  setDraft((d) => ({
                    ...d,
                    generationConfig: {
                      ...d.generationConfig,
                      systemInstructions: event.target.value,
                    },
                  }))
                }
                className="min-h-28 resize-y"
              />
            </div>

            <div className="space-y-2.5">
              <Label>{t("generationSettings.contextSourcesLabel")}</Label>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {DOCUMENT_CONTEXT_SOURCES.map((source) => {
                  const checked =
                    draft.generationConfig.contextSources.includes(source)
                  return (
                    <label
                      key={source}
                      className="flex items-center gap-2 text-sm text-foreground/90"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(nextChecked) =>
                          setDraft((d) => ({
                            ...d,
                            generationConfig: {
                              ...d.generationConfig,
                              contextSources:
                                nextChecked === true
                                  ? Array.from(
                                    new Set([
                                      ...d.generationConfig.contextSources,
                                      source,
                                    ])
                                  )
                                  : d.generationConfig.contextSources.filter(
                                    (item) => item !== source
                                  ),
                            },
                          }))
                        }
                      />
                      {t(`contextSources.${source}` as never)}
                    </label>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

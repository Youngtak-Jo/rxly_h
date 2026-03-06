"use client"

import type { Dispatch, SetStateAction } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
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
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        {restoredLocalChanges ? (
          <div className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{t("localDraft.restoredTitle")}</p>
              <p className="text-xs opacity-80">
                {t("localDraft.restoredDescription")}
              </p>
            </div>
            {onResetToServerVersion ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onResetToServerVersion}
              >
                {t("localDraft.resetToServer")}
              </Button>
            ) : null}
          </div>
        ) : null}

        {validationError ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {validationError}
          </div>
        ) : null}

        <section className="space-y-5">
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold">
              {t("templateSettings.basicTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("templateSettings.basicDescription")}
            </p>
          </div>

          <div className="grid gap-5">
            <div className="space-y-2">
              <Label>{t("templateSettings.titleLabel")}</Label>
              <Input
                value={draft.title}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    title: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("templateSettings.descriptionLabel")}</Label>
              <Textarea
                value={draft.description}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    description: event.target.value,
                  }))
                }
                className="min-h-28 resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("templateSettings.categoryLabel")}</Label>
              <Select
                value={normalizeDocumentCategory(draft.category)}
                onValueChange={(value) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    category: value,
                  }))
                }
              >
                <SelectTrigger>
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

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("templateSettings.languageLabel")}</Label>
                <Select
                  value={draft.language}
                  onValueChange={(value: DocumentBuilderDraft["language"]) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      language: value,
                    }))
                  }
                >
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label>{t("templateSettings.regionLabel")}</Label>
                <Select
                  value={draft.region}
                  onValueChange={(value: DocumentBuilderDraft["region"]) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      region: value,
                    }))
                  }
                >
                  <SelectTrigger>
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

            <div className="space-y-2">
              <Label>{t("templateSettings.visibilityLabel")}</Label>
              <Select
                value={draft.visibility}
                onValueChange={(value: "PRIVATE" | "PUBLIC") =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    visibility: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIVATE">
                    {t("templateSettings.visibility.private")}
                  </SelectItem>
                  <SelectItem value="PUBLIC">
                    {t("templateSettings.visibility.public")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="space-y-5 border-t border-border/60 pt-8">
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold">
              {t("generationSettings.advancedTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("generationSettings.advancedDescription")}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/30 px-4 py-3">
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

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("generationSettings.audienceLabel")}</Label>
              <Input
                value={draft.generationConfig.audience}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    generationConfig: {
                      ...currentDraft.generationConfig,
                      audience: event.target.value,
                    },
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("generationSettings.outputToneLabel")}</Label>
              <Input
                value={draft.generationConfig.outputTone}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    generationConfig: {
                      ...currentDraft.generationConfig,
                      outputTone: event.target.value,
                    },
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("generationSettings.systemInstructionsLabel")}</Label>
            <Textarea
              value={draft.generationConfig.systemInstructions}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  generationConfig: {
                    ...currentDraft.generationConfig,
                    systemInstructions: event.target.value,
                  },
                }))
              }
              className="min-h-32 resize-y"
            />
          </div>

          <div className="space-y-3">
            <Label>{t("generationSettings.contextSourcesLabel")}</Label>
            <div className="grid gap-3 md:grid-cols-2">
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
                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          generationConfig: {
                            ...currentDraft.generationConfig,
                            contextSources:
                              nextChecked === true
                                ? Array.from(
                                    new Set([
                                      ...currentDraft.generationConfig
                                        .contextSources,
                                      source,
                                    ])
                                  )
                                : currentDraft.generationConfig.contextSources.filter(
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
        </section>
      </div>
    </div>
  )
}

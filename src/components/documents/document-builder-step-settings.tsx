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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  buildConfirmedDiagnosisRequirement,
  documentSchemaContainsDiagnosisFields,
  getConfirmedDiagnosisRequirement,
} from "@/lib/documents/generation-requirements"
import {
  getDocumentCategoryOptions,
  normalizeDocumentCategory,
} from "@/lib/documents/categories"
import {
  getDocumentLanguageOptions,
  getDocumentRegionOptions,
} from "@/lib/documents/language-region"
import type { DocumentBuilderDraft } from "@/types/document"

const DOCUMENT_CATEGORY_OPTIONS = getDocumentCategoryOptions()
const DOCUMENT_LANGUAGE_OPTIONS = getDocumentLanguageOptions()
const DOCUMENT_REGION_OPTIONS = getDocumentRegionOptions()

export function DocumentBuilderStepSettings({
  draft,
  setDraft,
  onResetToServerVersion,
  restoredLocalChanges,
  validationError,
}: {
  draft: DocumentBuilderDraft
  setDraft: Dispatch<SetStateAction<DocumentBuilderDraft>>
  onResetToServerVersion: (() => void) | null
  restoredLocalChanges: boolean
  validationError: string | null
}) {
  const t = useTranslations("DocumentBuilder")
  const tMeta = useTranslations("DocumentMetadata")
  const supportsDiagnosisSelection = documentSchemaContainsDiagnosisFields(
    draft.schema
  )
  const confirmedDiagnosisRequirement = getConfirmedDiagnosisRequirement(
    draft.generationConfig
  )
  const diagnosisSelectionRequired =
    confirmedDiagnosisRequirement?.required ?? true

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        {restoredLocalChanges ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="min-w-0">
              <p className="font-medium text-[13px]">
                {t("localDraft.restoredTitle")}
              </p>
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

        <Card className="gap-4 py-4">
          <CardHeader className="px-4">
            <CardTitle className="text-sm">
              {t("templateSettings.basicTitle")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("templateSettings.basicDescription")}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-4">
            <div className="space-y-1.5">
              <Label>{t("templateSettings.titleLabel")}</Label>
              <Input
                placeholder={t("templateSettings.titlePlaceholder")}
                value={draft.title}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    title: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("templateSettings.descriptionLabel")}</Label>
              <Textarea
                placeholder={t("templateSettings.descriptionPlaceholder")}
                value={draft.description}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    description: event.target.value,
                  }))
                }
                className="min-h-24 resize-y"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="min-w-0 space-y-1.5">
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

              <div className="min-w-0 space-y-1.5">
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

              <div className="min-w-0 space-y-1.5">
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

            <div className="space-y-2">
              <div className="space-y-1">
                <Label>{t("generationSettings.clinicalBasisLabel")}</Label>
                <p className="text-xs text-muted-foreground">
                  {t("generationSettings.clinicalBasisHint")}
                </p>
              </div>
              <ToggleGroup
                type="single"
                value={draft.generationConfig.clinicalContextDefault}
                onValueChange={(value) => {
                  if (!value) return
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    generationConfig: {
                      ...currentDraft.generationConfig,
                      clinicalContextDefault:
                        value as DocumentBuilderDraft["generationConfig"]["clinicalContextDefault"],
                    },
                  }))
                }}
                variant="outline"
                className="w-full justify-start"
              >
                <ToggleGroupItem value="insights">
                  {t("generationSettings.clinicalBasisInsights")}
                </ToggleGroupItem>
                <ToggleGroupItem value="transcript">
                  {t("generationSettings.clinicalBasisTranscript")}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border px-4 py-3">
              <div className="space-y-1 pr-2">
                <Label htmlFor="include-source-images">
                  {t("generationSettings.includeSourceImagesLabel")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("generationSettings.includeSourceImagesHint")}
                </p>
              </div>
              <Switch
                id="include-source-images"
                checked={draft.generationConfig.includeSourceImages}
                onCheckedChange={(checked) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    generationConfig: {
                      ...currentDraft.generationConfig,
                      includeSourceImages: checked,
                    },
                  }))
                }
              />
            </div>

            {supportsDiagnosisSelection ? (
              <div className="flex items-start gap-3 rounded-lg border px-4 py-3">
                <Checkbox
                  id="require-diagnosis-selection"
                  className="mt-0.5"
                  checked={diagnosisSelectionRequired}
                  onCheckedChange={(checked) =>
                    setDraft((currentDraft) => {
                      const existingRequirement = getConfirmedDiagnosisRequirement(
                        currentDraft.generationConfig
                      )

                      return {
                        ...currentDraft,
                        generationConfig: {
                          ...currentDraft.generationConfig,
                          generationRequirements: [
                            ...currentDraft.generationConfig.generationRequirements.filter(
                              (requirement) =>
                                requirement.type !== "confirmedDiagnosis"
                            ),
                            buildConfirmedDiagnosisRequirement({
                              selectionMode:
                                existingRequirement?.selectionMode ?? "single",
                              allowIcd11Search:
                                existingRequirement?.allowIcd11Search ?? true,
                              required: checked === true,
                            }),
                          ],
                        },
                      }
                    })
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="require-diagnosis-selection">
                    {t("generationSettings.requireDiagnosisSelectionLabel")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("generationSettings.requireDiagnosisSelectionHint")}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label>{t("generationSettings.systemInstructionsLabel")}</Label>
              <Textarea
                placeholder={t(
                  "generationSettings.systemInstructionsPlaceholder"
                )}
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
                className="min-h-28 resize-y"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

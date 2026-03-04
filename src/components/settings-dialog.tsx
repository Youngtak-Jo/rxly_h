"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import {
  IconAccessible,
  IconBrain,
  IconBuildingHospital,
  IconChartBar,
  IconChevronLeft,
  IconLanguage,
  IconMessageChatbot,
  IconMicrophone,
  IconPalette,
  IconPlug,
  IconRefresh,
  IconX,
} from "@tabler/icons-react"
import { useTranslations } from "next-intl"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  useSettingsStore,
  useSettingsDialogStore,
  NOVA3_LANGUAGES,
  AI_MODELS,
  DEFAULT_AI_MODEL,
  EMR_PROVIDERS,
  FONT_SIZE_OPTIONS,
  UI_DENSITY_OPTIONS,
  BORDER_RADIUS_OPTIONS,
} from "@/stores/settings-store"
import type {
  SettingsPage,
  FontSize,
  UiDensity,
  BorderRadius,
} from "@/stores/settings-store"
import {
  applyFontSize,
  applyUiDensity,
  applyBorderRadius,
  applyAllAppearanceSettings,
} from "@/lib/apply-appearance"
import { useUiLocale } from "@/components/intl-provider"
import { useConnectorStore } from "@/stores/connector-store"
import type { ConnectorState } from "@/types/insights"

const CONNECTORS: (keyof ConnectorState)[] = [
  "pubmed",
  "icd11",
  "europe_pmc",
  "openfda",
  "clinical_trials",
  "dailymed",
]

const NAV_ITEMS = [
  { key: "language" as const, icon: IconLanguage },
  { key: "speech" as const, icon: IconMicrophone },
  { key: "analysis" as const, icon: IconChartBar },
  { key: "models" as const, icon: IconBrain },
  {
    key: "instructions" as const,
    icon: IconMessageChatbot,
  },
  { key: "connectors" as const, icon: IconPlug },
  { key: "emr" as const, icon: IconBuildingHospital },
  {
    key: "accessibility" as const,
    icon: IconAccessible,
  },
  { key: "appearance" as const, icon: IconPalette },
] as const

export function SettingsDialog() {
  const t = useTranslations("SettingsDialog")
  const { open, activePage, closeSettings } = useSettingsDialogStore()
  const setActivePage = (page: SettingsPage) =>
    useSettingsDialogStore.setState({ activePage: page })
  const [mobileView, setMobileView] = React.useState<"menu" | "detail">("menu")

  const handleNavClick = (key: SettingsPage) => {
    setActivePage(key)
    setMobileView("detail")
  }

  const handleBack = () => {
    setMobileView("menu")
  }

  // Reset mobile view when dialog opens
  React.useEffect(() => {
    if (open) setMobileView("menu")
  }, [open])

  const settingsContent = (
    <>
      {activePage === "language" && <LanguageSettings />}
      {activePage === "speech" && <TranscriptionSettings />}
      {activePage === "analysis" && <AnalysisSettings />}
      {activePage === "models" && <ModelSettings />}
      {activePage === "instructions" && <CustomInstructionsSettings />}
      {activePage === "connectors" && <ConnectorsSettings />}
      {activePage === "emr" && <EMRSettings />}
      {activePage === "accessibility" && <AccessibilitySettings />}
      {activePage === "appearance" && <AppearanceSettings />}
    </>
  )

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeSettings()}>
      <DialogContent
        className="overflow-hidden p-0 max-h-[85dvh] md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{t("dialogTitle")}</DialogTitle>
        <DialogDescription className="sr-only">
          {t("dialogDescription")}
        </DialogDescription>

        {/* Desktop layout */}
        <SidebarProvider className="hidden md:flex items-start min-h-0">
          <Sidebar collapsible="none" className="flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {NAV_ITEMS.map((item) => (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          isActive={activePage === item.key}
                          onClick={() => setActivePage(item.key)}
                        >
                          <item.icon />
                          <span>{t(`nav.${item.key}`)}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <ResetToDefaultsButton />
            </SidebarFooter>
          </Sidebar>
          <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbPage>{t("title")}</BreadcrumbPage>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        {activePage
                          ? t(
                              `nav.${NAV_ITEMS.find((item) => item.key === activePage)?.key ?? "speech"}`
                            )
                          : t("nav.speech")}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
              {settingsContent}
            </div>
          </main>
        </SidebarProvider>

        {/* Mobile layout */}
        <div className="flex flex-col md:hidden min-h-0 max-h-[85dvh]">
          {mobileView === "menu" ? (
            <>
              <header className="flex h-14 shrink-0 items-center justify-between px-4 border-b">
                <h2 className="text-base font-semibold">{t("title")}</h2>
                <button
                  onClick={closeSettings}
                  className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                >
                  <IconX className="size-5" />
                  <span className="sr-only">{t("close")}</span>
                </button>
              </header>
              <nav className="flex flex-1 flex-col overflow-y-auto p-2">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => handleNavClick(item.key)}
                    className="flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-accent transition-colors text-left"
                  >
                    <item.icon className="size-5 text-muted-foreground" />
                    <span>{t(`nav.${item.key}`)}</span>
                  </button>
                ))}
              </nav>
              <div className="border-t px-4 py-3">
                <ResetToDefaultsButton />
              </div>
            </>
          ) : (
            <>
              <header className="flex h-14 shrink-0 items-center justify-between px-4 border-b">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <IconChevronLeft className="size-4" />
                  <span>{t("title")}</span>
                </button>
                <h2 className="text-base font-semibold">
                  {activePage
                    ? t(
                        `nav.${NAV_ITEMS.find((item) => item.key === activePage)?.key ?? "speech"}`
                      )
                    : t("nav.speech")}
                </h2>
                <button
                  onClick={closeSettings}
                  className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                >
                  <IconX className="size-5" />
                  <span className="sr-only">{t("close")}</span>
                </button>
              </header>
              <div className="flex-1 overflow-y-auto p-4">
                {settingsContent}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex w-full items-center sm:w-auto sm:justify-end">
          {children}
        </div>
      </div>
      <Separator />
    </>
  )
}

function LanguageSettings() {
  const t = useTranslations("SettingsDialog")
  const { locale, setLocale } = useUiLocale()

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{t("language.subtitle")}</p>

      <SettingRow
        label={t("language.label")}
        description={t("language.description")}
      >
        <Select value={locale} onValueChange={(value) => setLocale(value as "en" | "ko")}>
          <SelectTrigger className="w-full sm:w-[200px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">{t("language.options.en")}</SelectItem>
            <SelectItem value="ko">{t("language.options.ko")}</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>
    </div>
  )
}

function TranscriptionSettings() {
  const t = useTranslations("SettingsDialog")
  const {
    stt,
    setSttLanguage,
    setSttSmartFormat,
    setSttDiarize,
    audio,
    setNoiseSuppression,
    setEchoCancellation,
    setEndpointing,
    setUtteranceEndMs,
  } = useSettingsStore()

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{t("speech.subtitle")}</p>

      <SettingRow
        label={t("speech.speechRecognitionLanguageLabel")}
        description={t("speech.speechRecognitionLanguageDescription")}
      >
        <Select value={stt.language} onValueChange={setSttLanguage}>
          <SelectTrigger className="w-full sm:w-[200px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOVA3_LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {t(`speech.languageOptions.${lang.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label={t("speech.smartFormattingLabel")}
        description={t("speech.smartFormattingDescription")}
      >
        <Switch
          checked={stt.smartFormat}
          onCheckedChange={setSttSmartFormat}
        />
      </SettingRow>

      <SettingRow
        label={t("speech.speakerDiarizationLabel")}
        description={t("speech.speakerDiarizationDescription")}
      >
        <Switch checked={stt.diarize} onCheckedChange={setSttDiarize} />
      </SettingRow>

      <SettingRow
        label={t("speech.noiseSuppressionLabel")}
        description={t("speech.noiseSuppressionDescription")}
      >
        <Switch
          checked={audio.noiseSuppression}
          onCheckedChange={setNoiseSuppression}
        />
      </SettingRow>

      <SettingRow
        label={t("speech.echoCancellationLabel")}
        description={t("speech.echoCancellationDescription")}
      >
        <Switch
          checked={audio.echoCancellation}
          onCheckedChange={setEchoCancellation}
        />
      </SettingRow>

      <SettingRow
        label={t("speech.endpointingLabel")}
        description={t("speech.endpointingDescription")}
      >
        <Select
          value={String(audio.endpointing)}
          onValueChange={(v) => setEndpointing(Number(v))}
        >
          <SelectTrigger className="w-full sm:w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="200">{t("speech.endpointingOptions.fast")}</SelectItem>
            <SelectItem value="400">{t("speech.endpointingOptions.balanced")}</SelectItem>
            <SelectItem value="600">{t("speech.endpointingOptions.clinical")}</SelectItem>
            <SelectItem value="800">{t("speech.endpointingOptions.relaxed")}</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label={t("speech.utteranceEndLabel")}
        description={t("speech.utteranceEndDescription")}
      >
        <Select
          value={String(audio.utteranceEndMs)}
          onValueChange={(v) => setUtteranceEndMs(Number(v))}
        >
          <SelectTrigger className="w-full sm:w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="800">{t("speech.utteranceEndOptions.short")}</SelectItem>
            <SelectItem value="1200">{t("speech.utteranceEndOptions.standard")}</SelectItem>
            <SelectItem value="1800">{t("speech.utteranceEndOptions.clinical")}</SelectItem>
            <SelectItem value="2500">{t("speech.utteranceEndOptions.extended")}</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>
    </div>
  )
}

function AnalysisSettings() {
  const t = useTranslations("SettingsDialog")
  const {
    analysis,
    setInsightsMinWords,
    setInsightsMinInterval,
    setDdxMinWords,
    setDdxMinInterval,
  } = useSettingsStore()

  const handleInsightsSensitivity = (preset: string) => {
    switch (preset) {
      case "frequent":
        setInsightsMinWords(15)
        setInsightsMinInterval(6000)
        break
      case "balanced":
        setInsightsMinWords(30)
        setInsightsMinInterval(12000)
        break
      case "conservative":
        setInsightsMinWords(60)
        setInsightsMinInterval(20000)
        break
    }
  }

  const handleDdxSensitivity = (preset: string) => {
    switch (preset) {
      case "frequent":
        setDdxMinWords(25)
        setDdxMinInterval(10000)
        break
      case "balanced":
        setDdxMinWords(50)
        setDdxMinInterval(20000)
        break
      case "conservative":
        setDdxMinWords(80)
        setDdxMinInterval(30000)
        break
    }
  }

  const getInsightsPreset = () => {
    if (
      analysis.insightsMinWords === 15 &&
      analysis.insightsMinInterval === 6000
    )
      return "frequent"
    if (
      analysis.insightsMinWords === 60 &&
      analysis.insightsMinInterval === 20000
    )
      return "conservative"
    return "balanced"
  }

  const getDdxPreset = () => {
    if (analysis.ddxMinWords === 25 && analysis.ddxMinInterval === 10000)
      return "frequent"
    if (analysis.ddxMinWords === 80 && analysis.ddxMinInterval === 30000)
      return "conservative"
    return "balanced"
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{t("analysis.subtitle")}</p>

      <SettingRow
        label={t("analysis.insightsFrequencyLabel")}
        description={t("analysis.insightsFrequencyDescription")}
      >
        <Select
          value={getInsightsPreset()}
          onValueChange={handleInsightsSensitivity}
        >
          <SelectTrigger className="w-full sm:w-[180px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="frequent">
              {t("analysis.options.frequentInsights")}
            </SelectItem>
            <SelectItem value="balanced">
              {t("analysis.options.balancedInsights")}
            </SelectItem>
            <SelectItem value="conservative">
              {t("analysis.options.conservativeInsights")}
            </SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label={t("analysis.ddxFrequencyLabel")}
        description={t("analysis.ddxFrequencyDescription")}
      >
        <Select value={getDdxPreset()} onValueChange={handleDdxSensitivity}>
          <SelectTrigger className="w-full sm:w-[180px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="frequent">
              {t("analysis.options.frequentDdx")}
            </SelectItem>
            <SelectItem value="balanced">
              {t("analysis.options.balancedDdx")}
            </SelectItem>
            <SelectItem value="conservative">
              {t("analysis.options.conservativeDdx")}
            </SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>
    </div>
  )
}

function ModelSelector({
  value,
  onValueChange,
  recommendedModel,
  recommendedLabel,
}: {
  value: string
  onValueChange: (value: string) => void
  recommendedModel: string
  recommendedLabel: string
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full sm:w-[250px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {AI_MODELS.map((model) => (
          <SelectItem key={model.value} value={model.value}>
            {model.label}
            {model.value === recommendedModel ? ` ${recommendedLabel}` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ModelSettings() {
  const t = useTranslations("SettingsDialog")
  const {
    aiModel,
    setInsightsModel,
    setRecordModel,
    setPatientHandoutModel,
    setDdxModel,
    setResearchModel,
    setSpeakerIdModel,
    setDiagnosticKeywordsModel,
    setClinicalSupportModel,
    setAiDoctorModel,
    setMedplumModel,
  } = useSettingsStore()

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{t("models.subtitle")}</p>

      <SettingRow
        label={t("models.insightsLabel")}
        description={t("models.insightsDescription")}
      >
        <ModelSelector
          value={aiModel.insightsModel}
          onValueChange={setInsightsModel}
          recommendedModel={DEFAULT_AI_MODEL.insightsModel}
          recommendedLabel={t("models.recommended")}
        />
      </SettingRow>

      <SettingRow
        label={t("models.recordLabel")}
        description={t("models.recordDescription")}
      >
        <ModelSelector
          value={aiModel.recordModel}
          onValueChange={setRecordModel}
          recommendedModel={DEFAULT_AI_MODEL.recordModel}
          recommendedLabel={t("models.recommended")}
        />
      </SettingRow>

      <SettingRow
        label={t("models.patientHandoutLabel")}
        description={t("models.patientHandoutDescription")}
      >
        <ModelSelector
          value={aiModel.patientHandoutModel}
          onValueChange={setPatientHandoutModel}
          recommendedModel={DEFAULT_AI_MODEL.patientHandoutModel}
          recommendedLabel={t("models.recommended")}
        />
      </SettingRow>

      <SettingRow
        label={t("models.ddxLabel")}
        description={t("models.ddxDescription")}
      >
        <ModelSelector
          value={aiModel.ddxModel}
          onValueChange={setDdxModel}
          recommendedModel={DEFAULT_AI_MODEL.ddxModel}
          recommendedLabel={t("models.recommended")}
        />
      </SettingRow>

      <SettingRow
        label={t("models.researchLabel")}
        description={t("models.researchDescription")}
      >
        <ModelSelector
          value={aiModel.researchModel}
          onValueChange={setResearchModel}
          recommendedModel={DEFAULT_AI_MODEL.researchModel}
          recommendedLabel={t("models.recommended")}
        />
      </SettingRow>

      <SettingRow
        label={t("models.speakerIdentificationLabel")}
        description={t("models.speakerIdentificationDescription")}
      >
        <ModelSelector
          value={aiModel.speakerIdModel}
          onValueChange={setSpeakerIdModel}
          recommendedModel={DEFAULT_AI_MODEL.speakerIdModel}
          recommendedLabel={t("models.recommended")}
        />
      </SettingRow>

      <SettingRow
        label={t("models.diagnosticKeywordsLabel")}
        description={t("models.diagnosticKeywordsDescription")}
      >
        <ModelSelector
          value={aiModel.diagnosticKeywordsModel}
          onValueChange={setDiagnosticKeywordsModel}
          recommendedModel={DEFAULT_AI_MODEL.diagnosticKeywordsModel}
          recommendedLabel={t("models.recommended")}
        />
      </SettingRow>

      <SettingRow
        label={t("models.clinicalSupportLabel")}
        description={t("models.clinicalSupportDescription")}
      >
        <ModelSelector
          value={aiModel.clinicalSupportModel}
          onValueChange={setClinicalSupportModel}
          recommendedModel={DEFAULT_AI_MODEL.clinicalSupportModel}
          recommendedLabel={t("models.recommended")}
        />
      </SettingRow>

      <SettingRow
        label={t("models.aiDoctorLabel")}
        description={t("models.aiDoctorDescription")}
      >
        <ModelSelector
          value={aiModel.aiDoctorModel}
          onValueChange={setAiDoctorModel}
          recommendedModel={DEFAULT_AI_MODEL.aiDoctorModel}
          recommendedLabel={t("models.recommended")}
        />
      </SettingRow>

      <SettingRow
        label={t("models.fhirMappingLabel")}
        description={t("models.fhirMappingDescription")}
      >
        <ModelSelector
          value={aiModel.medplumModel}
          onValueChange={setMedplumModel}
          recommendedModel={DEFAULT_AI_MODEL.medplumModel}
          recommendedLabel={t("models.recommended")}
        />
      </SettingRow>
    </div>
  )
}

const INSTRUCTION_FIELDS = [
  "insights",
  "ddx",
  "record",
  "patientHandout",
  "research",
] as const

function CustomInstructionsSettings() {
  const t = useTranslations("SettingsDialog")
  const {
    customInstructions,
    setInsightsInstructions,
    setDdxInstructions,
    setRecordInstructions,
    setResearchInstructions,
    setPatientHandoutInstructions,
  } = useSettingsStore()

  const setters = {
    insights: setInsightsInstructions,
    ddx: setDdxInstructions,
    record: setRecordInstructions,
    research: setResearchInstructions,
    patientHandout: setPatientHandoutInstructions,
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        {t("customInstructions.subtitle")}
      </p>

      {INSTRUCTION_FIELDS.map((field) => (
        <div key={field} className="space-y-2">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">
              {t(`customInstructions.fields.${field}.label`)}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t(`customInstructions.fields.${field}.description`)}
            </p>
          </div>
          <Textarea
            value={customInstructions[field]}
            onChange={(e) => setters[field](e.target.value)}
            placeholder={t(`customInstructions.fields.${field}.placeholder`)}
            className="min-h-[80px] resize-y text-sm"
          />
        </div>
      ))}
    </div>
  )
}

function ConnectorsSettings() {
  const t = useTranslations("SettingsDialog")
  const { connectors, toggleConnector } = useConnectorStore()

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{t("connectors.subtitle")}</p>

      {CONNECTORS.map((connector) => (
        <SettingRow
          key={connector}
          label={t(`connectors.items.${connector}.label`)}
          description={t(`connectors.items.${connector}.description`)}
        >
          <Switch
            id={`connector-${connector}`}
            checked={connectors[connector]}
            onCheckedChange={() => toggleConnector(connector)}
          />
        </SettingRow>
      ))}
    </div>
  )
}

function ResetToDefaultsButton() {
  const t = useTranslations("SettingsDialog")
  const { setTheme: setNextTheme } = useTheme()
  const { resetLocale } = useUiLocale()

  const handleReset = () => {
    useSettingsStore.getState().resetToDefaults()
    useConnectorStore.getState().reset()
    resetLocale()
    setNextTheme("system")
    applyAllAppearanceSettings({
      fontSize: "default",
      uiDensity: "default",
      borderRadius: "default",
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors w-full">
          <IconRefresh className="size-3.5" />
          <span>{t("reset.button")}</span>
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("reset.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("reset.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("reset.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset}>
            {t("reset.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function EMRSettings() {
  const t = useTranslations("SettingsDialog")
  const { emr, setEmrProvider } = useSettingsStore()

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">{t("emr.subtitle")}</p>

      <SettingRow
        label={t("emr.providerLabel")}
        description={t("emr.providerDescription")}
      >
        <Select value={emr.provider} onValueChange={setEmrProvider}>
          <SelectTrigger className="w-full sm:w-[200px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EMR_PROVIDERS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>
    </div>
  )
}

function AccessibilitySettings() {
  const t = useTranslations("SettingsDialog")
  const {
    accessibility,
    setReducedMotion,
    setHighContrast,
    setEnhancedFocusIndicators,
    setTextSpacing,
    setLargeClickTargets,
  } = useSettingsStore()

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {t("accessibility.subtitle")}
      </p>

      <SettingRow
        label={t("accessibility.reducedMotionLabel")}
        description={t("accessibility.reducedMotionDescription")}
      >
        <Switch
          checked={accessibility.reducedMotion}
          onCheckedChange={setReducedMotion}
        />
      </SettingRow>

      <SettingRow
        label={t("accessibility.highContrastLabel")}
        description={t("accessibility.highContrastDescription")}
      >
        <Switch
          checked={accessibility.highContrast}
          onCheckedChange={setHighContrast}
        />
      </SettingRow>

      <SettingRow
        label={t("accessibility.enhancedFocusIndicatorsLabel")}
        description={t("accessibility.enhancedFocusIndicatorsDescription")}
      >
        <Switch
          checked={accessibility.enhancedFocusIndicators}
          onCheckedChange={setEnhancedFocusIndicators}
        />
      </SettingRow>

      <SettingRow
        label={t("accessibility.textSpacingLabel")}
        description={t("accessibility.textSpacingDescription")}
      >
        <Switch
          checked={accessibility.textSpacing}
          onCheckedChange={setTextSpacing}
        />
      </SettingRow>

      <SettingRow
        label={t("accessibility.largeClickTargetsLabel")}
        description={t("accessibility.largeClickTargetsDescription")}
      >
        <Switch
          checked={accessibility.largeClickTargets}
          onCheckedChange={setLargeClickTargets}
        />
      </SettingRow>
    </div>
  )
}

function AppearanceSettings() {
  const t = useTranslations("SettingsDialog")
  const {
    appearance,
    setTheme,
    setFontSize,
    setUiDensity,
    setBorderRadius,
  } = useSettingsStore()
  const { setTheme: setNextTheme } = useTheme()

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    setTheme(theme)
    setNextTheme(theme)
  }

  const handleFontSizeChange = (fontSize: FontSize) => {
    setFontSize(fontSize)
    applyFontSize(fontSize)
  }

  const handleUiDensityChange = (uiDensity: UiDensity) => {
    setUiDensity(uiDensity)
    applyUiDensity(uiDensity)
  }

  const handleBorderRadiusChange = (borderRadius: BorderRadius) => {
    setBorderRadius(borderRadius)
    applyBorderRadius(borderRadius)
  }

  return (
    <div className="space-y-4">
      <SettingRow
        label={t("appearance.themeLabel")}
        description={t("appearance.themeDescription")}
      >
        <Select value={appearance.theme} onValueChange={handleThemeChange}>
          <SelectTrigger className="w-full sm:w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">
              {t("appearance.themeOptions.light")}
            </SelectItem>
            <SelectItem value="dark">
              {t("appearance.themeOptions.dark")}
            </SelectItem>
            <SelectItem value="system">
              {t("appearance.themeOptions.system")}
            </SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label={t("appearance.fontSizeLabel")}
        description={t("appearance.fontSizeDescription")}
      >
        <Select value={appearance.fontSize} onValueChange={handleFontSizeChange}>
          <SelectTrigger className="w-full sm:w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(`appearance.fontSizeOptions.${opt.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label={t("appearance.uiDensityLabel")}
        description={t("appearance.uiDensityDescription")}
      >
        <Select value={appearance.uiDensity} onValueChange={handleUiDensityChange}>
          <SelectTrigger className="w-full sm:w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UI_DENSITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(`appearance.uiDensityOptions.${opt.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label={t("appearance.borderRadiusLabel")}
        description={t("appearance.borderRadiusDescription")}
      >
        <Select value={appearance.borderRadius} onValueChange={handleBorderRadiusChange}>
          <SelectTrigger className="w-full sm:w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BORDER_RADIUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(`appearance.borderRadiusOptions.${opt.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>
    </div>
  )
}

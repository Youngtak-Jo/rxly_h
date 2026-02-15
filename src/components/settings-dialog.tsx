"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import {
  IconAccessible,
  IconBrain,
  IconBuildingHospital,
  IconChartBar,
  IconChevronLeft,
  IconMessageChatbot,
  IconMicrophone,
  IconPalette,
  IconPlug,
  IconRefresh,
  IconX,
} from "@tabler/icons-react"

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
import { useConnectorStore } from "@/stores/connector-store"
import type { ConnectorState } from "@/types/insights"

const CONNECTORS: {
  key: keyof ConnectorState
  label: string
  description: string
}[] = [
    {
      key: "pubmed",
      label: "PubMed",
      description: "NCBI biomedical literature search (36M+ articles)",
    },
    {
      key: "icd11",
      label: "ICD-11",
      description: "WHO International Classification of Diseases",
    },
    {
      key: "europe_pmc",
      label: "Europe PMC",
      description: "European biomedical literature (33M+ publications)",
    },
    {
      key: "openfda",
      label: "OpenFDA",
      description: "FDA drug adverse events & safety reports",
    },
    {
      key: "clinical_trials",
      label: "ClinicalTrials.gov",
      description: "NIH clinical trial database (440K+ studies)",
    },
    {
      key: "dailymed",
      label: "DailyMed",
      description: "FDA-approved drug labeling information",
    },
  ]

const NAV_ITEMS = [
  { key: "speech" as const, label: "Transcription", icon: IconMicrophone },
  { key: "analysis" as const, label: "Analysis", icon: IconChartBar },
  { key: "models" as const, label: "AI Models", icon: IconBrain },
  { key: "instructions" as const, label: "Custom Instructions", icon: IconMessageChatbot },
  { key: "connectors" as const, label: "Knowledge Connectors", icon: IconPlug },
  { key: "emr" as const, label: "EMR/EHR", icon: IconBuildingHospital },
  { key: "accessibility" as const, label: "Accessibility", icon: IconAccessible },
  { key: "appearance" as const, label: "Appearance", icon: IconPalette },
]

export function SettingsDialog() {
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
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Configure transcription, analysis, AI models, EMR/EHR,
          knowledge connectors, accessibility, and appearance settings.
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
                          <span>{item.label}</span>
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
                      <BreadcrumbPage>Settings</BreadcrumbPage>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        {NAV_ITEMS.find((i) => i.key === activePage)?.label}
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
                <h2 className="text-base font-semibold">Settings</h2>
                <button
                  onClick={closeSettings}
                  className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                >
                  <IconX className="size-5" />
                  <span className="sr-only">Close</span>
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
                    <span>{item.label}</span>
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
                  <span>Settings</span>
                </button>
                <h2 className="text-base font-semibold">
                  {NAV_ITEMS.find((i) => i.key === activePage)?.label}
                </h2>
                <button
                  onClick={closeSettings}
                  className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                >
                  <IconX className="size-5" />
                  <span className="sr-only">Close</span>
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
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>
      <Separator />
    </>
  )
}

function TranscriptionSettings() {
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
      <p className="text-xs text-muted-foreground">
        Changes apply to the next recording session.
      </p>

      <SettingRow
        label="Language"
        description="Select the language for speech recognition."
      >
        <Select value={stt.language} onValueChange={setSttLanguage}>
          <SelectTrigger className="w-[200px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOVA3_LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label="Smart Formatting"
        description="Automatically format dates, numbers, and currency."
      >
        <Switch
          checked={stt.smartFormat}
          onCheckedChange={setSttSmartFormat}
        />
      </SettingRow>

      <SettingRow
        label="Speaker Diarization"
        description="Identify and label different speakers."
      >
        <Switch checked={stt.diarize} onCheckedChange={setSttDiarize} />
      </SettingRow>

      <SettingRow
        label="Noise Suppression"
        description="Reduce background noise from the microphone."
      >
        <Switch
          checked={audio.noiseSuppression}
          onCheckedChange={setNoiseSuppression}
        />
      </SettingRow>

      <SettingRow
        label="Echo Cancellation"
        description="Prevent audio feedback loops."
      >
        <Switch
          checked={audio.echoCancellation}
          onCheckedChange={setEchoCancellation}
        />
      </SettingRow>

      <SettingRow
        label="Endpointing Sensitivity"
        description="How quickly silence is detected as end of speech."
      >
        <Select
          value={String(audio.endpointing)}
          onValueChange={(v) => setEndpointing(Number(v))}
        >
          <SelectTrigger className="w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="200">Fast (200ms)</SelectItem>
            <SelectItem value="400">Balanced (400ms)</SelectItem>
            <SelectItem value="600">Clinical (600ms)</SelectItem>
            <SelectItem value="800">Relaxed (800ms)</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label="Utterance End Timeout"
        description="Time to wait before finalizing an utterance."
      >
        <Select
          value={String(audio.utteranceEndMs)}
          onValueChange={(v) => setUtteranceEndMs(Number(v))}
        >
          <SelectTrigger className="w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="800">Short (800ms)</SelectItem>
            <SelectItem value="1200">Standard (1200ms)</SelectItem>
            <SelectItem value="1800">Clinical (1800ms)</SelectItem>
            <SelectItem value="2500">Extended (2500ms)</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>
    </div>
  )
}

function AnalysisSettings() {
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
      <p className="text-xs text-muted-foreground">
        Higher frequency increases API usage and cost.
      </p>

      <SettingRow
        label="Insights Frequency"
        description="How often real-time insights are generated during recording."
      >
        <Select
          value={getInsightsPreset()}
          onValueChange={handleInsightsSensitivity}
        >
          <SelectTrigger className="w-[180px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="frequent">Frequent (15w / 6s)</SelectItem>
            <SelectItem value="balanced">Balanced (30w / 12s)</SelectItem>
            <SelectItem value="conservative">
              Conservative (60w / 20s)
            </SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label="Differential Dx Frequency"
        description="How often differential diagnosis is updated during recording."
      >
        <Select value={getDdxPreset()} onValueChange={handleDdxSensitivity}>
          <SelectTrigger className="w-[180px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="frequent">Frequent (25w / 10s)</SelectItem>
            <SelectItem value="balanced">Balanced (50w / 20s)</SelectItem>
            <SelectItem value="conservative">
              Conservative (80w / 30s)
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
}: {
  value: string
  onValueChange: (value: string) => void
  recommendedModel: string
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[250px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {AI_MODELS.map((model) => (
          <SelectItem key={model.value} value={model.value}>
            {model.label}
            {model.value === recommendedModel ? " (Recommended)" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ModelSettings() {
  const {
    aiModel,
    setInsightsModel,
    setRecordModel,
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
      <p className="text-xs text-muted-foreground">
        Changing models may affect quality and response speed.
      </p>

      <SettingRow
        label="Insights Model"
        description="Used for real-time clinical insights."
      >
        <ModelSelector
          value={aiModel.insightsModel}
          onValueChange={setInsightsModel}
          recommendedModel={DEFAULT_AI_MODEL.insightsModel}
        />
      </SettingRow>

      <SettingRow
        label="Record Model"
        description="Used for medical record generation."
      >
        <ModelSelector
          value={aiModel.recordModel}
          onValueChange={setRecordModel}
          recommendedModel={DEFAULT_AI_MODEL.recordModel}
        />
      </SettingRow>

      <SettingRow
        label="DDx Model"
        description="Used for differential diagnosis."
      >
        <ModelSelector
          value={aiModel.ddxModel}
          onValueChange={setDdxModel}
          recommendedModel={DEFAULT_AI_MODEL.ddxModel}
        />
      </SettingRow>

      <SettingRow
        label="Research Model"
        description="Used for medical research."
      >
        <ModelSelector
          value={aiModel.researchModel}
          onValueChange={setResearchModel}
          recommendedModel={DEFAULT_AI_MODEL.researchModel}
        />
      </SettingRow>

      <SettingRow
        label="Speaker Identification Model"
        description="Used for identifying doctor/patient speakers."
      >
        <ModelSelector
          value={aiModel.speakerIdModel}
          onValueChange={setSpeakerIdModel}
          recommendedModel={DEFAULT_AI_MODEL.speakerIdModel}
        />
      </SettingRow>

      <SettingRow
        label="Diagnostic Keywords Model"
        description="Used for extracting diagnostic keywords."
      >
        <ModelSelector
          value={aiModel.diagnosticKeywordsModel}
          onValueChange={setDiagnosticKeywordsModel}
          recommendedModel={DEFAULT_AI_MODEL.diagnosticKeywordsModel}
        />
      </SettingRow>

      <SettingRow
        label="Clinical Support Model"
        description="Used for clinical decision support on diagnoses."
      >
        <ModelSelector
          value={aiModel.clinicalSupportModel}
          onValueChange={setClinicalSupportModel}
          recommendedModel={DEFAULT_AI_MODEL.clinicalSupportModel}
        />
      </SettingRow>

      <SettingRow
        label="AI Doctor Model"
        description="Used for AI doctor consultations."
      >
        <ModelSelector
          value={aiModel.aiDoctorModel}
          onValueChange={setAiDoctorModel}
          recommendedModel={DEFAULT_AI_MODEL.aiDoctorModel}
        />
      </SettingRow>

      <SettingRow
        label="FHIR Mapping Model"
        description="Used to convert clinical data into FHIR R4 resources for EMR/EHR export."
      >
        <ModelSelector
          value={aiModel.medplumModel}
          onValueChange={setMedplumModel}
          recommendedModel={DEFAULT_AI_MODEL.medplumModel}
        />
      </SettingRow>
    </div>
  )
}

const INSTRUCTION_FIELDS = [
  {
    key: "insights" as const,
    label: "Live Insights",
    description: "Custom instructions for real-time clinical insight generation.",
    placeholder:
      "e.g., Always highlight medication interactions. Focus on pediatric considerations. Summarize in bullet points.",
  },
  {
    key: "ddx" as const,
    label: "Differential Dx",
    description: "Custom instructions for differential diagnosis generation.",
    placeholder:
      "e.g., Prioritize rare diseases when common ones are ruled out. Always include ICD codes. Consider autoimmune conditions.",
  },
  {
    key: "record" as const,
    label: "Consultation Record",
    description: "Custom instructions for medical record generation.",
    placeholder:
      "e.g., Use SOAP format strictly. Include detailed ROS. Always document allergies prominently.",
  },
  {
    key: "research" as const,
    label: "Research",
    description: "Custom instructions for medical research assistance.",
    placeholder:
      "e.g., Focus on recent studies (last 5 years). Prefer systematic reviews and meta-analyses. Include dosage recommendations.",
  },
]

function CustomInstructionsSettings() {
  const {
    customInstructions,
    setInsightsInstructions,
    setDdxInstructions,
    setRecordInstructions,
    setResearchInstructions,
  } = useSettingsStore()

  const setters = {
    insights: setInsightsInstructions,
    ddx: setDdxInstructions,
    record: setRecordInstructions,
    research: setResearchInstructions,
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Add custom instructions for each AI feature. These will be included in
        every request to guide the AI&apos;s behavior.
      </p>

      {INSTRUCTION_FIELDS.map((field) => (
        <div key={field.key} className="space-y-2">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">{field.label}</Label>
            <p className="text-xs text-muted-foreground">
              {field.description}
            </p>
          </div>
          <Textarea
            value={customInstructions[field.key]}
            onChange={(e) => setters[field.key](e.target.value)}
            placeholder={field.placeholder}
            className="min-h-[80px] resize-y text-sm"
          />
        </div>
      ))}
    </div>
  )
}

function ConnectorsSettings() {
  const { connectors, toggleConnector } = useConnectorStore()

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Enable external medical databases for evidence-based diagnosis support.
      </p>

      {CONNECTORS.map((connector) => (
        <SettingRow
          key={connector.key}
          label={connector.label}
          description={connector.description}
        >
          <Switch
            id={`connector-${connector.key}`}
            checked={connectors[connector.key]}
            onCheckedChange={() => toggleConnector(connector.key)}
          />
        </SettingRow>
      ))}
    </div>
  )
}

function ResetToDefaultsButton() {
  const { setTheme: setNextTheme } = useTheme()

  const handleReset = () => {
    useSettingsStore.getState().resetToDefaults()
    useConnectorStore.getState().reset()
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
          <span>Reset to Defaults</span>
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset to Defaults</AlertDialogTitle>
          <AlertDialogDescription>
            All settings will be restored to their default values. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset}>Reset</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function EMRSettings() {
  const { emr, setEmrProvider } = useSettingsStore()

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Select which Electronic Medical Record (EMR/EHR) system to use for
        exporting clinical data as FHIR resources.
      </p>

      <SettingRow
        label="EMR Provider"
        description="The EMR/EHR system that receives exported FHIR data."
      >
        <Select value={emr.provider} onValueChange={setEmrProvider}>
          <SelectTrigger className="w-[200px] text-xs">
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
        Adjust settings for improved readability and interaction. These
        preferences are saved locally and apply immediately.
      </p>

      <SettingRow
        label="Reduced Motion"
        description="Disable animations and transitions throughout the interface."
      >
        <Switch
          checked={accessibility.reducedMotion}
          onCheckedChange={setReducedMotion}
        />
      </SettingRow>

      <SettingRow
        label="High Contrast"
        description="Increase text and border contrast for better readability."
      >
        <Switch
          checked={accessibility.highContrast}
          onCheckedChange={setHighContrast}
        />
      </SettingRow>

      <SettingRow
        label="Enhanced Focus Indicators"
        description="Show larger, more visible focus rings when navigating with keyboard."
      >
        <Switch
          checked={accessibility.enhancedFocusIndicators}
          onCheckedChange={setEnhancedFocusIndicators}
        />
      </SettingRow>

      <SettingRow
        label="Text Spacing"
        description="Increase line height, letter spacing, and word spacing for easier reading."
      >
        <Switch
          checked={accessibility.textSpacing}
          onCheckedChange={setTextSpacing}
        />
      </SettingRow>

      <SettingRow
        label="Large Click Targets"
        description="Enforce minimum 44px touch targets on all interactive elements."
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
        label="Theme"
        description="Select the color theme for the interface."
      >
        <Select value={appearance.theme} onValueChange={handleThemeChange}>
          <SelectTrigger className="w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label="Font Size"
        description="Adjust the text size across the interface."
      >
        <Select value={appearance.fontSize} onValueChange={handleFontSizeChange}>
          <SelectTrigger className="w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label="UI Density"
        description="Control the spacing and padding of interface elements."
      >
        <Select value={appearance.uiDensity} onValueChange={handleUiDensityChange}>
          <SelectTrigger className="w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UI_DENSITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>

      <SettingRow
        label="Border Radius"
        description="Set the corner roundness for UI elements."
      >
        <Select value={appearance.borderRadius} onValueChange={handleBorderRadiusChange}>
          <SelectTrigger className="w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BORDER_RADIUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingRow>
    </div>
  )
}

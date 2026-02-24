import { create } from "zustand"
import { persist } from "zustand/middleware"

const CLAUDE_SONNET_45_MODEL = "claude-sonnet-4-5-20250929"
const CLAUDE_SONNET_46_MODEL = "claude-sonnet-4-6"

export const NOVA3_LANGUAGES = [
  { value: "multi", label: "Multilingual (Auto-detect)" },
  { value: "en", label: "English (Recommended)" },
  { value: "en-US", label: "English (US) (Recommended)" },
  { value: "en-GB", label: "English (UK) (Recommended)" },
  { value: "en-AU", label: "English (Australia) (Recommended)" },
  { value: "en-IN", label: "English (India) (Recommended)" },
  { value: "en-NZ", label: "English (New Zealand) (Recommended)" },
  { value: "ko", label: "한국어" },
  { value: "ko-KR", label: "한국어 (대한민국)" },
  { value: "ja", label: "日本語" },
  { value: "es", label: "Español" },
  { value: "es-419", label: "Español (Latinoamérica)" },
  { value: "fr", label: "Français" },
  { value: "fr-CA", label: "Français (Canada)" },
  { value: "de", label: "Deutsch" },
  { value: "de-CH", label: "Deutsch (Schweiz)" },
  { value: "pt", label: "Português" },
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "it", label: "Italiano" },
  { value: "nl", label: "Nederlands" },
  { value: "nl-BE", label: "Vlaams" },
  { value: "ru", label: "Русский" },
  { value: "hi", label: "हिन्दी" },
  { value: "ar", label: "العربية" },
  { value: "tr", label: "Türkçe" },
  { value: "pl", label: "Polski" },
  { value: "sv", label: "Svenska" },
  { value: "da", label: "Dansk" },
  { value: "no", label: "Norsk" },
  { value: "fi", label: "Suomi" },
  { value: "id", label: "Bahasa Indonesia" },
  { value: "vi", label: "Tiếng Việt" },
  { value: "uk", label: "Українська" },
  { value: "cs", label: "Čeština" },
  { value: "ro", label: "Română" },
  { value: "hu", label: "Magyar" },
  { value: "el", label: "Ελληνικά" },
  { value: "he", label: "עברית" },
  { value: "fa", label: "فارسی" },
  { value: "ta", label: "தமிழ்" },
  { value: "te", label: "తెలుగు" },
  { value: "bn", label: "বাংলা" },
  { value: "ur", label: "اردو" },
  { value: "mr", label: "मराठी" },
  { value: "kn", label: "ಕನ್ನಡ" },
  { value: "ms", label: "Bahasa Melayu" },
  { value: "tl", label: "Tagalog" },
  { value: "bg", label: "Български" },
  { value: "hr", label: "Hrvatski" },
  { value: "sr", label: "Српски" },
  { value: "sk", label: "Slovenčina" },
  { value: "sl", label: "Slovenščina" },
  { value: "lt", label: "Lietuvių" },
  { value: "lv", label: "Latviešu" },
  { value: "et", label: "Eesti" },
  { value: "ca", label: "Català" },
  { value: "bs", label: "Bosanski" },
  { value: "mk", label: "Македонски" },
  { value: "be", label: "Беларуская" },
] as const

export const AI_MODELS = [
  { value: "grok-4-1-fast-non-reasoning", label: "Grok 4.1 Fast" },
  { value: "grok-4-1-fast", label: "Grok 4.1 Fast Reasoning" },
  { value: "claude-opus-4-6", label: "Claude Opus 4.6" },
  { value: CLAUDE_SONNET_46_MODEL, label: "Claude Sonnet 4.6" },
  { value: "gpt-5.2", label: "GPT-5.2" },
] as const

export const EMR_PROVIDERS = [
  { value: "medplum" as const, label: "Medplum" },
] as const

export const FONT_SIZE_OPTIONS = [
  { value: "small" as const, label: "Small" },
  { value: "default" as const, label: "Default" },
  { value: "large" as const, label: "Large" },
  { value: "extra-large" as const, label: "Extra Large" },
] as const

export const UI_DENSITY_OPTIONS = [
  { value: "compact" as const, label: "Compact" },
  { value: "default" as const, label: "Default" },
  { value: "comfortable" as const, label: "Comfortable" },
] as const

export const BORDER_RADIUS_OPTIONS = [
  { value: "none" as const, label: "None" },
  { value: "small" as const, label: "Small" },
  { value: "default" as const, label: "Default" },
  { value: "large" as const, label: "Large" },
] as const

export type FontSize = (typeof FONT_SIZE_OPTIONS)[number]["value"]
export type UiDensity = (typeof UI_DENSITY_OPTIONS)[number]["value"]
export type BorderRadius = (typeof BORDER_RADIUS_OPTIONS)[number]["value"]

interface SttSettings {
  language: string
  smartFormat: boolean
  diarize: boolean
}

interface AudioSettings {
  noiseSuppression: boolean
  echoCancellation: boolean
  endpointing: number
  utteranceEndMs: number
}

interface AnalysisSettings {
  insightsMinWords: number
  insightsMinInterval: number
  ddxMinWords: number
  ddxMinInterval: number
}

interface AiModelSettings {
  insightsModel: string
  recordModel: string
  patientHandoutModel: string
  ddxModel: string
  researchModel: string
  speakerIdModel: string
  diagnosticKeywordsModel: string
  clinicalSupportModel: string
  aiDoctorModel: string
  medplumModel: string
}

const AI_MODEL_KEYS: (keyof AiModelSettings)[] = [
  "insightsModel",
  "recordModel",
  "patientHandoutModel",
  "ddxModel",
  "researchModel",
  "speakerIdModel",
  "diagnosticKeywordsModel",
  "clinicalSupportModel",
  "aiDoctorModel",
  "medplumModel",
]

function normalizeAiModelSettings(
  aiModel: Partial<AiModelSettings> | undefined
): Partial<AiModelSettings> | undefined {
  if (!aiModel) return aiModel

  const normalized: Partial<AiModelSettings> = { ...aiModel }
  for (const key of AI_MODEL_KEYS) {
    if (normalized[key] === CLAUDE_SONNET_45_MODEL) {
      normalized[key] = CLAUDE_SONNET_46_MODEL
    }
  }
  return normalized
}

interface CustomInstructionsSettings {
  insights: string
  ddx: string
  record: string
  research: string
  patientHandout: string
}

interface EmrSettings {
  provider: (typeof EMR_PROVIDERS)[number]["value"]
}

interface AppearanceSettings {
  theme: "light" | "dark" | "system"
  fontSize: FontSize
  uiDensity: UiDensity
  borderRadius: BorderRadius
}

interface AccessibilitySettings {
  reducedMotion: boolean
  highContrast: boolean
  enhancedFocusIndicators: boolean
  textSpacing: boolean
  largeClickTargets: boolean
}

export type SettingsPage =
  | "speech"
  | "analysis"
  | "models"
  | "instructions"
  | "appearance"
  | "connectors"
  | "emr"
  | "accessibility"

interface SettingsDialogState {
  open: boolean
  activePage: SettingsPage
  openSettings: (page?: SettingsPage) => void
  closeSettings: () => void
}

export const useSettingsDialogStore = create<SettingsDialogState>((set) => ({
  open: false,
  activePage: "speech",
  openSettings: (page = "speech") => set({ open: true, activePage: page }),
  closeSettings: () => set({ open: false }),
}))

interface SettingsState {
  stt: SttSettings
  audio: AudioSettings
  analysis: AnalysisSettings
  aiModel: AiModelSettings
  customInstructions: CustomInstructionsSettings
  emr: EmrSettings
  appearance: AppearanceSettings
  accessibility: AccessibilitySettings
  setSttLanguage: (language: string) => void
  setSttSmartFormat: (enabled: boolean) => void
  setSttDiarize: (enabled: boolean) => void
  setNoiseSuppression: (enabled: boolean) => void
  setEchoCancellation: (enabled: boolean) => void
  setEndpointing: (ms: number) => void
  setUtteranceEndMs: (ms: number) => void
  setInsightsMinWords: (words: number) => void
  setInsightsMinInterval: (ms: number) => void
  setDdxMinWords: (words: number) => void
  setDdxMinInterval: (ms: number) => void
  setInsightsModel: (model: string) => void
  setRecordModel: (model: string) => void
  setPatientHandoutModel: (model: string) => void
  setDdxModel: (model: string) => void
  setResearchModel: (model: string) => void
  setSpeakerIdModel: (model: string) => void
  setDiagnosticKeywordsModel: (model: string) => void
  setClinicalSupportModel: (model: string) => void
  setAiDoctorModel: (model: string) => void
  setMedplumModel: (model: string) => void
  setInsightsInstructions: (instructions: string) => void
  setDdxInstructions: (instructions: string) => void
  setRecordInstructions: (instructions: string) => void
  setResearchInstructions: (instructions: string) => void
  setPatientHandoutInstructions: (instructions: string) => void
  setEmrProvider: (provider: EmrSettings["provider"]) => void
  setTheme: (theme: "light" | "dark" | "system") => void
  setFontSize: (fontSize: FontSize) => void
  setUiDensity: (uiDensity: UiDensity) => void
  setBorderRadius: (borderRadius: BorderRadius) => void
  setReducedMotion: (enabled: boolean) => void
  setHighContrast: (enabled: boolean) => void
  setEnhancedFocusIndicators: (enabled: boolean) => void
  setTextSpacing: (enabled: boolean) => void
  setLargeClickTargets: (enabled: boolean) => void
  resetToDefaults: () => void
}

const DEFAULT_STT: SttSettings = {
  language: "en",
  smartFormat: true,
  diarize: true,
}

const DEFAULT_AUDIO: AudioSettings = {
  noiseSuppression: true,
  echoCancellation: true,
  endpointing: 600,
  utteranceEndMs: 1800,
}

const DEFAULT_ANALYSIS: AnalysisSettings = {
  insightsMinWords: 30,
  insightsMinInterval: 12000,
  ddxMinWords: 50,
  ddxMinInterval: 20000,
}

const DEFAULT_AI_MODEL: AiModelSettings = {
  insightsModel: "grok-4-1-fast-non-reasoning",
  recordModel: "grok-4-1-fast-non-reasoning",
  patientHandoutModel: "grok-4-1-fast-non-reasoning",
  ddxModel: "grok-4-1-fast-non-reasoning",
  researchModel: "grok-4-1-fast-non-reasoning",
  speakerIdModel: "grok-4-1-fast-non-reasoning",
  diagnosticKeywordsModel: "grok-4-1-fast-non-reasoning",
  clinicalSupportModel: "grok-4-1-fast-non-reasoning",
  aiDoctorModel: "grok-4-1-fast-non-reasoning",
  medplumModel: "grok-4-1-fast-non-reasoning",
}

export { DEFAULT_AI_MODEL }

const DEFAULT_CUSTOM_INSTRUCTIONS: CustomInstructionsSettings = {
  insights: "",
  ddx: "",
  record: "",
  research: "",
  patientHandout: "",
}

const DEFAULT_EMR: EmrSettings = {
  provider: "medplum",
}

const DEFAULT_APPEARANCE: AppearanceSettings = {
  theme: "system",
  fontSize: "default",
  uiDensity: "default",
  borderRadius: "default",
}

const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  reducedMotion: false,
  highContrast: false,
  enhancedFocusIndicators: false,
  textSpacing: false,
  largeClickTargets: false,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      stt: { ...DEFAULT_STT },
      audio: { ...DEFAULT_AUDIO },
      analysis: { ...DEFAULT_ANALYSIS },
      aiModel: { ...DEFAULT_AI_MODEL },
      customInstructions: { ...DEFAULT_CUSTOM_INSTRUCTIONS },
      emr: { ...DEFAULT_EMR },
      appearance: { ...DEFAULT_APPEARANCE },
      accessibility: { ...DEFAULT_ACCESSIBILITY },

      setSttLanguage: (language) =>
        set((state) => ({ stt: { ...state.stt, language } })),
      setSttSmartFormat: (smartFormat) =>
        set((state) => ({ stt: { ...state.stt, smartFormat } })),
      setSttDiarize: (diarize) =>
        set((state) => ({ stt: { ...state.stt, diarize } })),

      setNoiseSuppression: (noiseSuppression) =>
        set((state) => ({ audio: { ...state.audio, noiseSuppression } })),
      setEchoCancellation: (echoCancellation) =>
        set((state) => ({ audio: { ...state.audio, echoCancellation } })),
      setEndpointing: (endpointing) =>
        set((state) => ({ audio: { ...state.audio, endpointing } })),
      setUtteranceEndMs: (utteranceEndMs) =>
        set((state) => ({ audio: { ...state.audio, utteranceEndMs } })),

      setInsightsMinWords: (insightsMinWords) =>
        set((state) => ({ analysis: { ...state.analysis, insightsMinWords } })),
      setInsightsMinInterval: (insightsMinInterval) =>
        set((state) => ({ analysis: { ...state.analysis, insightsMinInterval } })),
      setDdxMinWords: (ddxMinWords) =>
        set((state) => ({ analysis: { ...state.analysis, ddxMinWords } })),
      setDdxMinInterval: (ddxMinInterval) =>
        set((state) => ({ analysis: { ...state.analysis, ddxMinInterval } })),

      setInsightsModel: (insightsModel) =>
        set((state) => ({ aiModel: { ...state.aiModel, insightsModel } })),
      setRecordModel: (recordModel) =>
        set((state) => ({ aiModel: { ...state.aiModel, recordModel } })),
      setPatientHandoutModel: (patientHandoutModel) =>
        set((state) => ({ aiModel: { ...state.aiModel, patientHandoutModel } })),
      setDdxModel: (ddxModel) =>
        set((state) => ({ aiModel: { ...state.aiModel, ddxModel } })),
      setResearchModel: (researchModel) =>
        set((state) => ({ aiModel: { ...state.aiModel, researchModel } })),
      setSpeakerIdModel: (speakerIdModel) =>
        set((state) => ({ aiModel: { ...state.aiModel, speakerIdModel } })),
      setDiagnosticKeywordsModel: (diagnosticKeywordsModel) =>
        set((state) => ({ aiModel: { ...state.aiModel, diagnosticKeywordsModel } })),
      setClinicalSupportModel: (clinicalSupportModel) =>
        set((state) => ({ aiModel: { ...state.aiModel, clinicalSupportModel } })),
      setAiDoctorModel: (aiDoctorModel) =>
        set((state) => ({ aiModel: { ...state.aiModel, aiDoctorModel } })),
      setMedplumModel: (medplumModel) =>
        set((state) => ({ aiModel: { ...state.aiModel, medplumModel } })),

      setInsightsInstructions: (insights) =>
        set((state) => ({ customInstructions: { ...state.customInstructions, insights } })),
      setDdxInstructions: (ddx) =>
        set((state) => ({ customInstructions: { ...state.customInstructions, ddx } })),
      setRecordInstructions: (record) =>
        set((state) => ({ customInstructions: { ...state.customInstructions, record } })),
      setResearchInstructions: (research) =>
        set((state) => ({ customInstructions: { ...state.customInstructions, research } })),
      setPatientHandoutInstructions: (patientHandout) =>
        set((state) => ({
          customInstructions: { ...state.customInstructions, patientHandout },
        })),

      setEmrProvider: (provider) =>
        set((state) => ({ emr: { ...state.emr, provider } })),

      setTheme: (theme) =>
        set((state) => ({ appearance: { ...state.appearance, theme } })),
      setFontSize: (fontSize) =>
        set((state) => ({ appearance: { ...state.appearance, fontSize } })),
      setUiDensity: (uiDensity) =>
        set((state) => ({ appearance: { ...state.appearance, uiDensity } })),
      setBorderRadius: (borderRadius) =>
        set((state) => ({ appearance: { ...state.appearance, borderRadius } })),

      setReducedMotion: (reducedMotion) =>
        set((state) => ({ accessibility: { ...state.accessibility, reducedMotion } })),
      setHighContrast: (highContrast) =>
        set((state) => ({ accessibility: { ...state.accessibility, highContrast } })),
      setEnhancedFocusIndicators: (enhancedFocusIndicators) =>
        set((state) => ({ accessibility: { ...state.accessibility, enhancedFocusIndicators } })),
      setTextSpacing: (textSpacing) =>
        set((state) => ({ accessibility: { ...state.accessibility, textSpacing } })),
      setLargeClickTargets: (largeClickTargets) =>
        set((state) => ({ accessibility: { ...state.accessibility, largeClickTargets } })),

      resetToDefaults: () =>
        set({
          stt: { ...DEFAULT_STT },
          audio: { ...DEFAULT_AUDIO },
          analysis: { ...DEFAULT_ANALYSIS },
          aiModel: { ...DEFAULT_AI_MODEL },
          customInstructions: { ...DEFAULT_CUSTOM_INSTRUCTIONS },
          emr: { ...DEFAULT_EMR },
          appearance: { ...DEFAULT_APPEARANCE },
          accessibility: { ...DEFAULT_ACCESSIBILITY },
        }),
    }),
    {
      name: "rxly-settings",
      merge: (persisted, current) => {
        const p = persisted as Partial<SettingsState> | undefined
        const normalizedAiModel = normalizeAiModelSettings(p?.aiModel)
        return {
          ...current,
          ...p,
          stt: { ...current.stt, ...p?.stt },
          audio: { ...current.audio, ...p?.audio },
          analysis: { ...current.analysis, ...p?.analysis },
          aiModel: { ...current.aiModel, ...normalizedAiModel },
          customInstructions: { ...current.customInstructions, ...p?.customInstructions },
          emr: { ...current.emr, ...p?.emr },
          appearance: { ...current.appearance, ...p?.appearance },
          accessibility: { ...current.accessibility, ...p?.accessibility },
        }
      },
    }
  )
)

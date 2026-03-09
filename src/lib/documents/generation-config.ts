import type {
  DocumentClinicalContextMode,
  DocumentGenerationConfig,
  SessionDocumentGenerationInputs,
} from "@/types/document"

export const DEFAULT_DOCUMENT_GENERATION_CONFIG: DocumentGenerationConfig = {
  clinicalContextDefault: "insights",
  includeSourceImages: false,
  systemInstructions: "",
  emptyValuePolicy: "BLANK",
  generationRequirements: [],
}

export function createDocumentGenerationConfig(
  overrides: Partial<DocumentGenerationConfig> = {}
): DocumentGenerationConfig {
  return {
    ...DEFAULT_DOCUMENT_GENERATION_CONFIG,
    ...overrides,
    generationRequirements: [
      ...(overrides.generationRequirements ??
        DEFAULT_DOCUMENT_GENERATION_CONFIG.generationRequirements),
    ],
  }
}

export function createEmptySessionDocumentGenerationInputs(): SessionDocumentGenerationInputs {
  return {
    clinicalContextMode: null,
    confirmedDiagnoses: [],
  }
}

export function resolveClinicalContextMode(args: {
  generationConfig: Pick<DocumentGenerationConfig, "clinicalContextDefault">
  generationInputs?: Pick<SessionDocumentGenerationInputs, "clinicalContextMode"> | null
}): DocumentClinicalContextMode {
  return (
    args.generationInputs?.clinicalContextMode ??
    args.generationConfig.clinicalContextDefault
  )
}

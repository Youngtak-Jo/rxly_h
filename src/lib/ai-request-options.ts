interface GenerationOptionInput {
  temperature?: number
  maxOutputTokens?: number
}

/**
 * Centralizes model-specific request option normalization.
 * Some model families reject certain sampling controls, so we omit them here.
 */
export function buildGenerationOptions(
  modelId: string,
  input: GenerationOptionInput
): GenerationOptionInput {
  const options: GenerationOptionInput = {}

  if (typeof input.maxOutputTokens === "number") {
    options.maxOutputTokens = input.maxOutputTokens
  }

  // GPT-5 family currently works best with provider defaults for temperature.
  if (typeof input.temperature === "number" && !modelId.startsWith("gpt-5")) {
    options.temperature = input.temperature
  }

  return options
}

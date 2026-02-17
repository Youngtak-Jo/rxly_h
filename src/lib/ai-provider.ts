import { xai } from "@/lib/xai"
import { anthropic } from "@/lib/anthropic"
import { openai } from "@/lib/openai"

export class UnsupportedModelError extends Error {
  constructor(modelId: string) {
    super(`Unsupported model id: ${modelId}`)
    this.name = "UnsupportedModelError"
  }
}

export function isSupportedModel(modelId: string) {
  return (
    modelId.startsWith("claude-") ||
    modelId.startsWith("grok-") ||
    modelId.startsWith("gpt-")
  )
}

export function assertSupportedModel(modelId: string) {
  if (!isSupportedModel(modelId)) {
    throw new UnsupportedModelError(modelId)
  }
}

export function getModel(modelId: string) {
  assertSupportedModel(modelId)
  if (modelId.startsWith("claude-")) return anthropic(modelId)
  if (modelId.startsWith("grok-")) return xai(modelId)
  return openai(modelId)
}

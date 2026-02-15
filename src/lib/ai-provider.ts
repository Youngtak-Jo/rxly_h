import { xai } from "@/lib/xai"
import { anthropic } from "@/lib/anthropic"

export function getModel(modelId: string) {
  if (modelId.startsWith("claude-")) return anthropic(modelId)
  return xai(modelId)
}

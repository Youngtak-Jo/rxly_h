import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export interface AiUsageStats {
  inputTokens?: number | null
  outputTokens?: number | null
}

interface AiTelemetryContext {
  userId: string
  sessionId?: string | null
  feature: string
  model: string
  requestId?: string | null
}

interface AiTelemetryResult<T> {
  result: T
  usage?: AiUsageStats
}

const PRICE_PER_MILLION_TOKENS: Record<string, { input: number; output: number }> = {
  "gpt-5.2": { input: 2.5, output: 10 },
  "grok-4-1-fast-non-reasoning": { input: 1.5, output: 5 },
  "grok-4-1-fast": { input: 1.5, output: 5 },
  "claude-opus-4-6": { input: 15, output: 75 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-sonnet-4-5-20250929": { input: 3, output: 15 },
}

function detectProvider(model: string): string {
  if (model.startsWith("claude-")) return "anthropic"
  if (model.startsWith("grok-")) return "xai"
  if (model.startsWith("gpt-")) return "openai"
  return "unknown"
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "bigint") return Number(value)
  return null
}

function normalizeUsage(usage?: AiUsageStats): { inputTokens: number | null; outputTokens: number | null } {
  const inputTokens = toNumber(usage?.inputTokens) ?? null
  const outputTokens = toNumber(usage?.outputTokens) ?? null
  return { inputTokens, outputTokens }
}

function estimateCostUsd(model: string, inputTokens: number | null, outputTokens: number | null): number | null {
  const price = PRICE_PER_MILLION_TOKENS[model]
  if (!price || (inputTokens == null && outputTokens == null)) return null

  const inCost = inputTokens != null ? (inputTokens / 1_000_000) * price.input : 0
  const outCost = outputTokens != null ? (outputTokens / 1_000_000) * price.output : 0
  return Number((inCost + outCost).toFixed(8))
}

export async function logAiUsageEvent(
  context: AiTelemetryContext,
  options: {
    status: "success" | "error"
    latencyMs: number
    usage?: AiUsageStats
    errorCode?: string | null
  }
): Promise<void> {
  const { inputTokens, outputTokens } = normalizeUsage(options.usage)
  const costUsd = estimateCostUsd(context.model, inputTokens, outputTokens)

  try {
    await prisma.aiUsageEvent.create({
      data: {
        userId: context.userId,
        sessionId: context.sessionId ?? null,
        feature: context.feature,
        provider: detectProvider(context.model),
        model: context.model,
        requestId: context.requestId ?? null,
        inputTokens,
        outputTokens,
        latencyMs: Math.max(0, Math.round(options.latencyMs)),
        costUsd,
        status: options.status,
        errorCode: options.errorCode ?? null,
      },
    })
  } catch (error) {
    logger.error("Failed to write ai_usage_event", {
      error: error instanceof Error ? error.message : String(error),
      feature: context.feature,
      model: context.model,
    })
  }
}

export async function withAiTelemetry<T>(
  context: AiTelemetryContext,
  runner: () => Promise<AiTelemetryResult<T>>
): Promise<T> {
  const startedAt = Date.now()

  try {
    const { result, usage } = await runner()

    void logAiUsageEvent(context, {
      status: "success",
      latencyMs: Date.now() - startedAt,
      usage,
    })

    return result
  } catch (error) {
    void logAiUsageEvent(context, {
      status: "error",
      latencyMs: Date.now() - startedAt,
      errorCode: error instanceof Error ? error.name : "UnknownError",
    })
    throw error
  }
}

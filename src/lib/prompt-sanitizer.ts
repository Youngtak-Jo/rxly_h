const MAX_CUSTOM_INSTRUCTIONS_LENGTH = 2000

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /disregard\s+(all\s+)?prior\s+(instructions|prompts)/i,
  /forget\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
  /you\s+are\s+now\s+a/i,
  /new\s+system\s*prompt/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /<\|im_start\|>/i,
  /<<SYS>>/i,
  /---\s*END\s+(CUSTOM\s+INSTRUCTIONS|DOCTOR'S\s+CUSTOM)/i,
]

/**
 * Sanitizes user-provided custom instructions before including them in AI prompts.
 * Returns null if the input is empty or contains injection patterns.
 */
export function sanitizeCustomInstructions(input: string | undefined | null): string | null {
  if (!input?.trim()) return null

  const sanitized = input.trim().slice(0, MAX_CUSTOM_INSTRUCTIONS_LENGTH)

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      return null
    }
  }

  return sanitized
}

/**
 * Builds a system prompt with optional sanitized custom instructions.
 */
export function buildSystemPrompt(basePrompt: string, customInstructions: string | undefined | null): string {
  const safe = sanitizeCustomInstructions(customInstructions)
  if (!safe) return basePrompt

  return `${basePrompt}\n\n--- DOCTOR'S CUSTOM INSTRUCTIONS (clinical preferences only) ---\n${safe}\n--- END CUSTOM INSTRUCTIONS ---`
}

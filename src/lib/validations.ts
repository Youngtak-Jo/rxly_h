import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required").max(128),
})

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
  confirmPassword: z.string(),
})

export const sessionPatchSchema = z.object({
  title: z.string().max(200).optional(),
  patientName: z.string().max(200).nullable().optional(),
  mode: z.enum(["DOCTOR", "AI_DOCTOR"]).optional(),
})

export const noteCreateSchema = z.object({
  content: z.string().max(50000).default(""),
  imageUrls: z.array(z.string().url()).max(20).default([]),
  storagePaths: z.array(z.string()).max(20).default([]),
  source: z.enum(["MANUAL", "STT", "IMAGE"]).default("MANUAL"),
})

export const checklistCreateSchema = z.object({
  label: z.string().min(1).max(500),
  isChecked: z.boolean().default(false),
  isAutoChecked: z.boolean().default(false),
  doctorNote: z.string().max(1000).nullable().optional(),
  source: z.enum(["AI", "MANUAL"]).default("MANUAL"),
})

export const checklistPatchSchema = z.object({
  itemId: z.string().min(1),
  isChecked: z.boolean().optional(),
  isAutoChecked: z.boolean().optional(),
  doctorNote: z.string().max(1000).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

const insightsChecklistItemSchema = z.object({
  id: z.string().min(1).optional(),
  label: z.string().min(1).max(500),
  isChecked: z.boolean().default(false),
  isAutoChecked: z.boolean().default(false),
  doctorNote: z.string().max(1000).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  source: z.enum(["AI", "MANUAL"]).default("AI"),
})

export const insightsUpdateSchema = z.object({
  summary: z.string().max(50000).optional(),
  keyFindings: z.array(z.string()).max(200).optional(),
  redFlags: z.array(z.string()).max(200).optional(),
  diagnosticKeywords: z.array(z.unknown()).optional(),
  checklistItems: z.array(insightsChecklistItemSchema).max(500).optional(),
})

export const diagnosesUpdateSchema = z.object({
  diagnoses: z.array(z.object({
    id: z.string().min(1).optional(),
    icdCode: z.string().max(20),
    icdUri: z.string().nullable().optional(),
    diseaseName: z.string().max(500),
    confidence: z.string(),
    evidence: z.string().max(10000),
    citations: z.array(z.unknown()).default([]),
    sortOrder: z.number().int().min(0).optional(),
  })).max(50),
})

/**
 * Safely parse JSON from AI model responses, stripping markdown code fences.
 * Returns the parsed value or null if parsing fails.
 */
export function safeParseAIJson<T = unknown>(text: string): { data: T; error: null } | { data: null; error: string } {
  const parseCandidate = (candidate: string): T | null => {
    try {
      return JSON.parse(candidate) as T
    } catch {
      return null
    }
  }

  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim()

  const direct = parseCandidate(cleaned)
  if (direct !== null) return { data: direct, error: null }

  // Try to parse fenced JSON block content anywhere in the response.
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text)
  if (fenced?.[1]) {
    const parsedFence = parseCandidate(fenced[1].trim())
    if (parsedFence !== null) return { data: parsedFence, error: null }
  }

  // Fallback: extract first balanced JSON object/array from noisy output.
  const extractBalancedJson = (input: string): string | null => {
    const opens = new Set(["{", "["])
    const closes: Record<string, string> = { "{": "}", "[": "]" }
    const matching: Record<string, string> = { "}": "{", "]": "[" }

    for (let i = 0; i < input.length; i++) {
      const start = input[i]
      if (!opens.has(start)) continue

      const stack: string[] = [start]
      let inString = false
      let escaped = false

      for (let j = i + 1; j < input.length; j++) {
        const ch = input[j]

        if (inString) {
          if (escaped) {
            escaped = false
            continue
          }
          if (ch === "\\") {
            escaped = true
            continue
          }
          if (ch === "\"") {
            inString = false
          }
          continue
        }

        if (ch === "\"") {
          inString = true
          continue
        }

        if (opens.has(ch)) {
          stack.push(ch)
          continue
        }

        if (ch === "}" || ch === "]") {
          const top = stack[stack.length - 1]
          if (!top || matching[ch] !== top) {
            break
          }
          stack.pop()
          if (stack.length === 0) {
            return input.slice(i, j + 1)
          }
          continue
        }

        if (ch === closes[start]) {
          // Covered by close handling above, left intentionally for readability.
          continue
        }
      }
    }

    return null
  }

  const extracted = extractBalancedJson(text)
  if (extracted) {
    const parsedExtracted = parseCandidate(extracted)
    if (parsedExtracted !== null) return { data: parsedExtracted, error: null }
  }

  return { data: null, error: "AI returned invalid JSON response" }
}

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

export const diagnosesUpdateSchema = z.object({
  diagnoses: z.array(z.object({
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
  try {
    const cleaned = text
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "")
      .trim()
    return { data: JSON.parse(cleaned) as T, error: null }
  } catch {
    return { data: null, error: "AI returned invalid JSON response" }
  }
}

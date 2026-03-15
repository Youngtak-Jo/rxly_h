import { z } from "zod"
import type { UserContent } from "ai"
import { buildSystemPrompt } from "@/lib/prompt-sanitizer"
import { RECORD_SYSTEM_PROMPT } from "@/lib/prompts"

export const RECORD_OUTPUT_SCHEMA = z.object({
  chiefComplaint: z
    .string()
    .nullable()
    .describe("Primary reason for visit in patient's words"),
  hpiText: z
    .string()
    .nullable()
    .describe("Detailed history of present illness narrative"),
  medications: z
    .array(z.string())
    .nullable()
    .describe("Current medications list. Include both prescription and OTC medications."),
  rosText: z.string().nullable().describe("Review of systems findings"),
  pmh: z.string().nullable().describe("Past medical history"),
  socialHistory: z
    .string()
    .nullable()
    .describe("Social history (smoking, alcohol, occupation, etc.)"),
  familyHistory: z.string().nullable().describe("Family medical history"),
  vitals: z
    .object({
      bp: z.string(),
      hr: z.string(),
      temp: z.string(),
      rr: z.string(),
      spo2: z.string(),
    })
    .nullable(),
  physicalExam: z.string().nullable().describe("Physical examination findings"),
  labsStudies: z
    .array(z.string())
    .nullable()
    .describe("Ordered or reviewed labs and studies"),
  assessment: z
    .array(z.string())
    .nullable()
    .describe("Clinical assessment with problem list"),
  plan: z.string().nullable().describe("Treatment plan organized by problem"),
})

export interface RecordGenerationInput {
  transcript?: string
  doctorNotes?: string
  imageUrls?: string[]
  insights?: unknown
  existingRecord?: unknown
  customInstructions?: string
}

export function buildRecordSystemPrompt(customInstructions?: string): string {
  return buildSystemPrompt(RECORD_SYSTEM_PROMPT, customInstructions)
}

export function buildRecordGenerationContent(
  input: RecordGenerationInput
): UserContent {
  const textContent = [
    input.transcript?.trim()
      ? `Transcript:\n${input.transcript}`
      : "Transcript:\n(No speech recorded yet)",
    input.doctorNotes?.trim()
      ? `\nDoctor's notes (inline annotations during consultation):\n${input.doctorNotes}`
      : "",
    input.insights ? `\nCurrent insights:\n${JSON.stringify(input.insights)}` : "",
    input.existingRecord
      ? `\nExisting record to update:\n${JSON.stringify(input.existingRecord)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n")

  const content: UserContent = [{ type: "text", text: textContent }]
  if (input.imageUrls && input.imageUrls.length > 0) {
    const findingsSummary =
      ((input.insights as { keyFindings?: string[] } | undefined)?.keyFindings || []).join(
        "; "
      ) || "None yet"

    content[0] = {
      type: "text",
      text:
        textContent +
        `\n\n--- UPLOADED MEDICAL IMAGES ---\nThe doctor has uploaded ${input.imageUrls.length} medical image(s) during this consultation.\n\nCRITICAL: Analyze each image IN THE CONTEXT of this consultation, not in isolation.\n- Current clinical summary: ${(input.insights as { summary?: string } | undefined)?.summary || "Not yet established"}\n- Key findings: ${findingsSummary}\n\nCorrelate image findings with the patient's presenting complaints, transcript discussion, and doctor's notes.\nIncorporate contextual image findings into: physicalExam, labsStudies, assessment, plan.\n--- END IMAGE INSTRUCTIONS ---`,
    }
    input.imageUrls.forEach((url) => {
      content.push({ type: "image", image: new URL(url) })
    })
  }

  return content
}

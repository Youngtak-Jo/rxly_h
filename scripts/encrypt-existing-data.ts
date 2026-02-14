/**
 * One-time migration script to encrypt existing plaintext PHI data.
 *
 * Usage:
 *   PHI_ENCRYPTION_KEY=your-key-here npx tsx scripts/encrypt-existing-data.ts
 *
 * This script reads all records with PHI fields, encrypts them,
 * and writes them back. The encryption functions are idempotent —
 * already-encrypted data will not be double-encrypted because
 * encryptField checks for the iv:tag:ciphertext format.
 */
import { PrismaClient } from "@prisma/client"
import { encryptField, encryptJson } from "../src/lib/encryption"

const prisma = new PrismaClient()

const PHI_STRING_FIELDS: Record<string, string[]> = {
  session: ["patientName"],
  transcriptEntry: ["text"],
  consultationRecord: [
    "patientName",
    "chiefComplaint",
    "hpiText",
    "medications",
    "rosText",
    "pmh",
    "socialHistory",
    "familyHistory",
    "physicalExam",
    "labsStudies",
    "assessment",
    "plan",
  ],
  insights: ["summary"],
  note: ["content"],
  researchMessage: ["content"],
  diagnosis: ["diseaseName", "evidence"],
}

const PHI_JSON_FIELDS: Record<string, string[]> = {
  insights: ["keyFindings", "redFlags"],
  consultationRecord: ["vitals"],
}

function isAlreadyEncrypted(value: string): boolean {
  const parts = value.split(":")
  return parts.length === 3 && parts.every((p) => p.length > 0)
}

async function encryptTable(
  modelName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any,
  idField = "id"
) {
  const stringFields = PHI_STRING_FIELDS[modelName] || []
  const jsonFields = PHI_JSON_FIELDS[modelName] || []

  if (stringFields.length === 0 && jsonFields.length === 0) return

  console.log(`\nProcessing ${modelName}...`)
  const records = await model.findMany()
  let updated = 0

  for (const record of records) {
    const updates: Record<string, unknown> = {}
    let needsUpdate = false

    for (const field of stringFields) {
      const value = record[field]
      if (typeof value === "string" && value.length > 0 && !isAlreadyEncrypted(value)) {
        updates[field] = encryptField(value)
        needsUpdate = true
      }
    }

    for (const field of jsonFields) {
      const value = record[field]
      if (value !== null && value !== undefined) {
        // JSON fields from Prisma come as parsed objects, not strings
        // Only encrypt if it's not already a string (encrypted)
        if (typeof value !== "string") {
          updates[field] = encryptJson(value)
          needsUpdate = true
        }
      }
    }

    if (needsUpdate) {
      await model.update({
        where: { [idField]: record[idField] },
        data: updates,
      })
      updated++
    }
  }

  console.log(`  ${modelName}: ${updated}/${records.length} records encrypted`)
}

async function main() {
  if (!process.env.PHI_ENCRYPTION_KEY) {
    console.error("ERROR: PHI_ENCRYPTION_KEY environment variable is required")
    process.exit(1)
  }

  console.log("Starting PHI encryption migration...")

  await encryptTable("session", prisma.session)
  await encryptTable("transcriptEntry", prisma.transcriptEntry)
  await encryptTable("consultationRecord", prisma.consultationRecord)
  await encryptTable("insights", prisma.insights)
  await encryptTable("note", prisma.note)
  await encryptTable("researchMessage", prisma.researchMessage)
  await encryptTable("diagnosis", prisma.diagnosis)

  console.log("\nEncryption migration complete!")
}

main()
  .catch((e) => {
    console.error("Migration failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

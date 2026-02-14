/**
 * Migration script to re-encrypt legacy 3-part format (iv:tag:encrypted)
 * to new 4-part format (salt:iv:tag:encrypted) with per-record salts.
 *
 * Usage:
 *   PHI_ENCRYPTION_KEY=your-key-here npx tsx scripts/migrate-encryption-v2.ts
 *
 * This script:
 * 1. Reads all records with PHI fields using raw Prisma (no auto-decrypt)
 * 2. Detects 3-part (legacy) encrypted values
 * 3. Decrypts using the legacy static salt
 * 4. Re-encrypts using a new per-record random salt
 * 5. Writes the updated 4-part ciphertext back
 *
 * Safe to run multiple times — skips already-migrated 4-part values.
 */
import { PrismaClient } from "@prisma/client"
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto"

const prisma = new PrismaClient()

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const TAG_LENGTH = 16
const SALT_LENGTH = 16
const ENCODING = "base64" as const

function getSecret(): string {
  const secret = process.env.PHI_ENCRYPTION_KEY
  if (!secret) throw new Error("PHI_ENCRYPTION_KEY required")
  return secret
}

function getLegacyKey(): Buffer {
  return scryptSync(getSecret(), "rxly-phi-salt", 32)
}

function decryptLegacy(value: string): string | null {
  const parts = value.split(":")
  if (parts.length !== 3) return null
  try {
    const iv = Buffer.from(parts[0], ENCODING)
    const tag = Buffer.from(parts[1], ENCODING)
    const encrypted = Buffer.from(parts[2], ENCODING)
    if (iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH) return null
    const decipher = createDecipheriv(ALGORITHM, getLegacyKey(), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
  } catch {
    return null
  }
}

function encryptV2(plaintext: string): string {
  const salt = randomBytes(SALT_LENGTH)
  const key = scryptSync(getSecret(), salt, 32)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${salt.toString(ENCODING)}:${iv.toString(ENCODING)}:${tag.toString(ENCODING)}:${encrypted.toString(ENCODING)}`
}

function isLegacyFormat(value: string): boolean {
  return value.split(":").length === 3
}

function isV2Format(value: string): boolean {
  return value.split(":").length === 4
}

const PHI_STRING_FIELDS: Record<string, string[]> = {
  session: ["patientName"],
  transcriptEntry: ["text"],
  consultationRecord: [
    "patientName", "chiefComplaint", "hpiText", "medications",
    "rosText", "pmh", "socialHistory", "familyHistory",
    "physicalExam", "labsStudies", "assessment", "plan",
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

async function migrateTable(
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
  let migrated = 0
  let skipped = 0
  let failed = 0

  for (const record of records) {
    const updates: Record<string, unknown> = {}
    let needsUpdate = false

    // Migrate string fields
    for (const field of stringFields) {
      const value = record[field]
      if (typeof value !== "string" || value.length === 0) continue
      if (isV2Format(value)) { skipped++; continue }
      if (isLegacyFormat(value)) {
        const plaintext = decryptLegacy(value)
        if (plaintext !== null) {
          updates[field] = encryptV2(plaintext)
          needsUpdate = true
        } else {
          console.warn(`  WARN: Failed to decrypt ${modelName}.${field} id=${record[idField]}`)
          failed++
        }
      }
      // Plaintext (no colons) - encrypt fresh
      else if (!value.includes(":")) {
        updates[field] = encryptV2(value)
        needsUpdate = true
      }
    }

    // Migrate JSON fields (stored as encrypted strings)
    for (const field of jsonFields) {
      const value = record[field]
      if (value === null || value === undefined) continue

      if (typeof value === "string") {
        if (isV2Format(value)) { skipped++; continue }
        if (isLegacyFormat(value)) {
          const plaintext = decryptLegacy(value)
          if (plaintext !== null) {
            updates[field] = encryptV2(plaintext)
            needsUpdate = true
          } else {
            console.warn(`  WARN: Failed to decrypt JSON ${modelName}.${field} id=${record[idField]}`)
            failed++
          }
        }
      } else {
        // Raw JSON object (unencrypted) — encrypt it
        updates[field] = encryptV2(JSON.stringify(value))
        needsUpdate = true
      }
    }

    if (needsUpdate) {
      await model.update({
        where: { [idField]: record[idField] },
        data: updates,
      })
      migrated++
    }
  }

  console.log(`  ${modelName}: ${migrated} migrated, ${skipped} already v2, ${failed} failed (total: ${records.length})`)
}

async function main() {
  if (!process.env.PHI_ENCRYPTION_KEY) {
    console.error("ERROR: PHI_ENCRYPTION_KEY environment variable is required")
    process.exit(1)
  }

  console.log("Starting encryption v2 migration (3-part → 4-part with per-record salt)...\n")

  await migrateTable("session", prisma.session)
  await migrateTable("transcriptEntry", prisma.transcriptEntry)
  await migrateTable("consultationRecord", prisma.consultationRecord)
  await migrateTable("insights", prisma.insights)
  await migrateTable("note", prisma.note)
  await migrateTable("researchMessage", prisma.researchMessage)
  await migrateTable("diagnosis", prisma.diagnosis)

  console.log("\nEncryption v2 migration complete!")
}

main()
  .catch((e) => {
    console.error("Migration failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

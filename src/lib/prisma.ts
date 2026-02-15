import { PrismaClient } from "@prisma/client"
import { encryptField, decryptField, encryptJson, decryptJson } from "./encryption"

// PHI string fields per model (lowercase model names as Prisma uses them)
const PHI_STRING_FIELDS: Record<string, string[]> = {
  Session: ["patientName"],
  TranscriptEntry: ["text"],
  ConsultationRecord: [
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
  Insights: ["summary"],
  Note: ["content"],
  ResearchMessage: ["content"],
  Diagnosis: ["diseaseName", "evidence"],
}

// PHI JSON fields per model
const PHI_JSON_FIELDS: Record<string, string[]> = {
  Insights: ["keyFindings", "redFlags"],
  ConsultationRecord: ["vitals"],
}

function isEncryptionEnabled(): boolean {
  return !!process.env.PHI_ENCRYPTION_KEY
}

function processData(
  model: string,
  data: Record<string, unknown>,
  direction: "encrypt" | "decrypt"
): Record<string, unknown> {
  if (!isEncryptionEnabled()) return data

  const result = { ...data }
  const stringFields = PHI_STRING_FIELDS[model] || []
  const jsonFields = PHI_JSON_FIELDS[model] || []

  for (const field of stringFields) {
    if (field in result && typeof result[field] === "string") {
      result[field] =
        direction === "encrypt"
          ? encryptField(result[field] as string)
          : decryptField(result[field] as string)
    }
  }

  for (const field of jsonFields) {
    if (field in result && result[field] !== undefined && result[field] !== null) {
      if (direction === "encrypt") {
        result[field] = encryptJson(result[field])
      } else {
        // On decrypt, the field might be a string (encrypted JSON) or already parsed JSON
        if (typeof result[field] === "string") {
          result[field] = decryptJson(result[field] as string)
        }
        // If it's already an object/array (unencrypted legacy), leave it as-is
      }
    }
  }

  return result
}

function encryptData(
  model: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  return processData(model, data, "encrypt")
}

function decryptRecord(
  model: string,
  record: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!record) return record
  return processData(model, record, "decrypt")
}

function decryptArray(
  model: string,
  records: Record<string, unknown>[]
): Record<string, unknown>[] {
  return records.map((r) => processData(model, r, "decrypt"))
}

const globalForPrisma = globalThis as unknown as {
  __prisma?: PrismaClient
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function createPrismaClient() {
  const isPgBouncer = process.env.DATABASE_URL?.includes("pgbouncer=true")

  const base = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log:
      process.env.NODE_ENV !== "production"
        ? ["warn", "error"]
        : ["error"],
    // When using PgBouncer, keep Prisma's internal pool small
    // to avoid exhausting the external pooler's connection limit.
    ...(isPgBouncer
      ? {}
      : {}),
  })

  return base.$extends({
    query: {
      $allModels: {
        async create({ model, args, query }: any) {
          if (model && args.data && (PHI_STRING_FIELDS[model] || PHI_JSON_FIELDS[model])) {
            args.data = encryptData(model, args.data)
          }
          const result = await query(args)
          if (model && result && (PHI_STRING_FIELDS[model] || PHI_JSON_FIELDS[model])) {
            return decryptRecord(model, result)
          }
          return result
        },
        async update({ model, args, query }: any) {
          if (model && args.data && (PHI_STRING_FIELDS[model] || PHI_JSON_FIELDS[model])) {
            args.data = encryptData(model, args.data)
          }
          const result = await query(args)
          if (model && result && (PHI_STRING_FIELDS[model] || PHI_JSON_FIELDS[model])) {
            return decryptRecord(model, result)
          }
          return result
        },
        async upsert({ model, args, query }: any) {
          if (model && (PHI_STRING_FIELDS[model] || PHI_JSON_FIELDS[model])) {
            if (args.create) {
              args.create = encryptData(model, args.create)
            }
            if (args.update) {
              args.update = encryptData(model, args.update)
            }
          }
          const result = await query(args)
          if (model && result && (PHI_STRING_FIELDS[model] || PHI_JSON_FIELDS[model])) {
            return decryptRecord(model, result)
          }
          return result
        },
        async findUnique({ model, args, query }: any) {
          const result = await query(args)
          if (model && result && (PHI_STRING_FIELDS[model] || PHI_JSON_FIELDS[model])) {
            return decryptRecord(model, result)
          }
          return result
        },
        async findFirst({ model, args, query }: any) {
          const result = await query(args)
          if (model && result && (PHI_STRING_FIELDS[model] || PHI_JSON_FIELDS[model])) {
            return decryptRecord(model, result)
          }
          return result
        },
        async findMany({ model, args, query }: any) {
          const results = await query(args)
          if (model && (PHI_STRING_FIELDS[model] || PHI_JSON_FIELDS[model])) {
            return decryptArray(model, results)
          }
          return results
        },
        async createMany({ model, args, query }: any) {
          if (model && args.data && (PHI_STRING_FIELDS[model] || PHI_JSON_FIELDS[model])) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((d: any) => encryptData(model, d))
            } else {
              args.data = encryptData(model, args.data)
            }
          }
          return query(args)
        },
      },
    },
  }) as unknown as PrismaClient
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const prisma = globalForPrisma.__prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = prisma

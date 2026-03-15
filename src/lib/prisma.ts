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
  ChecklistItem: ["doctorNote"],
  Note: ["content"],
  ResearchMessage: ["content"],
  RecordingSegment: ["storagePath"],
  Diagnosis: ["diseaseName", "evidence"],
}

// PHI JSON fields per model
const PHI_JSON_FIELDS: Record<string, string[]> = {
  Insights: ["keyFindings", "redFlags"],
  ConsultationRecord: ["vitals"],
  PatientHandout: ["conditions", "entries"],
  Note: ["imageUrls", "storagePaths"],
  Diagnosis: ["citations"],
  ResearchMessage: ["citations", "imageUrls", "storagePaths"],
  SessionDocument: ["contentJson"],
}

// Relation fields that may be included via Prisma `include` and need recursive decryption
const RELATION_MODEL_MAP: Record<string, Record<string, { model: string; isArray: boolean }>> = {
  Session: {
    insights:          { model: "Insights",            isArray: false },
    record:            { model: "ConsultationRecord",  isArray: false },
    patientHandout:    { model: "PatientHandout",      isArray: false },
    checklistItems:    { model: "ChecklistItem",       isArray: true },
    diagnoses:         { model: "Diagnosis",           isArray: true },
    transcriptEntries: { model: "TranscriptEntry",     isArray: true },
    notes:             { model: "Note",                isArray: true },
    researchMessages:  { model: "ResearchMessage",     isArray: true },
    recordingSegments: { model: "RecordingSegment",    isArray: true },
    sessionDocuments:  { model: "SessionDocument",     isArray: true },
  },
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

/**
 * Decrypt a record and any included relations recursively.
 * Prisma $extends query middleware only fires for the top-level model,
 * so nested `include` relations must be decrypted manually.
 */
function decryptWithRelations(
  model: string,
  record: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!record) return record
  const result = processData(model, record, "decrypt")

  const relations = RELATION_MODEL_MAP[model]
  if (relations) {
    for (const [field, { model: relModel, isArray }] of Object.entries(relations)) {
      if (!(field in result) || result[field] == null) continue
      if (isArray && Array.isArray(result[field])) {
        result[field] = (result[field] as Record<string, unknown>[]).map(
          (r) => decryptWithRelations(relModel, r)!
        )
      } else if (!isArray && typeof result[field] === "object" && !Array.isArray(result[field])) {
        result[field] = decryptWithRelations(relModel, result[field] as Record<string, unknown>)
      }
    }
  }

  return result
}

const globalForPrisma = globalThis as unknown as {
  __prisma?: PrismaClient
  __prismaDatasourceUrl?: string
  __prismaRevision?: number
}

const PRISMA_CLIENT_REVISION = 4

function clientSupportsCurrentSchema(client: PrismaClient | undefined): boolean {
  if (!client) return false

  const bootstrapDelegate = (
    client as PrismaClient & {
      userBootstrapState?: { create?: unknown }
    }
  ).userBootstrapState

  return typeof bootstrapDelegate?.create === "function"
}

function getDatasourceUrl(): string | undefined {
  const raw = process.env.DATABASE_URL
  if (!raw) return raw

  try {
    const url = new URL(raw)
    const usesSupabasePooler =
      url.hostname.includes("pooler.supabase.com") ||
      url.searchParams.get("pgbouncer") === "true"

    // In dev with Turbopack, multiple workers can cause pool starvation quickly.
    // Keep Prisma-side fan-out low, but allow a few concurrent requests so
    // consultation bootstrap does not deadlock on session/workspace loads.
    if (usesSupabasePooler && process.env.NODE_ENV !== "production") {
      const devConnectionLimit = 3
      const configuredLimit = Number(url.searchParams.get("connection_limit") ?? "")
      if (!Number.isFinite(configuredLimit) || configuredLimit > devConnectionLimit) {
        url.searchParams.set("connection_limit", String(devConnectionLimit))
      }

      if (!url.searchParams.has("pool_timeout")) {
        url.searchParams.set("pool_timeout", "30")
      }
    }

    return url.toString()
  } catch {
    return raw
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function createPrismaClient() {
  const base = new PrismaClient({
    datasourceUrl: getDatasourceUrl(),
    log:
      process.env.NODE_ENV !== "production"
        ? ["warn", "error"]
        : ["error"],
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
            return decryptWithRelations(model, result)
          }
          return result
        },
        async update({ model, args, query }: any) {
          if (model && args.data && (PHI_STRING_FIELDS[model] || PHI_JSON_FIELDS[model])) {
            args.data = encryptData(model, args.data)
          }
          const result = await query(args)
          if (model && result && (PHI_STRING_FIELDS[model] || PHI_JSON_FIELDS[model])) {
            return decryptWithRelations(model, result)
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
            return decryptWithRelations(model, result)
          }
          return result
        },
        async findUnique({ model, args, query }: any) {
          const result = await query(args)
          if (model && result && (PHI_STRING_FIELDS[model] || PHI_JSON_FIELDS[model])) {
            return decryptWithRelations(model, result)
          }
          return result
        },
        async findFirst({ model, args, query }: any) {
          const result = await query(args)
          if (model && result && (PHI_STRING_FIELDS[model] || PHI_JSON_FIELDS[model])) {
            return decryptWithRelations(model, result)
          }
          return result
        },
        async findMany({ model, args, query }: any) {
          const results = await query(args)
          if (model && (PHI_STRING_FIELDS[model] || PHI_JSON_FIELDS[model])) {
            return results.map((r: any) => decryptWithRelations(model, r))
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

const currentDatasourceUrl = getDatasourceUrl()

const shouldReuseGlobalClient =
  clientSupportsCurrentSchema(globalForPrisma.__prisma) &&
  globalForPrisma.__prismaDatasourceUrl === currentDatasourceUrl &&
  globalForPrisma.__prismaRevision === PRISMA_CLIENT_REVISION

export const prisma =
  shouldReuseGlobalClient && globalForPrisma.__prisma
    ? globalForPrisma.__prisma
    : createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  if (!shouldReuseGlobalClient && globalForPrisma.__prisma) {
    void globalForPrisma.__prisma.$disconnect().catch(() => {
      // Ignore stale client shutdown failures during dev reloads.
    })
  }

  globalForPrisma.__prisma = prisma
  globalForPrisma.__prismaDatasourceUrl = currentDatasourceUrl
  globalForPrisma.__prismaRevision = PRISMA_CLIENT_REVISION
}

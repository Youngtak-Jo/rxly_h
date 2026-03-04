import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { logger } from "@/lib/logger"

export type AuditAction = "CREATE" | "READ" | "UPDATE" | "DELETE"

interface AuditEntry {
  userId: string
  action: AuditAction
  resource: string
  resourceId?: string
  sessionId?: string
  metadata?: Record<string, unknown>
  success?: boolean
}

type QueuedAudit = {
  data: Prisma.AuditLogCreateInput
  context: { userId: string; action: AuditAction; resource: string }
  retries: number
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

const AUDIT_MAX_QUEUE_SIZE = parsePositiveInt(process.env.AUDIT_MAX_QUEUE_SIZE, 500)
const AUDIT_MAX_RETRIES = parsePositiveInt(process.env.AUDIT_MAX_RETRIES, 2)
const AUDIT_RETRY_BASE_MS = parsePositiveInt(process.env.AUDIT_RETRY_BASE_MS, 100)

const auditQueue: QueuedAudit[] = []
let auditDrainActive = false

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const BATCH_SIZE = 20

async function drainAuditQueue(): Promise<void> {
  if (auditDrainActive) return
  auditDrainActive = true

  try {
    while (auditQueue.length > 0) {
      const batchSize = Math.min(BATCH_SIZE, auditQueue.length)
      const batch = auditQueue.splice(0, batchSize)

      try {
        await prisma.auditLog.createMany({
          data: batch.map((item) => item.data),
        })
      } catch (error) {
        // Put failed items back for retry (prepend to preserve order)
        for (let i = batch.length - 1; i >= 0; i--) {
          const item = batch[i]
          item.retries += 1

          if (item.retries > AUDIT_MAX_RETRIES) {
            logger.error("[AUDIT FAILURE] Failed to write audit log:", {
              entry: item.context,
              error: error instanceof Error ? error.message : String(error),
            })
          } else {
            auditQueue.unshift(item)
          }
        }

        const backoffMs = Math.min(1000, AUDIT_RETRY_BASE_MS * 2 ** ((batch[0]?.retries ?? 1) - 1))
        await sleep(backoffMs)
      }
    }
  } finally {
    auditDrainActive = false
    if (auditQueue.length > 0) {
      void drainAuditQueue()
    }
  }
}

function enqueueAudit(item: QueuedAudit): void {
  if (auditQueue.length >= AUDIT_MAX_QUEUE_SIZE) {
    const dropped = auditQueue.shift()
    logger.warn("[AUDIT DROPPED] Queue full, dropping oldest pending audit log", dropped?.context)
  }

  auditQueue.push(item)
  void drainAuditQueue()
}

export function logAudit(entry: AuditEntry): void {
  enqueueAudit({
    data: {
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId ?? null,
      sessionId: entry.sessionId ?? null,
      metadata: (entry.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      success: entry.success ?? true,
    },
    context: {
      userId: entry.userId,
      action: entry.action,
      resource: entry.resource,
    },
    retries: 0,
  })
}

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

export function logAudit(entry: AuditEntry): void {
  // Fire-and-forget: audit logging should never block the main request
  prisma.auditLog
    .create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId ?? null,
        sessionId: entry.sessionId ?? null,
        metadata: (entry.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        success: entry.success ?? true,
      },
    })
    .catch((error) => {
      // HIPAA: audit failures must be logged to a secondary channel
      logger.error("[AUDIT FAILURE] Failed to write audit log:", {
        entry: { userId: entry.userId, action: entry.action, resource: entry.resource },
        error: error instanceof Error ? error.message : String(error),
      })
    })
}

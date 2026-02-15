import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"
import { errorResponse } from "@/lib/api-response"
import { getMedplumClient } from "@/lib/medplum"
import { resolveReferences, getResourceDisplay } from "@/lib/medplum-utils"
import type { Bundle, BundleEntry, Resource } from "@medplum/fhirtypes"

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const { bundle } = (await req.json()) as { bundle: Bundle }

    if (
      !bundle ||
      bundle.resourceType !== "Bundle" ||
      !bundle.entry ||
      bundle.entry.length === 0
    ) {
      return errorResponse("Invalid FHIR Bundle", 400)
    }

    const medplum = await getMedplumClient()
    const createdResources: {
      resourceType: string
      id: string
      display?: string
    }[] = []

    const uuidToId: Record<string, string> = {}

    for (const entry of bundle.entry as BundleEntry[]) {
      if (!entry.resource || !entry.request?.url) continue

      const resource = resolveReferences(
        entry.resource as Resource,
        uuidToId
      )

      try {
        const created = await medplum.createResource(resource)
        createdResources.push({
          resourceType: created.resourceType,
          id: created.id!,
          display: getResourceDisplay(created),
        })

        if (entry.fullUrl?.startsWith("urn:uuid:")) {
          uuidToId[entry.fullUrl] =
            `${created.resourceType}/${created.id}`
        }
      } catch (err) {
        logger.error(
          `Failed to create ${entry.resource.resourceType}:`,
          err
        )
      }
    }

    logAudit({
      userId: user.id,
      action: "CREATE",
      resource: "medplum_sync",
    })

    return NextResponse.json({
      success: true,
      resourceCount: createdResources.length,
      resources: createdResources,
    })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Medplum sync error:", error)
    return errorResponse("Failed to sync to Medplum", 500)
  }
}

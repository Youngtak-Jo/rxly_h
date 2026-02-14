import { NextResponse } from "next/server"
import { v4 as uuid } from "uuid"
import { createClient } from "@supabase/supabase-js"
import { logger } from "@/lib/logger"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const IMAGE_MAGIC_BYTES: [string, number[]][] = [
  ["image/jpeg", [0xFF, 0xD8, 0xFF]],
  ["image/png", [0x89, 0x50, 0x4E, 0x47]],
  ["image/gif", [0x47, 0x49, 0x46, 0x38]],
  ["image/webp", [0x52, 0x49, 0x46, 0x46]], // RIFF header
]

function detectImageMime(buf: Buffer): string | null {
  for (const [mime, magic] of IMAGE_MAGIC_BYTES) {
    if (magic.every((byte, i) => buf[i] === byte)) return mime
  }
  return null
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "upload")
    if (!allowed) return rateLimitResponse()

    const formData = await req.formData()
    const file = formData.get("file") as File
    const sessionId = formData.get("sessionId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be under 10MB" },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Validate actual file type via magic bytes (client-reported MIME can be spoofed)
    const detectedMime = detectImageMime(buffer)
    if (!detectedMime) {
      return NextResponse.json(
        { error: "File does not appear to be a valid image (JPEG, PNG, GIF, or WebP)" },
        { status: 400 }
      )
    }

    const MIME_EXT: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
    }
    const ext = MIME_EXT[detectedMime] || "jpg"
    const filename = `${uuid()}.${ext}`
    const storagePath = sessionId
      ? `${sessionId}/${filename}`
      : `unassigned/${filename}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from("medical-images")
      .upload(storagePath, buffer, {
        contentType: detectedMime,
        upsert: false,
      })

    if (uploadError) {
      logger.error("Supabase upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      )
    }

    // Generate a signed URL (1 hour expiry) for private bucket access
    const { data: signedUrlData, error: signedUrlError } =
      await supabaseAdmin.storage
        .from("medical-images")
        .createSignedUrl(storagePath, 3600)

    if (signedUrlError || !signedUrlData?.signedUrl) {
      logger.error("Signed URL error:", signedUrlError)
      return NextResponse.json(
        { error: "File uploaded but failed to generate URL" },
        { status: 500 }
      )
    }

    logAudit({ userId: user.id, action: "CREATE", resource: "upload", metadata: { storagePath } })
    return NextResponse.json({
      url: signedUrlData.signedUrl,
      path: storagePath,
    })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}

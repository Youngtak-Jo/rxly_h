import { NextResponse } from "next/server"
import { Resend } from "resend"
import { requireAuth } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { logger } from "@/lib/logger"
import { prisma } from "@/lib/prisma"
import { encryptField } from "@/lib/encryption"
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const user = await requireAuth()

    const { allowed } = checkRateLimit(user.id, "data")
    if (!allowed) return rateLimitResponse()

    const { to, subject, html, sessionId } = await req.json()

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create a secure export link instead of sending PHI directly via email
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const exportLink = await prisma.exportLink.create({
      data: {
        userId: user.id,
        sessionId: sessionId || "unknown",
        content: encryptField(html) || "",
        expiresAt,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.rxly.app"
    const secureUrl = `${appUrl}/export/${exportLink.id}`

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Rxly <noreply@rxly.app>",
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">${subject}</h2>
          <p>A consultation record has been exported from Rxly. For security purposes, the content is accessible through a secure, time-limited link.</p>
          <a href="${secureUrl}" style="display: inline-block; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            View Consultation Record
          </a>
          <p style="color: #666; font-size: 14px;">This link expires in 24 hours and requires authentication to access.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">This email contains Protected Health Information (PHI). If you are not the intended recipient, please delete this email immediately.</p>
        </div>
      `,
    })

    if (error) {
      logger.error("Resend error:", error)
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      )
    }

    logAudit({
      userId: user.id,
      action: "CREATE",
      resource: "email_export",
      resourceId: exportLink.id,
      metadata: { to, subject },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof NextResponse) return error
    logger.error("Email export error:", error)
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    )
  }
}

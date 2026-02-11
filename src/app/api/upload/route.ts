import { NextResponse } from "next/server"
import { v4 as uuid } from "uuid"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const sessionId = formData.get("sessionId") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are supported" },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be under 10MB" },
        { status: 400 }
      )
    }

    const ext = file.name.split(".").pop() || "jpg"
    const filename = `${uuid()}.${ext}`
    const storagePath = sessionId
      ? `${sessionId}/${filename}`
      : `unassigned/${filename}`

    const bytes = await file.arrayBuffer()

    const { error: uploadError } = await supabaseAdmin.storage
      .from("medical-images")
      .upload(storagePath, Buffer.from(bytes), {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Supabase upload error:", uploadError)
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
      console.error("Signed URL error:", signedUrlError)
      return NextResponse.json(
        { error: "File uploaded but failed to generate URL" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: signedUrlData.signedUrl,
      path: storagePath,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}

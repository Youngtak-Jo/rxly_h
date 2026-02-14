import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/consultation"

  const redirectTo = request.nextUrl.clone()

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      redirectTo.pathname = next
      redirectTo.searchParams.delete("code")
      redirectTo.searchParams.delete("next")
      return NextResponse.redirect(redirectTo)
    }
  }

  redirectTo.pathname = "/login"
  redirectTo.searchParams.set("error", "auth_callback_failed")
  return NextResponse.redirect(redirectTo)
}

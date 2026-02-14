"use server"

import { createClient } from "@/lib/supabase/server"

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get("email") as string

  if (!email) {
    return { error: "Please enter your email address" }
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: "Check your email for a password reset link." }
}

"use server"

import { createClient } from "@/lib/supabase/server"
import { signupSchema } from "@/lib/validations"

export async function signup(formData: FormData) {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" }
  }

  if (parsed.data.password !== parsed.data.confirmPassword) {
    return { error: "Passwords do not match" }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return { error: error.message }
  }

  // Supabase returns a user with empty identities when the email already exists
  // (to prevent email enumeration attacks)
  if (data.user?.identities?.length === 0) {
    return { error: "An account with this email already exists. Please sign in instead." }
  }

  return { success: "Check your email for a confirmation link." }
}

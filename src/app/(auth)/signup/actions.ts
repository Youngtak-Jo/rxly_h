"use server"

import { createClient } from "@/lib/supabase/server"

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" }
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" }
  }

  const { data, error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password,
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

import { createClient } from "@/lib/supabase/client"
import type { Provider } from "@supabase/supabase-js"

export async function signInWithOAuth(provider: Provider) {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) {
    throw new Error(error.message)
  }
}

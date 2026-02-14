"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2, ArrowLeft, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { forgotPassword } from "./actions"

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition()
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await forgotPassword(formData)
      if (result?.error) {
        toast.error(result.error)
      }
      if (result && "success" in result) {
        toast.success(result.success)
        setEmailSent(true)
      }
    })
  }

  if (emailSent) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="size-6 text-primary" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground text-sm text-balance">
            We&apos;ve sent you a password reset link. Please check your inbox
            and click the link to reset your password.
          </p>
        </div>
        <Link
          href="/login"
          className="text-sm underline underline-offset-4 hover:text-primary"
        >
          Back to Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/login"
        className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to sign in
      </Link>

      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">Forgot your password?</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form action={handleSubmit}>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

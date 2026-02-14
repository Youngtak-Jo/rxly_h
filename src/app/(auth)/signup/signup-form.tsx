"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2, ArrowLeft, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { SocialLoginButtons } from "@/components/auth/social-login-buttons"
import { createClient } from "@/lib/supabase/client"
import { signup } from "./actions"

export function SignupForm() {
  const [isPending, startTransition] = useTransition()
  const [view, setView] = useState<"form" | "otp">("form")
  const [email, setEmail] = useState("")
  const [otpValue, setOtpValue] = useState("")
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await signup(formData)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      if (result && "success" in result) {
        setEmail(formData.get("email") as string)
        setView("otp")
        setResendCooldown(60)
        toast.success("Verification code sent to your email")
      }
    })
  }

  const handleVerifyOtp = useCallback(
    async (token: string) => {
      setOtpLoading(true)
      try {
        const supabase = createClient()
        const { error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: "signup",
        })
        if (error) {
          toast.error(error.message)
          setOtpValue("")
          return
        }
        toast.success("Account verified!")
        window.location.href = "/consultation"
      } catch {
        toast.error("Verification failed")
        setOtpValue("")
      } finally {
        setOtpLoading(false)
      }
    },
    [email]
  )

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setOtpLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success("New code sent to your email")
      setResendCooldown(60)
      setOtpValue("")
    } catch {
      toast.error("Failed to resend code")
    } finally {
      setOtpLoading(false)
    }
  }

  // --- OTP Verification View ---
  if (view === "otp") {
    return (
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => {
            setView("form")
            setOtpValue("")
          }}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="size-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Verify your email</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter the 6-digit code sent to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <InputOTP
            maxLength={6}
            value={otpValue}
            onChange={setOtpValue}
            onComplete={handleVerifyOtp}
            disabled={otpLoading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          {otpLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Verifying...
            </div>
          )}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Didn&apos;t receive a code?{" "}
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendCooldown > 0 || otpLoading}
            className="underline underline-offset-4 hover:text-primary disabled:opacity-50 disabled:no-underline"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
          </button>
        </div>
      </div>
    )
  }

  // --- Signup Form View ---
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your details to get started
        </p>
      </div>

      <SocialLoginButtons />

      <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
        <span className="bg-background text-muted-foreground relative z-10 px-2">
          or continue with email
        </span>
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
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </div>
      </form>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link
          href="/login"
          className="underline underline-offset-4 hover:text-primary"
        >
          Sign in
        </Link>
      </div>
    </div>
  )
}

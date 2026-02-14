"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
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
import { login } from "./actions"

type View = "credentials" | "otp-request" | "otp-verify"

export function LoginForm() {
  const [view, setView] = useState<View>("credentials")
  const [isPending, startTransition] = useTransition()
  const [otpEmail, setOtpEmail] = useState("")
  const [otpValue, setOtpValue] = useState("")
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get("error")
    if (error) {
      const description = searchParams.get("error_description")
      if (description) {
        toast.error(decodeURIComponent(description))
      } else if (error === "auth_callback_failed") {
        toast.error("Authentication failed. Please try again.")
      } else {
        toast.error("Authentication failed. Please try again.")
      }
    }
  }, [searchParams])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleLogin = (formData: FormData) => {
    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) {
        toast.error(result.error)
      }
    })
  }

  const handleSendOtp = async () => {
    if (!otpEmail) {
      toast.error("Please enter your email address")
      return
    }
    setOtpLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail,
        options: { shouldCreateUser: false },
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success("Verification code sent to your email")
      setView("otp-verify")
      setResendCooldown(60)
    } catch {
      toast.error("Failed to send verification code")
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyOtp = useCallback(
    async (token: string) => {
      setOtpLoading(true)
      try {
        const supabase = createClient()
        const { error } = await supabase.auth.verifyOtp({
          email: otpEmail,
          token,
          type: "email",
        })
        if (error) {
          toast.error(error.message)
          setOtpValue("")
          return
        }
        window.location.href = "/consultation"
      } catch {
        toast.error("Verification failed")
        setOtpValue("")
      } finally {
        setOtpLoading(false)
      }
    },
    [otpEmail]
  )

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setOtpLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: otpEmail,
        options: { shouldCreateUser: false },
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

  // --- OTP Verify View ---
  if (view === "otp-verify") {
    return (
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => {
            setView("otp-request")
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
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground text-sm text-balance">
            We sent a verification code to{" "}
            <span className="font-medium text-foreground">{otpEmail}</span>
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

  // --- OTP Request View ---
  if (view === "otp-request") {
    return (
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => setView("credentials")}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to sign in
        </button>

        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold">Sign in with email code</h1>
          <p className="text-muted-foreground text-sm text-balance">
            We&apos;ll send a verification code to your email
          </p>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="otp-email">Email</Label>
            <Input
              id="otp-email"
              type="email"
              placeholder="you@example.com"
              value={otpEmail}
              onChange={(e) => setOtpEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleSendOtp()
                }
              }}
              required
            />
          </div>
          <Button
            className="w-full"
            onClick={handleSendOtp}
            disabled={otpLoading}
          >
            {otpLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Code"
            )}
          </Button>
        </div>
      </div>
    )
  }

  // --- Credentials View (default) ---
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Sign in to your account
        </p>
      </div>

      <SocialLoginButtons />

      <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
        <span className="bg-background text-muted-foreground relative z-10 px-2">
          or continue with email
        </span>
      </div>

      <form action={handleLogin}>
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
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="ml-auto text-sm underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
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
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </div>
      </form>

      <button
        type="button"
        onClick={() => setView("otp-request")}
        className="text-muted-foreground hover:text-primary text-center text-sm underline-offset-4 hover:underline"
      >
        Sign in with email code
      </button>

      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="underline underline-offset-4 hover:text-primary"
        >
          Sign up
        </Link>
      </div>
    </div>
  )
}

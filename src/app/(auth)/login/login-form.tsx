"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("LoginForm")
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
        toast.error(t("authFailed"))
      } else {
        toast.error(t("authFailed"))
      }
    }
  }, [searchParams, t])

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
      toast.error(t("enterEmail"))
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
      toast.success(t("otpSent"))
      setView("otp-verify")
      setResendCooldown(60)
    } catch {
      toast.error(t("sendCodeFailed"))
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
        toast.error(t("verifyFailed"))
        setOtpValue("")
      } finally {
        setOtpLoading(false)
      }
    },
    [otpEmail, t]
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
      toast.success(t("resendSuccess"))
      setResendCooldown(60)
      setOtpValue("")
    } catch {
      toast.error(t("resendFailed"))
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
          {t("back")}
        </button>

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="size-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{t("checkEmailTitle")}</h1>
          <p className="text-muted-foreground text-sm text-balance">
            {t("checkEmailDescription", { email: otpEmail })}
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
              {t("verifying")}
            </div>
          )}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          {t("didNotReceiveCode")}{" "}
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendCooldown > 0 || otpLoading}
            className="underline underline-offset-4 hover:text-primary disabled:opacity-50 disabled:no-underline"
          >
            {resendCooldown > 0
              ? t("resendIn", { seconds: resendCooldown })
              : t("resend")}
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
          {t("backToSignIn")}
        </button>

        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold">{t("emailCodeTitle")}</h1>
          <p className="text-muted-foreground text-sm text-balance">
            {t("emailCodeDescription")}
          </p>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="otp-email">{t("emailLabel")}</Label>
            <Input
              id="otp-email"
              type="email"
              placeholder={t("emailPlaceholder")}
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
                {t("sending")}
              </>
            ) : (
              t("sendCode")
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
        <h1 className="text-2xl font-bold">{t("credentialsTitle")}</h1>
        <p className="text-muted-foreground text-sm text-balance">
          {t("credentialsDescription")}
        </p>
      </div>

      <SocialLoginButtons />

      <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
        <span className="bg-background text-muted-foreground relative z-10 px-2">
          {t("signInWithEmailDivider")}
        </span>
      </div>

      <form action={handleLogin}>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">{t("emailLabel")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              required
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">{t("password")}</Label>
              <Link
                href="/forgot-password"
                className="ml-auto text-sm underline-offset-4 hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={t("passwordPlaceholder")}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("signingIn")}
              </>
            ) : (
              t("signIn")
            )}
          </Button>
        </div>
      </form>

      <button
        type="button"
        onClick={() => setView("otp-request")}
        className="text-muted-foreground hover:text-primary text-center text-sm underline-offset-4 hover:underline"
      >
        {t("useEmailCode")}
      </button>

      <div className="text-center text-sm">
        {t("signUpPrompt")}{" "}
        <Link
          href="/signup"
          className="underline underline-offset-4 hover:text-primary"
        >
          {t("signUp")}
        </Link>
      </div>
    </div>
  )
}

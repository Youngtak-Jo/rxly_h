"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { login, signup } from "./actions"

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const action = mode === "login" ? login : signup
      const result = await action(formData)

      if (result?.error) {
        toast.error(result.error)
      }
      if (result && "success" in result) {
        toast.success(result.success)
        setMode("login")
      }
    })
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">
          {mode === "login" ? "Welcome back" : "Create an account"}
        </CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Sign in to your account"
            : "Enter your email to get started"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit}>
          <div className="grid gap-4">
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
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending
                ? mode === "login"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "login"
                  ? "Sign In"
                  : "Sign Up"}
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

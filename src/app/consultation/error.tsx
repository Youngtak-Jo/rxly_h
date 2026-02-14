"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function ConsultationError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Consultation error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="text-muted-foreground">
          An unexpected error occurred during consultation. Your data is safe.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  )
}

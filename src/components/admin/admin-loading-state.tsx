import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function AdminLoadingState({
  label,
  className,
  compact = false,
}: {
  label: string
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center",
        compact ? "p-4" : "min-h-56 p-8",
        className
      )}
    >
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

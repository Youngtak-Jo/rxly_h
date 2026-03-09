"use client"

import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface PatientHandoutSectionProps {
  title: string
  value: string
  onChange: (value: string) => void
  mode: "preview" | "edit"
  placeholder: string
}

export function PatientHandoutSection({
  title,
  value,
  onChange,
  mode,
  placeholder,
}: PatientHandoutSectionProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-[0.18em]">
        {title}
      </h4>

      {mode === "edit" ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-28 resize-y text-sm leading-6"
        />
      ) : (
        <p
          className={cn(
            "rounded-lg border border-border/60 px-4 py-3 text-sm leading-6 whitespace-pre-wrap",
            value
              ? "bg-muted/20 text-foreground"
              : "bg-muted/10 text-muted-foreground italic"
          )}
        >
          {value || placeholder}
        </p>
      )}
    </div>
  )
}

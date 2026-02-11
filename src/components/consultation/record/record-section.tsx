"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { IconPencil } from "@tabler/icons-react"

interface RecordSectionProps {
  title: string
  value: string
  onChange: (value: string) => void
  isLoading?: boolean
}

export function RecordSection({
  title,
  value,
  onChange,
  isLoading,
}: RecordSectionProps) {
  const [isEditing, setIsEditing] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-1.5">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </h4>
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  return (
    <div className="group space-y-1.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </h4>
        {!isEditing && value && (
          <button
            onClick={() => setIsEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <IconPencil className="size-3 text-muted-foreground" />
          </button>
        )}
      </div>
      {isEditing ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setIsEditing(false)}
          className="text-sm min-h-[60px]"
          autoFocus
        />
      ) : (
        <p
          className={`text-sm rounded-md px-3 py-2 ${
            value
              ? "text-foreground bg-muted/50 cursor-pointer hover:bg-muted"
              : "text-muted-foreground/50 italic"
          }`}
          onClick={() => setIsEditing(true)}
        >
          {value || "[Not discussed]"}
        </p>
      )}
    </div>
  )
}

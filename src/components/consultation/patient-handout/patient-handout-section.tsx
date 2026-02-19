"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { IconPencil } from "@tabler/icons-react"

interface PatientHandoutSectionProps {
  title: string
  value: string
  onChange: (value: string) => void
}

export function PatientHandoutSection({
  title,
  value,
  onChange,
}: PatientHandoutSectionProps) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <div className="group space-y-1.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </h4>
        {!isEditing && value && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`Edit ${title}`}
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
          className="text-sm min-h-[80px]"
          autoFocus
        />
      ) : (
        <p
          className={`text-sm rounded-md px-3 py-2 whitespace-pre-wrap ${
            value
              ? "text-foreground bg-muted/50 cursor-pointer hover:bg-muted"
              : "text-muted-foreground/50 italic"
          }`}
          onClick={() => setIsEditing(true)}
        >
          {value || "[Not generated]"}
        </p>
      )}
    </div>
  )
}

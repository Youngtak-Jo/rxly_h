"use client"

import { memo } from "react"
import { useLocale, useTimeZone } from "next-intl"
import type { NoteEntry } from "@/stores/note-store"
import Image from "next/image"
import { DEFAULT_UI_TIME_ZONE, type UiLocale } from "@/i18n/config"
import { formatTime } from "@/i18n/format"

export const NoteBubble = memo(function NoteBubble({ note }: { note: NoteEntry }) {
  const locale = useLocale() as UiLocale
  const timeZone = useTimeZone() ?? DEFAULT_UI_TIME_ZONE

  return (
    <div className="mt-3">
      <div className="rounded-r-lg border-l-2 border-primary bg-muted/50 px-3 py-2">
        {note.content && (
          <p className="text-[13px] leading-5 sm:text-sm sm:leading-relaxed">{note.content}</p>
        )}
        {note.imageUrls && note.imageUrls.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {note.imageUrls.map((url, j) => (
              <Image
                key={j}
                src={url}
                alt={`Medical image ${j + 1} from note`}
                width={48}
                height={48}
                className="h-11 w-11 rounded border object-cover sm:h-12 sm:w-12"
                unoptimized
              />
            ))}
          </div>
        )}
        <span className="mt-1 block font-mono text-[9px] text-muted-foreground/60 sm:text-[10px]">
          {formatTime(note.createdAt, locale, timeZone)}
        </span>
      </div>
    </div>
  )
})

import { memo } from "react"
import type { NoteEntry } from "@/stores/note-store"
import { cn } from "@/lib/utils"
import Image from "next/image"

function formatTime(createdAt: string) {
    const date = new Date(createdAt)
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`
}

export const NoteBubble = memo(function NoteBubble({ note }: { note: NoteEntry }) {
    return (
        <div className="mt-3">
            <div className="border-l-2 border-primary bg-muted/50 rounded-r-lg px-3 py-2">
                {note.content && (
                    <p className="text-sm leading-relaxed">{note.content}</p>
                )}
                {note.imageUrls && note.imageUrls.length > 0 && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {note.imageUrls.map((url, j) => (
                            <Image
                                key={j}
                                src={url}
                                alt={`Medical image ${j + 1} from note`}
                                width={48}
                                height={48}
                                className="h-12 w-12 rounded object-cover border"
                                unoptimized
                            />
                        ))}
                    </div>
                )}
                <span className="text-[10px] text-muted-foreground/60 font-mono mt-1 block">
                    {formatTime(note.createdAt)}
                </span>
            </div>
        </div>
    )
})

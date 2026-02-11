"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useInsightsStore } from "@/stores/insights-store"
import { useSessionStore } from "@/stores/session-store"
import {
  IconChecklist,
  IconNote,
  IconPlus,
  IconTrash,
  IconRobot,
  IconUser,
} from "@tabler/icons-react"

export function ChecklistCard() {
  const {
    checklistItems,
    toggleChecklistItem,
    addChecklistItem,
    removeChecklistItem,
    updateChecklistNote,
  } = useInsightsStore()
  const sessionId = useSessionStore((s) => s.activeSession?.id)
  const [newItemLabel, setNewItemLabel] = useState("")
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)

  const handleAddItem = () => {
    if (!newItemLabel.trim() || !sessionId) return
    addChecklistItem(newItemLabel.trim(), sessionId)
    setNewItemLabel("")
  }

  const checkedCount = checklistItems.filter((item) => item.isChecked).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <IconChecklist className="size-4 text-violet-500" />
          Checklist
          {checklistItems.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {checkedCount}/{checklistItems.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {checklistItems.length === 0 && (
          <p className="text-sm text-muted-foreground/50 italic">
            Checklist items will appear as the AI identifies action items...
          </p>
        )}

        {checklistItems.map((item) => (
          <div key={item.id} className="group">
            <div className="flex items-start gap-2">
              <Checkbox
                id={item.id}
                checked={item.isChecked}
                onCheckedChange={() => toggleChecklistItem(item.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor={item.id}
                  className={`text-sm cursor-pointer ${
                    item.isChecked
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {item.label}
                </label>
                {item.doctorNote && editingNoteId !== item.id && (
                  <p
                    className="text-xs text-muted-foreground mt-0.5 cursor-pointer hover:text-foreground"
                    onClick={() => setEditingNoteId(item.id)}
                  >
                    Note: {item.doctorNote}
                  </p>
                )}
                {editingNoteId === item.id && (
                  <Textarea
                    defaultValue={item.doctorNote || ""}
                    placeholder="Add a note..."
                    className="mt-1 text-xs h-16"
                    onBlur={(e) => {
                      updateChecklistNote(item.id, e.target.value)
                      setEditingNoteId(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        updateChecklistNote(
                          item.id,
                          (e.target as HTMLTextAreaElement).value
                        )
                        setEditingNoteId(null)
                      }
                    }}
                    autoFocus
                  />
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-[9px] px-1 py-0">
                      {item.source === "AI" ? (
                        <IconRobot className="size-2.5" />
                      ) : (
                        <IconUser className="size-2.5" />
                      )}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {item.source === "AI" ? "Added by AI" : "Added manually"}
                  </TooltipContent>
                </Tooltip>
                {editingNoteId !== item.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => setEditingNoteId(item.id)}
                  >
                    <IconNote className="size-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-destructive"
                  onClick={() => removeChecklistItem(item.id)}
                >
                  <IconTrash className="size-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2 pt-2">
          <Input
            placeholder="Add item..."
            value={newItemLabel}
            onChange={(e) => setNewItemLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddItem()
            }}
            className="h-8 text-xs"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleAddItem}
            disabled={!newItemLabel.trim()}
          >
            <IconPlus className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

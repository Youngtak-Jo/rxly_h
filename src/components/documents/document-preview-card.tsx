"use client"

import type { ReactNode } from "react"
import {
  IconRosetteDiscountCheckFilled,
  IconUsers,
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

export interface DocumentPreviewCardProps {
  title: string
  description: string
  categoryLabel: string
  languageLabel: string
  regionLabel: string
  preview: ReactNode
  previewHasContent?: boolean
  builtInLabel?: string
  isBuiltIn?: boolean
  draftLabel?: string | null
  isDraft?: boolean
  updateLabel?: string | null
  hasUpdate?: boolean
  authorName?: string | null
  installCountLabel?: string | null
  workspaceVisible?: boolean
  workspaceToggleBusy?: boolean
  workspaceShownLabel?: string
  workspaceHiddenLabel?: string
  onWorkspaceVisibilityChange?: (next: boolean) => void
  onClick?: () => void
  titleTrailing?: ReactNode
}

export function DocumentPreviewCard({
  title,
  description,
  categoryLabel,
  languageLabel,
  regionLabel,
  preview,
  previewHasContent = false,
  builtInLabel,
  isBuiltIn = false,
  draftLabel,
  isDraft = false,
  updateLabel,
  hasUpdate = false,
  authorName,
  installCountLabel,
  workspaceVisible,
  workspaceToggleBusy,
  workspaceShownLabel,
  workspaceHiddenLabel,
  onWorkspaceVisibilityChange,
  onClick,
  titleTrailing,
}: DocumentPreviewCardProps) {
  const hasWorkspaceSwitch =
    typeof workspaceVisible === "boolean" && !!onWorkspaceVisibilityChange
  const workspaceSwitchLabel = workspaceVisible
    ? workspaceShownLabel ?? "Shown in workspace"
    : workspaceHiddenLabel ?? "Hidden from workspace"
  const previewHeightClass = "h-[16.25rem]"

  return (
    <div className="group relative w-full">
      <button
        type="button"
        className="w-full cursor-pointer rounded-2xl text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onClick}
      >
        <div
          className={`relative ${previewHeightClass} overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-muted/40 to-muted/20 transition group-hover:border-border group-hover:from-muted/55 group-hover:to-muted/35`}
        >
          {hasUpdate && updateLabel ? (
            <div className="absolute inset-x-0 top-0 z-10 border-b border-emerald-300/70 bg-emerald-100/95 px-3 py-1.5 text-xs font-semibold text-emerald-900 backdrop-blur-sm">
              {updateLabel}
            </div>
          ) : null}

          <div
            className={`absolute bottom-3 left-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-1.5 ${hasWorkspaceSwitch ? "pr-10" : ""}`}
          >
            <Badge
              variant="outline"
              className="border-border/60 bg-background/90 shadow-sm backdrop-blur-sm"
            >
              {categoryLabel}
            </Badge>
            <Badge
              variant="outline"
              className="border-border/60 bg-background/90 shadow-sm backdrop-blur-sm"
            >
              {languageLabel}
            </Badge>
            <Badge
              variant="outline"
              className="border-border/60 bg-background/90 shadow-sm backdrop-blur-sm"
            >
              {regionLabel}
            </Badge>
          </div>

          <div className="absolute inset-x-0 bottom-1 flex justify-center px-5">
            <div className="w-full max-w-[72%] rounded-t-xl rounded-b-none border border-b-0 border-border/70 bg-card shadow-[0_-8px_20px_rgba(0,0,0,0.04)]">
              <div className="relative h-[14rem] overflow-hidden px-3 py-2">
                {preview}
                {previewHasContent ? (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card via-card/90 to-transparent" />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 px-1 pt-3">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold">{title}</h3>
            {isBuiltIn && builtInLabel ? (
              <IconRosetteDiscountCheckFilled
                className="size-4 shrink-0 text-sky-500"
                title={builtInLabel}
                aria-label={builtInLabel}
              />
            ) : null}
            {titleTrailing}
            {isDraft && draftLabel ? (
              <Badge variant="outline" className="ml-auto">
                {draftLabel}
              </Badge>
            ) : null}
          </div>
          <p className="h-10 line-clamp-2 text-sm leading-5 text-muted-foreground">
            {description.trim() || "\u00A0"}
          </p>

          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span className="min-w-0 truncate">{authorName || "\u00A0"}</span>
            {installCountLabel ? (
              <span className="inline-flex shrink-0 items-center gap-1">
                <IconUsers className="size-3.5" />
                {installCountLabel}
              </span>
            ) : null}
          </div>
        </div>
      </button>

      {hasWorkspaceSwitch ? (
        <Switch
          checked={workspaceVisible}
          disabled={workspaceToggleBusy}
          size="sm"
          className="absolute bottom-[1.05rem] right-3 z-30 scale-110 shadow-sm"
          aria-label={workspaceSwitchLabel}
          title={workspaceSwitchLabel}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          onCheckedChange={onWorkspaceVisibilityChange}
        />
      ) : null}
    </div>
  )
}

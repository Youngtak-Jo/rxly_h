"use client"

import type { ReactNode } from "react"
import { IconLoader2 } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

export type DocumentAmbientState =
  | "idle"
  | "saving"
  | "updating"
  | "generating"

interface DocumentShellProps {
  topActions?: ReactNode
  notice?: ReactNode
  footerMeta?: ReactNode
  footerActions?: ReactNode
  ambientState?: DocumentAmbientState
  loading?: boolean
  loadingLabel?: string
  error?: string | null
  empty?: boolean
  emptyMessage?: string
  children?: ReactNode
  className?: string
  contentClassName?: string
}

export function DocumentShell({
  topActions,
  notice,
  footerMeta,
  footerActions,
  ambientState = "idle",
  loading = false,
  loadingLabel,
  error,
  empty = false,
  emptyMessage,
  children,
  className,
  contentClassName,
}: DocumentShellProps) {
  const showEmptyState = !loading && empty
  const showContent = !loading && !showEmptyState
  const showFooter =
    !loading &&
    (!showEmptyState || !!error) &&
    !!(footerMeta || footerActions)

  return (
    <section
      data-ambient-state={ambientState}
      className={cn(
        "consultation-document-shell mx-auto w-full max-w-4xl",
        className
      )}
    >
      <div className="consultation-document-shell__inner">
        <div className="consultation-document-shell__surface">
          <div
            className="consultation-document-shell__inset-glow"
            aria-hidden="true"
          />
          <div
            className={cn(
              "consultation-document-shell__content space-y-5 px-5 py-5 sm:px-7 sm:py-7",
              contentClassName
            )}
          >
            {topActions ? (
              <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
                {topActions}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            {notice}

            {loading ? (
              <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-muted-foreground">
                <IconLoader2 className="size-4 animate-spin" />
                <span>{loadingLabel}</span>
              </div>
            ) : null}

            {showEmptyState ? (
              <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed border-border/70 px-6 py-12 text-center text-sm text-muted-foreground">
                <p className="max-w-xl leading-6">{emptyMessage}</p>
              </div>
            ) : null}

            {showContent ? children : null}

            {showFooter ? (
              <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border/70 pt-4">
                <div className="flex min-h-8 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-5 text-muted-foreground">
                  {footerMeta}
                </div>
                {footerActions ? (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {footerActions}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

interface DocumentSectionProps {
  title: string
  description?: string | null
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function DocumentSection({
  title,
  description,
  actions,
  children,
  className,
}: DocumentSectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold tracking-[-0.01em] text-foreground">
            {title}
          </h3>
          {description ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  )
}

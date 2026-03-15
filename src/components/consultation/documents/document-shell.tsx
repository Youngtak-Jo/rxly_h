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
              "consultation-document-shell__content space-y-4 px-4 py-4 sm:space-y-5 sm:px-7 sm:py-7",
              contentClassName
            )}
          >
            {topActions ? (
              <div className="flex min-h-7 flex-wrap items-center justify-between gap-2 sm:min-h-8">
                {topActions}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-[13px] text-destructive sm:px-4 sm:py-3 sm:text-sm">
                {error}
              </div>
            ) : null}

            {notice}

            {loading ? (
              <div className="flex min-h-44 items-center justify-center gap-2 text-[13px] text-muted-foreground sm:min-h-52 sm:text-sm">
                <IconLoader2 className="size-4 animate-spin" />
                <span>{loadingLabel}</span>
              </div>
            ) : null}

            {showEmptyState ? (
              <div className="flex min-h-44 items-center justify-center rounded-lg border border-dashed border-border/70 px-4 py-8 text-center text-[13px] text-muted-foreground sm:min-h-52 sm:px-6 sm:py-12 sm:text-sm">
                <p className="max-w-xl leading-5 sm:leading-6">{emptyMessage}</p>
              </div>
            ) : null}

            {showContent ? children : null}

            {showFooter ? (
              <div className="flex flex-wrap items-end justify-between gap-2.5 border-t border-border/70 pt-3 sm:gap-3 sm:pt-4">
                <div className="flex min-h-7 flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] leading-[1.125rem] text-muted-foreground sm:min-h-8 sm:gap-x-3 sm:text-[11px] sm:leading-5">
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
    <section className={cn("space-y-2.5 sm:space-y-3", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2.5 sm:gap-3">
        <div className="space-y-1">
          <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-foreground sm:text-sm">
            {title}
          </h3>
          {description ? (
            <p className="text-[13px] leading-5 text-muted-foreground sm:text-sm sm:leading-6">
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

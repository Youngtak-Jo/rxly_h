"use client"

import {
  type CSSProperties,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { RefreshCw } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminNav } from "@/components/admin/admin-nav"

type AdminRefreshContextValue = {
  refreshToken: number
  triggerRefresh: () => void
}

const AdminRefreshContext = createContext<AdminRefreshContextValue | null>(null)

export function useAdminRefreshToken(): number {
  const context = useContext(AdminRefreshContext)
  if (!context) {
    throw new Error("useAdminRefreshToken must be used inside AdminShell")
  }
  return context.refreshToken
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("AdminShell")
  const [refreshToken, setRefreshToken] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const refreshTimerRef = useRef<number | null>(null)

  const triggerRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }

    setIsRefreshing(true)
    setRefreshToken(Date.now())
    refreshTimerRef.current = window.setTimeout(() => {
      setIsRefreshing(false)
      refreshTimerRef.current = null
    }, 700)
  }, [])

  const refreshValue = useMemo(
    () => ({ refreshToken, triggerRefresh }),
    [refreshToken, triggerRefresh]
  )

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current)
      }
    }
  }, [])

  return (
    <AdminRefreshContext.Provider value={refreshValue}>
      <SidebarProvider
        className="!h-svh"
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as CSSProperties
        }
      >
        <AdminNav />

        <SidebarInset className="overflow-hidden">
          <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background px-4 lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold md:text-base">
                {t("title")}
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                {t("description")}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={triggerRefresh}
            >
              <RefreshCw className={cn("size-4", isRefreshing ? "animate-spin" : "")} />
              {t("refresh")}
            </Button>
          </header>

          <div className="border-b bg-muted/30 shadow-[inset_0_-1px_0_hsl(var(--border))] backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <AdminFilterBar />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 lg:py-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AdminRefreshContext.Provider>
  )
}

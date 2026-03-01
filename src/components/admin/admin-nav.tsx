"use client"

import Link from "next/link"
import type { ComponentType } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Database,
  FileWarning,
  LayoutDashboard,
  Shield,
  Users,
  Workflow,
  Bot,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { parseAdminFilters, filtersToSearchParams } from "@/lib/admin/filters"

type NavItem = {
  href: string
  key: string
  icon: ComponentType<{ className?: string }>
}

type NavGroup = {
  key: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    key: "operations",
    items: [
      {
        href: "/admin/home",
        key: "home",
        icon: LayoutDashboard,
      },
      {
        href: "/admin/triage",
        key: "triage",
        icon: AlertTriangle,
      },
      {
        href: "/admin/users",
        key: "users",
        icon: Users,
      },
      {
        href: "/admin/sessions",
        key: "sessions",
        icon: Activity,
      },
    ],
  },
  {
    key: "analytics",
    items: [
      {
        href: "/admin/funnel",
        key: "funnel",
        icon: Workflow,
      },
      {
        href: "/admin/cohorts",
        key: "cohorts",
        icon: BarChart3,
      },
      {
        href: "/admin/ai-ops",
        key: "aiOps",
        icon: Bot,
      },
    ],
  },
  {
    key: "governance",
    items: [
      {
        href: "/admin/compliance",
        key: "compliance",
        icon: FileWarning,
      },
      {
        href: "/admin/data-quality",
        key: "dataQuality",
        icon: Database,
      },
    ],
  },
]

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true
  return pathname.startsWith(`${href}/`)
}

export function AdminNav() {
  const t = useTranslations("AdminNav")
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const filters = parseAdminFilters(searchParams)
  const query = filtersToSearchParams(filters).toString()

  return (
    <Sidebar variant="inset" collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center gap-2 rounded-md border bg-card p-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Shield className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{t("title")}</div>
            <div className="truncate text-xs text-muted-foreground">
              {t("description")}
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.key}>
            <SidebarGroupLabel>{t(`groups.${group.key}`)}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(pathname, item.href)}
                    tooltip={t(`items.${item.key}.description`)}
                  >
                    <Link href={`${item.href}?${query}`}>
                      <item.icon className="size-4" />
                      <span>{t(`items.${item.key}.label`)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}

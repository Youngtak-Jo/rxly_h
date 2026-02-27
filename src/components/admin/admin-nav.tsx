"use client"

import Link from "next/link"
import type { ComponentType } from "react"
import { usePathname, useSearchParams } from "next/navigation"
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
  label: string
  icon: ComponentType<{ className?: string }>
  description: string
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operations",
    items: [
      {
        href: "/admin/home",
        label: "Home",
        icon: LayoutDashboard,
        description: "KPI snapshot and urgent incidents",
      },
      {
        href: "/admin/triage",
        label: "Triage",
        icon: AlertTriangle,
        description: "Incident queue and workflow",
      },
      {
        href: "/admin/users",
        label: "Users",
        icon: Users,
        description: "Risk-prioritized users",
      },
      {
        href: "/admin/sessions",
        label: "Sessions",
        icon: Activity,
        description: "Problem session drilldowns",
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        href: "/admin/funnel",
        label: "Funnel",
        icon: Workflow,
        description: "Stage conversion and drop-offs",
      },
      {
        href: "/admin/cohorts",
        label: "Cohorts",
        icon: BarChart3,
        description: "D1 / D7 / D30 retention",
      },
      {
        href: "/admin/ai-ops",
        label: "AI Ops",
        icon: Bot,
        description: "Failure, latency, cost by model",
      },
    ],
  },
  {
    label: "Governance",
    items: [
      {
        href: "/admin/compliance",
        label: "Compliance",
        icon: FileWarning,
        description: "PHI reveal and export signals",
      },
      {
        href: "/admin/data-quality",
        label: "Data Quality",
        icon: Database,
        description: "Transcript and telemetry quality",
      },
    ],
  },
]

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true
  return pathname.startsWith(`${href}/`)
}

export function AdminNav() {
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
            <div className="truncate text-sm font-semibold">Admin Console</div>
            <div className="truncate text-xs text-muted-foreground">
              Intelligence workspace
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(pathname, item.href)}
                    tooltip={item.description}
                  >
                    <Link href={`${item.href}?${query}`}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
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

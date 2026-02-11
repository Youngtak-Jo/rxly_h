"use client"

import * as React from "react"
import {
  IconActivity,
  IconHelp,
  IconInnerShadowTop,
  IconSettings,
  IconStethoscope,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSessions } from "@/components/nav-sessions"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Dr. Smith",
    email: "dr.smith@clinic.com",
    avatar: "",
  },
  navMain: [
    {
      title: "Consultation",
      url: "/consultation",
      icon: IconStethoscope,
    },
    {
      title: "Activity",
      url: "#",
      icon: IconActivity,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Help",
      url: "#",
      icon: IconHelp,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/consultation">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Rxly</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSessions />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}

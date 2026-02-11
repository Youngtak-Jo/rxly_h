"use client"

import { IconBulb, IconFileText } from "@tabler/icons-react"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain() {
  const { activeTab, setActiveTab } = useConsultationTabStore()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Live Insights"
              isActive={activeTab === "insights"}
              onClick={() => setActiveTab("insights")}
              className={`transition-all duration-300 ease-in-out ${activeTab === "insights" ? "!bg-primary !text-primary-foreground !font-normal hover:!bg-primary/90 hover:!text-primary-foreground" : ""}`}
            >
              <IconBulb />
              <span>Live Insights</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Consultation Record"
              isActive={activeTab === "record"}
              onClick={() => setActiveTab("record")}
              className={`transition-all duration-300 ease-in-out ${activeTab === "record" ? "!bg-primary !text-primary-foreground !font-normal hover:!bg-primary/90 hover:!text-primary-foreground" : ""}`}
            >
              <IconFileText />
              <span>Consultation Record</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

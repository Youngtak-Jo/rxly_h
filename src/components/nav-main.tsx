"use client"

import { IconBulb, IconFileText, IconLoader2, IconStethoscope } from "@tabler/icons-react"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useDdxStore } from "@/stores/ddx-store"
import { useInsightsStore } from "@/stores/insights-store"
import { useRecordStore } from "@/stores/record-store"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain() {
  const { activeTab, setActiveTab } = useConsultationTabStore()
  const diagnosisCount = useDdxStore((s) => s.diagnoses.length)
  const isDdxProcessing = useDdxStore((s) => s.isProcessing)
  const isInsightsProcessing = useInsightsStore((s) => s.isProcessing)
  const isRecordGenerating = useRecordStore((s) => s.isGenerating)

  const activeStyle = "!bg-primary !text-primary-foreground !font-normal hover:!bg-primary/90 hover:!text-primary-foreground"

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Live Insights"
              isActive={activeTab === "insights"}
              onClick={() => setActiveTab("insights")}
              className={`transition-all duration-300 ease-in-out ${activeTab === "insights" ? activeStyle : ""}`}
            >
              <IconBulb />
              <span>Live Insights</span>
            </SidebarMenuButton>
            {isInsightsProcessing && (
              <SidebarMenuBadge>
                <IconLoader2 className={`size-3 animate-spin ${activeTab === "insights" ? "text-primary-foreground" : ""}`} />
              </SidebarMenuBadge>
            )}
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Differential Diagnosis"
              isActive={activeTab === "ddx"}
              onClick={() => setActiveTab("ddx")}
              className={`transition-all duration-300 ease-in-out ${activeTab === "ddx" ? activeStyle : ""}`}
            >
              <IconStethoscope />
              <span>Differential Dx</span>
            </SidebarMenuButton>
            {isDdxProcessing && diagnosisCount === 0 && (
              <SidebarMenuBadge>
                <IconLoader2 className={`size-3 animate-spin ${activeTab === "ddx" ? "text-primary-foreground" : ""}`} />
              </SidebarMenuBadge>
            )}
            {diagnosisCount > 0 && (
              <SidebarMenuBadge
                className={`${isDdxProcessing ? "animate-pulse" : ""} ${activeTab === "ddx" ? "text-primary-foreground" : ""}`}
              >
                {diagnosisCount}
              </SidebarMenuBadge>
            )}
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Consultation Record"
              isActive={activeTab === "record"}
              onClick={() => setActiveTab("record")}
              className={`transition-all duration-300 ease-in-out ${activeTab === "record" ? activeStyle : ""}`}
            >
              <IconFileText />
              <span>Consultation Record</span>
            </SidebarMenuButton>
            {isRecordGenerating && (
              <SidebarMenuBadge>
                <IconLoader2 className={`size-3 animate-spin ${activeTab === "record" ? "text-primary-foreground" : ""}`} />
              </SidebarMenuBadge>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

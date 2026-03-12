"use client"

import { IconBulb, IconFileText, IconStethoscope } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useDdxStore } from "@/stores/ddx-store"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain() {
  const t = useTranslations("ConsultationTabs")
  const { activeTab, setActiveTab } = useConsultationTabStore()
  const diagnosisCount = useDdxStore((s) => s.diagnoses.length)
  const isDdxProcessing = useDdxStore((s) => s.isProcessing)

  const activeStyle = "!bg-primary !text-primary-foreground !font-normal hover:!bg-primary/90 hover:!text-primary-foreground"

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t("insights")}
              isActive={activeTab === "insights"}
              onClick={() => setActiveTab("insights")}
              className={`transition-all duration-300 ease-in-out ${activeTab === "insights" ? activeStyle : ""}`}
            >
              <IconBulb />
              <span>{t("insights")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t("ddx")}
              isActive={activeTab === "ddx"}
              onClick={() => setActiveTab("ddx")}
              className={`transition-all duration-300 ease-in-out ${activeTab === "ddx" ? activeStyle : ""}`}
            >
              <IconStethoscope />
              <span>{t("ddx")}</span>
            </SidebarMenuButton>
            {diagnosisCount > 0 && (
              <SidebarMenuBadge
                className={isDdxProcessing ? "animate-pulse" : ""}
              >
                {diagnosisCount}
              </SidebarMenuBadge>
            )}
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t("documents")}
              isActive={activeTab === "documents"}
              onClick={() => setActiveTab("documents")}
              className={`transition-all duration-300 ease-in-out ${activeTab === "documents" ? activeStyle : ""}`}
            >
              <IconFileText />
              <span>{t("documents")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

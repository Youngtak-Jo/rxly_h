"use client"

import { IconBulb, IconFileText, IconStethoscope } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"
import { useDdxStore } from "@/stores/ddx-store"
import {
  BUILT_IN_RECORD_TEMPLATE_ID,
  buildDocumentTabId,
} from "@/lib/documents/constants"

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
  const recordTabId = buildDocumentTabId(BUILT_IN_RECORD_TEMPLATE_ID)

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
              tooltip={t("record")}
              isActive={activeTab === recordTabId}
              onClick={() => setActiveTab(recordTabId)}
              className={`transition-all duration-300 ease-in-out ${activeTab === recordTabId ? activeStyle : ""}`}
            >
              <IconFileText />
              <span>{t("record")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

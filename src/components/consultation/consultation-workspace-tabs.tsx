"use client"

import { useRef } from "react"
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconLayoutSidebarRightExpand,
  IconLoader2,
  IconX,
} from "@tabler/icons-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { useDocumentWorkspaceStore } from "@/stores/document-workspace-store"
import { cn } from "@/lib/utils"
import {
  ConsultationTopRail,
  TOP_RAIL_SCROLL_CLASS,
} from "./consultation-top-chrome"
import {
  BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID,
  BUILT_IN_RECORD_TEMPLATE_ID,
  buildDocumentTabId,
} from "@/lib/documents/constants"
import {
  type ConsultationTabId,
  useConsultationTabStore,
} from "@/stores/consultation-tab-store"
import { useDdxStore } from "@/stores/ddx-store"
import { useInsightsStore } from "@/stores/insights-store"
import { usePatientHandoutStore } from "@/stores/patient-handout-store"
import { useRecordStore } from "@/stores/record-store"
import { useResearchStore } from "@/stores/research-store"
import { resolveWorkspaceTabDefinition } from "@/lib/documents/workspace"
import type { WorkspaceTabId } from "@/types/document"

type Translator = (...args: never[]) => string
const JUST_DRAGGED_CLICK_SUPPRESS_MS = 250

function getTabAriaLabel(
  label: string,
  opts: {
    isProcessing: boolean
    hasUnseenUpdate: boolean
    diagnosisCount: number
  },
  t: Translator
) {
  const translate = t as unknown as (
    key: string,
    values?: Record<string, unknown>
  ) => string
  const parts = [label]

  if (opts.isProcessing) {
    parts.push(translate("status.updating"))
  }

  if (opts.hasUnseenUpdate) {
    parts.push(translate("status.newResults"))
  }

  if (opts.diagnosisCount > 0) {
    parts.push(
      translate("status.diagnosisCount", { count: opts.diagnosisCount })
    )
  }

  return parts.join(", ")
}

type WorkspaceTabViewModel = {
  id: WorkspaceTabId
  label: string
  ariaLabel: string
  isActive: boolean
  isProcessing: boolean
  hasUnseenUpdate: boolean
  diagnosisCount: number | null
  closable: boolean
  templateId: string | null
}

const WORKSPACE_TAB_BUTTON_CLASS_NAME = cn(
  "inline-flex h-9 items-center rounded-xl border-0 px-4 text-[15px] font-medium shadow-none outline-none transition-colors",
  "bg-transparent text-foreground/68 hover:bg-transparent hover:text-foreground",
  "focus-visible:ring-2 focus-visible:ring-ring/40",
  "aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
)

const WORKSPACE_ACTION_BUTTON_CLASS_NAME = cn(
  "inline-flex h-9 items-center rounded-xl border-0 px-4 text-[15px] font-medium shadow-none outline-none transition-colors",
  "bg-transparent text-foreground/68 hover:bg-transparent hover:text-foreground",
  "focus-visible:ring-2 focus-visible:ring-ring/40"
)

function WorkspaceTabChip({
  tab,
  onSelect,
  onClose,
}: {
  tab: WorkspaceTabViewModel
  onSelect: (tabId: ConsultationTabId) => void
  onClose: (templateId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: tab.id,
    })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn("relative flex h-9 flex-none items-center", isDragging && "z-10")}
    >
      <button
        type="button"
        aria-current={tab.isActive ? "page" : undefined}
        aria-label={tab.ariaLabel}
        onClick={() => onSelect(tab.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onSelect(tab.id)
          }
        }}
        className={cn(
          WORKSPACE_TAB_BUTTON_CLASS_NAME,
          "w-full",
          tab.closable ? "pr-9" : "pr-4",
          isDragging && "opacity-80 shadow-lg"
        )}
        {...attributes}
        {...listeners}
      >
        <span className="truncate">{tab.label}</span>
        {(tab.isProcessing || tab.hasUnseenUpdate || tab.diagnosisCount !== null) && (
          <span className="ml-1.5 flex items-center gap-1.5">
            {tab.isProcessing ? (
              <IconLoader2
                className={cn(
                  "size-3 animate-spin",
                  tab.isActive ? "text-foreground/70" : "text-muted-foreground"
                )}
              />
            ) : tab.hasUnseenUpdate ? (
              <span className="size-1.5 rounded-full bg-emerald-500" />
            ) : null}
            {tab.diagnosisCount !== null ? (
              <span
                className={cn(
                  "inline-flex min-w-5 items-center justify-center rounded-sm px-1.5 py-0.5 text-[11px] tabular-nums",
                  tab.isActive
                    ? "bg-muted text-foreground"
                    : "bg-background/65 text-muted-foreground"
                )}
              >
                {tab.diagnosisCount}
              </span>
            ) : null}
          </span>
        )}
      </button>

      {tab.closable && tab.templateId ? (
        <button
          type="button"
          aria-label={`Close ${tab.label}`}
          className={cn(
            "absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-black/5 hover:text-foreground",
            tab.isActive && "text-foreground/70"
          )}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            onClose(tab.templateId!)
          }}
        >
          <IconX className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}

export function ConsultationWorkspaceTabs() {
  const locale = useLocale()
  const t = useTranslations("ConsultationTabs")
  const tTranscript = useTranslations("TranscriptViewer")
  const tHeader = useTranslations("SiteHeader")
  const activeTab = useConsultationTabStore((state) => state.activeTab)
  const setActiveTab = useConsultationTabStore((state) => state.setActiveTab)
  const unseenUpdates = useConsultationTabStore((state) => state.unseenUpdates)
  const syncWithTabOrder = useConsultationTabStore((state) => state.syncWithTabOrder)
  const isTranscriptCollapsed = useConsultationTabStore(
    (state) => state.isTranscriptCollapsed
  )
  const toggleTranscript = useConsultationTabStore((state) => state._toggleTranscript)

  const tabOrder = useDocumentWorkspaceStore((state) => state.tabOrder)
  const installedDocuments = useDocumentWorkspaceStore(
    (state) => state.installedDocuments
  )
  const uninstallDocument = useDocumentWorkspaceStore(
    (state) => state.uninstallDocument
  )
  const installDocument = useDocumentWorkspaceStore((state) => state.installDocument)
  const persistTabOrder = useDocumentWorkspaceStore((state) => state.persistTabOrder)

  const diagnosisCount = useDdxStore((state) => state.diagnoses.length)
  const isDdxProcessing = useDdxStore((state) => state.isProcessing)
  const isInsightsProcessing = useInsightsStore((state) => state.isProcessing)
  const isRecordGenerating = useRecordStore((state) => state.isGenerating)
  const isResearchStreaming = useResearchStore((state) => state.isStreaming)
  const isPatientHandoutGenerating = usePatientHandoutStore(
    (state) => state.isGenerating
  )
  const justDraggedRef = useRef<{ tabId: WorkspaceTabId; at: number } | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 140,
        tolerance: 8,
      },
    })
  )
  const showTranscriptToggle = !!toggleTranscript && isTranscriptCollapsed
  const systemLabels = {
    insights: t("insights"),
    ddx: t("ddx"),
    research: t("research"),
  }

  const processingByTab = {
    insights: isInsightsProcessing,
    ddx: isDdxProcessing,
    research: isResearchStreaming,
    [buildDocumentTabId(BUILT_IN_RECORD_TEMPLATE_ID)]: isRecordGenerating,
    [buildDocumentTabId(BUILT_IN_PATIENT_HANDOUT_TEMPLATE_ID)]:
      isPatientHandoutGenerating,
  } satisfies Partial<Record<WorkspaceTabId, boolean>>

  const tabViewModels = tabOrder
    .map((tabId) => resolveWorkspaceTabDefinition(tabId, installedDocuments, systemLabels))
    .filter((tab): tab is NonNullable<typeof tab> => !!tab)
    .map<WorkspaceTabViewModel>((tab) => {
      const isProcessing = processingByTab[tab.id] ?? false
      const hasUnseenUpdate = !!unseenUpdates[tab.id] && activeTab !== tab.id
      const showDiagnosisCount = tab.id === "ddx" && diagnosisCount > 0

      return {
        id: tab.id,
        label: tab.title,
        ariaLabel: getTabAriaLabel(
          tab.title,
          {
            isProcessing,
            hasUnseenUpdate,
            diagnosisCount: tab.id === "ddx" ? diagnosisCount : 0,
          },
          t
        ),
        isActive: activeTab === tab.id,
        isProcessing,
        hasUnseenUpdate,
        diagnosisCount: showDiagnosisCount ? diagnosisCount : null,
        closable: tab.closable,
        templateId: tab.templateId,
      }
    })

  const handleSelectTab = (tabId: ConsultationTabId) => {
    const dragged = justDraggedRef.current
    if (dragged) {
      const elapsed = Date.now() - dragged.at
      if (elapsed < JUST_DRAGGED_CLICK_SUPPRESS_MS && dragged.tabId === tabId) {
        return
      }
      if (elapsed >= JUST_DRAGGED_CLICK_SUPPRESS_MS) {
        justDraggedRef.current = null
      }
    }

    setActiveTab(tabId)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = tabOrder.findIndex((tabId) => tabId === active.id)
    const newIndex = tabOrder.findIndex((tabId) => tabId === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    justDraggedRef.current = {
      tabId: active.id as WorkspaceTabId,
      at: Date.now(),
    }

    const nextTabOrder = arrayMove(tabOrder, oldIndex, newIndex)

    try {
      const snapshot = await persistTabOrder(nextTabOrder, locale)
      syncWithTabOrder(snapshot.tabOrder)
    } catch (error) {
      console.error("Failed to persist workspace tab order", error)
      toast.error("Failed to save tab order")
    }
  }

  const handleCloseDocumentTab = async (templateId: string) => {
    const existingDocument = installedDocuments.find(
      (document) => document.templateId === templateId
    )
    if (!existingDocument) return

    const previousTabOrder = [...tabOrder]
    const closingTabId = buildDocumentTabId(templateId)
    const closingIndex = previousTabOrder.findIndex((tabId) => tabId === closingTabId)
    const filteredBefore = previousTabOrder.filter((tabId) => tabId !== closingTabId)
    const fallbackActiveTab =
      closingIndex > 0
        ? previousTabOrder[closingIndex - 1]
        : (filteredBefore[0] ?? "insights")

    try {
      const snapshot = await uninstallDocument(templateId, locale)
      syncWithTabOrder(snapshot.tabOrder)
      if (activeTab === closingTabId && snapshot.tabOrder.includes(fallbackActiveTab)) {
        setActiveTab(fallbackActiveTab)
      }
      toast.success(`${existingDocument.title} removed from workspace`, {
        action: {
          label: "Undo",
          onClick: () => {
            void installDocument(
              templateId,
              existingDocument.installedVersionId,
              locale
            )
              .then(() => persistTabOrder(previousTabOrder, locale))
              .then((restoredSnapshot) => {
                syncWithTabOrder(restoredSnapshot.tabOrder)
                setActiveTab(buildDocumentTabId(templateId))
              })
              .catch((error) => {
                console.error("Failed to restore document tab", error)
                toast.error("Failed to restore document")
              })
          },
        },
      })
    } catch (error) {
      console.error("Failed to uninstall document", error)
      toast.error("Failed to remove document")
    }
  }

  return (
    <ConsultationTopRail className="h-auto min-h-0 items-center overflow-visible border-0 bg-transparent px-2 py-2">
      <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className={cn(TOP_RAIL_SCROLL_CLASS, "h-auto min-h-0 items-center gap-1.5")}>
          <DndContext
            collisionDetection={closestCenter}
            sensors={sensors}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tabViewModels.map((tab) => tab.id)}
              strategy={horizontalListSortingStrategy}
            >
              {tabViewModels.map((tab) => (
                <WorkspaceTabChip
                  key={tab.id}
                  tab={tab}
                  onSelect={handleSelectTab}
                  onClose={handleCloseDocumentTab}
                />
              ))}
            </SortableContext>
          </DndContext>

          {showTranscriptToggle ? (
            <button
              type="button"
              onClick={toggleTranscript ?? undefined}
              aria-label={tHeader("showTranscript")}
              title={tHeader("showTranscript")}
              className={cn("2xl:hidden", WORKSPACE_ACTION_BUTTON_CLASS_NAME)}
            >
              <span className="truncate">{tTranscript("headerTranscript")}</span>
            </button>
          ) : null}
        </div>
      </div>

      {showTranscriptToggle ? (
        <button
          type="button"
          onClick={toggleTranscript ?? undefined}
          aria-label={tHeader("showTranscript")}
          title={tHeader("showTranscript")}
          className={cn(
            "hidden 2xl:inline-flex",
            WORKSPACE_ACTION_BUTTON_CLASS_NAME
          )}
        >
          <IconLayoutSidebarRightExpand className="size-4" />
          <span className="truncate">{tTranscript("headerTranscript")}</span>
        </button>
      ) : null}
    </ConsultationTopRail>
  )
}

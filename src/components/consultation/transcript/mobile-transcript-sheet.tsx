"use client"

import { useTranslations } from "next-intl"

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useConsultationTabStore } from "@/stores/consultation-tab-store"

import { RecordingControls } from "./recording-controls"
import { TranscriptViewer } from "./transcript-viewer"

interface MobileTranscriptSheetProps {
  loading?: boolean
}

function MobileTranscriptSheetSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <div className="border-b px-3 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 flex-1 rounded-2xl" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-hidden p-3">
        <Skeleton className="h-16 w-[78%] rounded-3xl" />
        <Skeleton className="ml-auto h-20 w-[72%] rounded-3xl" />
        <Skeleton className="h-[4.5rem] w-[84%] rounded-3xl" />
        <Skeleton className="ml-auto h-14 w-[58%] rounded-3xl" />
      </div>
    </div>
  )
}

export function MobileTranscriptSheet({
  loading = false,
}: MobileTranscriptSheetProps) {
  const tViewer = useTranslations("TranscriptViewer")
  const isOpen = useConsultationTabStore((state) => state.isMobileTranscriptOpen)
  const setOpen = useConsultationTabStore((state) => state.setMobileTranscriptOpen)

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="w-[min(92vw,32rem)] max-w-none gap-0 p-0"
        aria-describedby={undefined}
      >
        <SheetTitle className="sr-only">{tViewer("headerTranscript")}</SheetTitle>
        {loading ? (
          <MobileTranscriptSheetSkeleton />
        ) : (
          <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
            <RecordingControls />
            <div className="min-h-0 flex-1 overflow-hidden">
              <TranscriptViewer />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

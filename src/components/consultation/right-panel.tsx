"use client"

import { RecordingControls } from "./transcript/recording-controls"
import { TranscriptViewer } from "./transcript/transcript-viewer"
import { useSpeakerIdentification } from "@/hooks/use-speaker-identification"

export function RightPanel() {
  useSpeakerIdentification()

  return (
    <div className="flex h-full flex-col border-l overflow-hidden">
      <RecordingControls />
      <div className="flex-1 min-h-0 overflow-hidden">
        <TranscriptViewer />
      </div>
    </div>
  )
}

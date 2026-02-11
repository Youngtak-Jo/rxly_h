"use client"

import { RecordingControls } from "./transcript/recording-controls"
import { TranscriptViewer } from "./transcript/transcript-viewer"

export function RightPanel() {
  return (
    <div className="flex h-full flex-col border-l">
      <RecordingControls />
      <TranscriptViewer />
    </div>
  )
}

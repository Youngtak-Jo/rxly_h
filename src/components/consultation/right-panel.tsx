"use client"

import { RecordingControls } from "./transcript/recording-controls"
import { TranscriptViewer } from "./transcript/transcript-viewer"
import { NoteInputBar } from "./note-input/note-input-bar"
import { useSpeakerIdentification } from "@/hooks/use-speaker-identification"
import { useDiagnosticHighlights } from "@/hooks/use-diagnostic-highlights"

export function RightPanel() {
  useSpeakerIdentification()
  useDiagnosticHighlights()

  return (
    <div className="flex h-full flex-col border-l overflow-hidden">
      <RecordingControls />
      <div className="flex-1 min-h-0 overflow-hidden">
        <TranscriptViewer />
      </div>
      <NoteInputBar />
    </div>
  )
}

"use client"

import { useState, useCallback, useRef } from "react"
import { RecordingControls } from "./transcript/recording-controls"
import { TranscriptViewer } from "./transcript/transcript-viewer"
import { NoteInputBar, type NoteInputBarHandle } from "./note-input/note-input-bar"
import { IconPhoto } from "@tabler/icons-react"

export function RightPanel() {
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounterRef = useRef(0)
  const noteInputRef = useRef<NoteInputBarHandle>(null)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = 0
    setIsDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      noteInputRef.current?.addFiles(files)
    }
  }, [])

  return (
    <div
      className="flex h-full flex-col border-l overflow-hidden relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <RecordingControls />
      <div className="flex-1 min-h-0 overflow-hidden">
        <TranscriptViewer />
      </div>
      <NoteInputBar ref={noteInputRef} />
      {isDragOver && (
        <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary/40 rounded-lg flex flex-col items-center justify-center z-20 pointer-events-none backdrop-blur-[1px]">
          <IconPhoto className="size-8 text-primary/60 mb-2" />
          <p className="text-sm font-medium text-primary/80">Drop images here</p>
        </div>
      )}
    </div>
  )
}

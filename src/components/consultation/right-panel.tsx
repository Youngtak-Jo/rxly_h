"use client"

import { useState, useCallback, useRef } from "react"
import { useTranslations } from "next-intl"
import { RecordingControls } from "./transcript/recording-controls"
import { TranscriptViewer } from "./transcript/transcript-viewer"
import { IconPhoto } from "@tabler/icons-react"

interface RightPanelProps {
  onAddFiles?: (files: FileList) => void
}

export function RightPanel({ onAddFiles }: RightPanelProps) {
  const t = useTranslations("TranscriptViewer")
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounterRef = useRef(0)

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
      onAddFiles?.(files)
    }
  }, [onAddFiles])

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <RecordingControls />
      <div className="flex-1 min-h-0 overflow-hidden">
        <TranscriptViewer />
      </div>
      {isDragOver && (
        <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary/40 rounded-lg flex flex-col items-center justify-center z-20 pointer-events-none backdrop-blur-[1px]">
          <IconPhoto className="size-8 text-primary/60 mb-2" />
          <p className="text-sm font-medium text-primary/80">{t("dropImagesHere")}</p>
        </div>
      )}
    </div>
  )
}

"use client"

import type { ReactNode } from "react"

import { DocumentBuilderDialog } from "@/components/documents/document-builder-dialog"
import { WorkspaceShell } from "@/components/workspace/workspace-shell"

export default function DocumentsLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <WorkspaceShell header={null} loadDocumentWorkspace={false}>
      {children}
      <DocumentBuilderDialog />
    </WorkspaceShell>
  )
}

import { DocumentStorePage } from "@/components/documents/document-store-page"

export default function NewDocumentPage() {
  return (
    <DocumentStorePage
      initialDialogIntent={{ mode: "create", routeBacked: true }}
    />
  )
}

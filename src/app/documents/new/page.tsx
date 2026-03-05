import { DocumentStorePage } from "@/components/documents/document-store-page"

export default function NewDocumentPage() {
  return (
    <DocumentStorePage
      viewMode="catalog"
      initialDialogIntent={{ mode: "create", routeBacked: true }}
    />
  )
}

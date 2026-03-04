import { DocumentStorePage } from "@/components/documents/document-store-page"

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ templateId: string }>
}) {
  const { templateId } = await params

  return (
    <DocumentStorePage
      initialDialogIntent={{
        mode: "edit",
        templateId,
        routeBacked: true,
      }}
    />
  )
}

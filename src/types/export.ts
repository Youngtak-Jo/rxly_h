export interface PublicDocumentShareResponse {
  shareId: string
  shareUrl: string
  title: string | null
  createdAt: string
  accessCount: number
  lastAccessedAt: string | null
  revokedAt: string | null
}

import pb from '@/lib/pocketbase/client'

export type DocumentCatalog = {
  id: string
  slug: string
  name: string
  description: string
  validity_days: number
  alert_days: number
  rule_version: string
  approval_authority: string
  owner_area: string
  active: boolean
}

export type DocumentVersion = {
  id: string
  collaborator_id: string
  catalog_id: string
  idempotency_key: string
  version_number: number
  status: 'pendente' | 'vigente' | 'historico' | 'rejeitado'
  validity_state: 'pendente' | 'válido' | 'em alerta' | 'vencido' | 'não verificado' | 'histórico'
  issued_on: string
  valid_until?: string
  origin: string
  notes?: string
  file?: string
  approved_by?: string
  approved_at?: string
  created: string
  updated: string
  expand?: { catalog_id?: DocumentCatalog }
}

export function listDocumentCatalogs() {
  return pb.collection('document_catalog').getFullList<DocumentCatalog>({ sort: 'name' })
}

export function listDocumentVersions(collaboratorId: string) {
  const filter = pb.filter('collaborator_id = {:id}', { id: collaboratorId })
  return pb.collection('document_versions').getList<DocumentVersion>(1, 50, {
    filter,
    sort: '-version_number',
  })
}

export async function createDocumentVersion(data: {
  collaboratorId: string
  catalogId: string
  issuedOn: string
  origin: string
  notes: string
  idempotencyKey: string
  file: File
}) {
  const body = new FormData()
  body.append('collaborator_id', data.collaboratorId)
  body.append('catalog_id', data.catalogId)
  body.append('issued_on', data.issuedOn)
  body.append('origin', data.origin)
  body.append('notes', data.notes)
  body.append('idempotency_key', data.idempotencyKey)
  body.append('file', data.file)
  return pb.send<DocumentVersion>('/backend/v1/documents', { method: 'POST', body })
}

export function approveDocumentVersion(id: string) {
  return pb.send<DocumentVersion>(`/backend/v1/documents/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
  })
}

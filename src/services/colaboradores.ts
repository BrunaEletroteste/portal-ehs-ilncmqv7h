import pb from '@/lib/pocketbase/client'

export type Collaborator = {
  id: string
  cpf_sintetico: string
  nome: string
  funcao: string
  estabelecimento: string
  status: 'Ativo' | 'Inativo'
  created: string
  updated: string
}

export type AuditLog = {
  id: string
  action: 'create' | 'update' | 'delete'
  details: string
  actor: string
  before_snapshot?: Record<string, unknown>
  after_snapshot?: Record<string, unknown>
  field_changes?: Record<string, unknown>
  created: string
  expand?: { actor?: { name?: string; email?: string } }
}

export function listCollaborators() {
  return pb.collection('colaboradores').getList<Collaborator>(1, 50, { sort: '-created,nome' })
}

export function createCollaborator(data: Omit<Collaborator, 'id' | 'created' | 'updated'>) {
  return pb.send<Collaborator>('/backend/v1/collaborators', {
    method: 'POST',
    body: data,
  })
}

export function updateCollaborator(
  id: string,
  data: Partial<Pick<Collaborator, 'nome' | 'funcao' | 'estabelecimento' | 'status'>>,
) {
  return pb.send<Collaborator>(`/backend/v1/collaborators/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: data,
  })
}

export function listCollaboratorHistory(recordId: string) {
  const filter = pb.filter('collection_name = {:collection} && record_id = {:recordId}', {
    collection: 'colaboradores',
    recordId,
  })
  return pb.collection('audit_logs').getList<AuditLog>(1, 50, {
    filter,
    sort: '-created',
    expand: 'actor',
  })
}

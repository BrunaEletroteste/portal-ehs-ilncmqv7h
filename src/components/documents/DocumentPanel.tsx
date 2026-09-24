import { useEffect, useState, type FormEvent } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  approveDocumentVersion,
  createDocumentVersion,
  listDocumentCatalogs,
  listDocumentVersions,
  type DocumentCatalog,
  type DocumentVersion,
} from '@/services/documentos'
import type { Collaborator } from '@/services/colaboradores'

type Notice = { type: 'success' | 'error'; text: string }

function dateOnly(value?: string) {
  return value ? value.slice(0, 10) : '—'
}

function statusVariant(status: DocumentVersion['status']) {
  if (status === 'vigente') return 'default' as const
  if (status === 'pendente') return 'secondary' as const
  return 'outline' as const
}

export default function DocumentPanel({
  collaborator,
  isAdmin,
}: {
  collaborator: Collaborator | null
  isAdmin: boolean
}) {
  const [catalogs, setCatalogs] = useState<DocumentCatalog[]>([])
  const [documents, setDocuments] = useState<DocumentVersion[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [issuedOn, setIssuedOn] = useState(() => new Date().toISOString().slice(0, 10))
  const [origin, setOrigin] = useState('Teste sintético')
  const [notes, setNotes] = useState('Fixture aprovado para validação do Portal EHS.')
  const [catalogId, setCatalogId] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID())

  async function refresh() {
    if (!collaborator) {
      setDocuments([])
      return
    }
    const result = await listDocumentVersions(collaborator.id)
    setDocuments(result.items)
  }

  useEffect(() => {
    let active = true
    setNotice(null)
    setFile(null)
    setRequestKey(crypto.randomUUID())
    if (!collaborator) {
      setDocuments([])
      setCatalogs([])
      return () => {
        active = false
      }
    }
    setLoading(true)
    Promise.all([listDocumentCatalogs(), listDocumentVersions(collaborator.id)])
      .then(([catalogItems, documentPage]) => {
        if (!active) return
        setCatalogs(catalogItems.filter((item) => item.active))
        setDocuments(documentPage.items)
        setCatalogId((current) => current || catalogItems.find((item) => item.active)?.id || '')
      })
      .catch((error) => {
        if (active) setNotice({ type: 'error', text: getErrorMessage(error) })
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [collaborator])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!collaborator) return
    if (!catalogId) {
      setNotice({ type: 'error', text: 'Nenhum catálogo documental ativo está disponível.' })
      return
    }
    if (!file) {
      setNotice({ type: 'error', text: 'Selecione um arquivo PDF sintético.' })
      return
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setNotice({ type: 'error', text: 'O arquivo precisa ser PDF.' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setNotice({ type: 'error', text: 'O PDF deve ter no máximo 10 MB.' })
      return
    }

    setSaving(true)
    setNotice(null)
    try {
      await createDocumentVersion({
        collaboratorId: collaborator.id,
        catalogId,
        issuedOn,
        origin,
        notes,
        idempotencyKey: requestKey,
        file,
      })
      await refresh()
      setNotice({ type: 'success', text: 'Versão registrada como pendente de aprovação.' })
      setFile(null)
      setRequestKey(crypto.randomUUID())
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) })
    } finally {
      setSaving(false)
    }
  }

  async function handleApprove(id: string) {
    setApprovingId(id)
    setNotice(null)
    try {
      await approveDocumentVersion(id)
      await refresh()
      setNotice({ type: 'success', text: 'Versão aprovada e marcada como vigente.' })
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) })
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <Card className="mt-6 border-sky-200 shadow-md">
      <CardHeader>
        <CardTitle className="text-xl">Documentos versionados</CardTitle>
        <CardDescription>
          {collaborator
            ? `Documentos de ${collaborator.nome}. A fixture é sintética e não representa regra legal.`
            : 'Selecione um colaborador para registrar e consultar documentos.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {notice && (
          <Alert variant={notice.type === 'error' ? 'destructive' : 'default'}>
            <AlertTitle>
              {notice.type === 'error' ? 'Não foi possível concluir' : 'Tudo certo'}
            </AlertTitle>
            <AlertDescription>{notice.text}</AlertDescription>
          </Alert>
        )}
        {!collaborator ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            A consulta documental aparecerá aqui após selecionar um colaborador.
          </div>
        ) : (
          <>
            <form
              className="grid gap-4 rounded-xl bg-slate-50 p-4 md:grid-cols-2"
              onSubmit={handleSubmit}
            >
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="document-catalog">Tipo documental / regra sintética</Label>
                <select
                  id="document-catalog"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={catalogId}
                  onChange={(event) => setCatalogId(event.target.value)}
                  disabled={loading || catalogs.length === 0}
                >
                  {catalogs.map((catalog) => (
                    <option key={catalog.id} value={catalog.id}>
                      {catalog.name} · {catalog.validity_days} dias · regra {catalog.rule_version}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="document-issued-on">Data de emissão</Label>
                <Input
                  id="document-issued-on"
                  type="date"
                  required
                  value={issuedOn}
                  onChange={(event) => setIssuedOn(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document-origin">Origem</Label>
                <Input
                  id="document-origin"
                  required
                  minLength={2}
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="document-file">PDF sintético</Label>
                <Input
                  id="document-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  required
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                />
                <p className="text-xs text-slate-500">
                  Máximo 10 MB. O upload fica pendente até aprovação.
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="document-notes">Observação</Label>
                <Input
                  id="document-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
              <div className="flex items-end md:col-span-2">
                <Button type="submit" disabled={saving || loading || catalogs.length === 0}>
                  {saving ? 'Enviando PDF…' : 'Registrar nova versão'}
                </Button>
              </div>
            </form>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Histórico documental</h3>
                  <p className="text-sm text-slate-500">
                    A versão vigente substitui a anterior sem apagá-la.
                  </p>
                </div>
                <Badge variant="outline">{documents.length} versão(ões)</Badge>
              </div>
              {loading ? (
                <p className="text-sm text-slate-500">Carregando documentos…</p>
              ) : documents.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                  Nenhuma versão registrada.
                </p>
              ) : (
                <div className="space-y-3">
                  {documents.map((document) => (
                    <div key={document.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">Versão {document.version_number}</p>
                            <Badge variant={statusVariant(document.status)}>
                              {document.status}
                            </Badge>
                            <Badge variant="outline">{document.validity_state}</Badge>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            Emissão: {dateOnly(document.issued_on)} · Validade calculada:{' '}
                            {dateOnly(document.valid_until)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Arquivo: {document.file || 'não informado'} · Origem: {document.origin}
                          </p>
                        </div>
                        {isAdmin && document.status === 'pendente' && (
                          <Button
                            size="sm"
                            onClick={() => handleApprove(document.id)}
                            disabled={approvingId === document.id}
                          >
                            {approvingId === document.id ? 'Aprovando…' : 'Aprovar versão'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

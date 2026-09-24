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
  reprocessDocumentVersion,
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
  const [pendingReason, setPendingReason] = useState('Regra documental não cadastrada')
  const [catalogId, setCatalogId] = useState('')
  const [reprocessCatalogs, setReprocessCatalogs] = useState<Record<string, string>>({})
  const [reprocessFiles, setReprocessFiles] = useState<Record<string, File | null>>({})
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [reprocessingId, setReprocessingId] = useState<string | null>(null)
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
    setPendingReason('Regra documental não cadastrada')
    setReprocessCatalogs({})
    setReprocessFiles({})
    setRequestKey(crypto.randomUUID())
    setCatalogId('')
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
        const activeCatalogs = catalogItems.filter((item) => item.active)
        setCatalogs(activeCatalogs)
        setDocuments(documentPage.items)
        setCatalogId(activeCatalogs[0]?.id || '')
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
    if (file && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setNotice({ type: 'error', text: 'O arquivo precisa ser PDF.' })
      return
    }
    if (file && file.size > 10 * 1024 * 1024) {
      setNotice({ type: 'error', text: 'O PDF deve ter no máximo 10 MB.' })
      return
    }
    if (pendingReason.length > 500) {
      setNotice({ type: 'error', text: 'O motivo da pendência deve ter no máximo 500 caracteres.' })
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
        pendingReason: pendingReason.trim(),
        idempotencyKey: requestKey,
        file: file || undefined,
      })
      await refresh()
      setNotice({
        type: 'success',
        text: catalogId
          ? 'Versão registrada como pendente de aprovação.'
          : 'Pendência registrada sem regra aplicável. Corrija-a no histórico abaixo.',
      })
      setFile(null)
      setPendingReason('Regra documental não cadastrada')
      setRequestKey(crypto.randomUUID())
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) })
    } finally {
      setSaving(false)
    }
  }

  async function handleReprocess(document: DocumentVersion) {
    const targetCatalogId = reprocessCatalogs[document.id] || document.catalog_id || ''
    const replacementFile = reprocessFiles[document.id] || undefined
    if (!targetCatalogId) {
      setNotice({ type: 'error', text: 'Selecione o catálogo que corrige a pendência.' })
      return
    }
    if (
      replacementFile &&
      replacementFile.type !== 'application/pdf' &&
      !replacementFile.name.toLowerCase().endsWith('.pdf')
    ) {
      setNotice({ type: 'error', text: 'O arquivo de correção precisa ser PDF.' })
      return
    }
    if (replacementFile && replacementFile.size > 10 * 1024 * 1024) {
      setNotice({ type: 'error', text: 'O PDF de correção deve ter no máximo 10 MB.' })
      return
    }

    setReprocessingId(document.id)
    setNotice(null)
    try {
      await reprocessDocumentVersion(document.id, {
        catalogId: targetCatalogId,
        file: replacementFile,
      })
      await refresh()
      setReprocessFiles((current) => ({ ...current, [document.id]: null }))
      setNotice({
        type: 'success',
        text: `Versão ${document.version_number} corrigida e reprocessada; permanece pendente até aprovação.`,
      })
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) })
    } finally {
      setReprocessingId(null)
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
                  disabled={loading}
                >
                  <option value="">Sem regra aplicável — registrar como pendente</option>
                  {catalogs.map((catalog) => (
                    <option key={catalog.id} value={catalog.id}>
                      {catalog.name} · {catalog.validity_days} dias · regra {catalog.rule_version}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">
                  Sem regra aplicável, a versão não poderá ser aprovada até a correção.
                </p>
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
                <Label htmlFor="document-file">
                  PDF sintético (opcional para registrar pendência)
                </Label>
                <Input
                  id="document-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                />
                <p className="text-xs text-slate-500">
                  Máximo 10 MB. Sem PDF, a versão ficará pendente até o arquivo ser corrigido.
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="document-pending-reason">Motivo ou observação da pendência</Label>
                <Input
                  id="document-pending-reason"
                  maxLength={500}
                  value={pendingReason}
                  onChange={(event) => setPendingReason(event.target.value)}
                />
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
                <Button type="submit" disabled={saving || loading}>
                  {saving ? 'Enviando…' : 'Registrar nova versão'}
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
                  {documents.map((document) => {
                    const correctionCatalogId =
                      reprocessCatalogs[document.id] || document.catalog_id || ''
                    return (
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
                              Arquivo: {document.file || 'não informado'} · Regra:{' '}
                              {document.catalog_id ? 'associada' : 'não cadastrada'}
                            </p>
                            {document.pending_reason && (
                              <p className="mt-2 text-xs font-medium text-amber-700">
                                Pendência: {document.pending_reason}
                              </p>
                            )}
                            {document.reprocess_count ? (
                              <p className="mt-1 text-xs text-slate-500">
                                Reprocessamentos: {document.reprocess_count}
                              </p>
                            ) : null}
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
                        {document.status === 'pendente' && (
                          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <p className="text-sm font-semibold text-amber-900">
                              Corrigir pendência
                            </p>
                            <p className="mt-1 text-xs text-amber-800">
                              O mesmo ID e número da versão serão preservados. Após a correção, a
                              versão continuará pendente até aprovação.
                            </p>
                            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                              <div className="space-y-1">
                                <Label htmlFor={`reprocess-catalog-${document.id}`}>
                                  Catálogo aprovado
                                </Label>
                                <select
                                  id={`reprocess-catalog-${document.id}`}
                                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                                  value={correctionCatalogId}
                                  onChange={(event) =>
                                    setReprocessCatalogs((current) => ({
                                      ...current,
                                      [document.id]: event.target.value,
                                    }))
                                  }
                                >
                                  <option value="">Selecione o catálogo</option>
                                  {catalogs.map((catalog) => (
                                    <option key={catalog.id} value={catalog.id}>
                                      {catalog.name} · regra {catalog.rule_version}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor={`reprocess-file-${document.id}`}>
                                  Novo PDF (opcional se já existir)
                                </Label>
                                <Input
                                  id={`reprocess-file-${document.id}`}
                                  type="file"
                                  accept="application/pdf,.pdf"
                                  onChange={(event) =>
                                    setReprocessFiles((current) => ({
                                      ...current,
                                      [document.id]: event.target.files?.[0] || null,
                                    }))
                                  }
                                />
                              </div>
                              <Button
                                type="button"
                                onClick={() => handleReprocess(document)}
                                disabled={reprocessingId === document.id}
                              >
                                {reprocessingId === document.id
                                  ? 'Reprocessando…'
                                  : 'Corrigir e reprocessar'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

routerAdd(
  'POST',
  '/backend/v1/documents/{id}/reprocess',
  (e) => {
    if (!e.auth) return e.forbiddenError('Autenticação necessária.')

    const id = e.request.pathValue('id')
    const body = e.requestInfo().body || {}
    const catalogId = typeof body.catalog_id === 'string' ? body.catalog_id.trim() : ''
    let files = []
    try {
      files = e.findUploadedFiles('file')
    } catch (error) {
      const message = String(error).toLowerCase()
      if (message.indexOf('no such file') < 0) {
        $app
          .logger()
          .error('Falha ao ler arquivo de correção', 'error', String(error), 'recordId', id)
        return e.badRequestError('Não foi possível validar o arquivo enviado.')
      }
    }

    if (!/^[a-z0-9]{15}$/.test(id)) return e.badRequestError('Documento inválido.')
    if (!/^[a-z0-9]{15}$/.test(catalogId))
      return e.badRequestError('Selecione um catálogo documental ativo para corrigir a pendência.')
    if (files.length > 1) return e.badRequestError('Envie no máximo um arquivo PDF.')

    let responseData
    try {
      $app.runInTransaction((txApp) => {
        const record = txApp.findRecordById('document_versions', id)
        if (record.getString('status') !== 'pendente')
          throw new BadRequestError('Somente versões pendentes podem ser reprocessadas.')

        const catalog = txApp.findRecordById('document_catalog', catalogId)
        if (!catalog.getBool('active'))
          throw new BadRequestError('O catálogo selecionado está inativo.')

        const currentFile = record.getString('file')
        if (!currentFile && files.length === 0)
          throw new BadRequestError('Anexe um PDF para corrigir o arquivo pendente.')

        const collaboratorId = record.getString('collaborator_id')
        const versions = txApp.findRecordsByFilter(
          'document_versions',
          "collaborator_id = '" + collaboratorId + "' && catalog_id = '" + catalogId + "'",
          '-version_number',
          100,
          0,
        )
        for (const previous of versions) {
          if (
            previous.id !== record.id &&
            previous.getInt('version_number') === record.getInt('version_number')
          )
            throw new BadRequestError(
              'Já existe uma versão com este número para o catálogo selecionado. Nenhuma alteração foi aplicada.',
            )
        }

        const issuedOn = record.getString('issued_on').slice(0, 10)
        const expiry = new Date(issuedOn + 'T00:00:00Z')
        expiry.setUTCDate(expiry.getUTCDate() + catalog.getInt('validity_days'))
        const validUntil = expiry.toISOString().slice(0, 10)
        const before = {
          id: record.id,
          catalog_id: record.getString('catalog_id'),
          status: record.getString('status'),
          validity_state: record.getString('validity_state'),
          valid_until: record.getString('valid_until'),
          pending_reason: record.getString('pending_reason'),
          file: currentFile,
        }

        record.set('catalog_id', catalog.id)
        record.set('status', 'pendente')
        record.set('validity_state', 'pendente')
        record.set('valid_until', validUntil + ' 00:00:00.000Z')
        record.set('pending_reason', 'Correção aplicada; aguardando aprovação administrativa')
        record.set('reprocess_count', record.getInt('reprocess_count') + 1)
        record.set('reprocessed_at', new Date().toISOString())
        if (files.length === 1) record.set('file', files[0])
        record.set('updated_by', e.auth.id)
        txApp.save(record)

        const audit = new Record(txApp.findCollectionByNameOrId('audit_logs'))
        audit.set('collection_name', 'document_versions')
        audit.set('record_id', record.id)
        audit.set('action', 'update')
        audit.set('actor', e.auth.id)
        audit.set('details', 'Pendência corrigida e versão reprocessada sem criar duplicata')
        audit.set('before_snapshot', before)
        audit.set('after_snapshot', {
          id: record.id,
          catalog_id: catalog.id,
          version_number: record.getInt('version_number'),
          status: 'pendente',
          validity_state: 'pendente',
          valid_until: validUntil,
          pending_reason: 'Correção aplicada; aguardando aprovação administrativa',
          reprocess_count: record.getInt('reprocess_count'),
          file: record.getString('file'),
        })
        audit.set('field_changes', {
          catalog_id: { before: before.catalog_id, after: catalog.id },
          pending_reason: {
            before: before.pending_reason,
            after: 'Correção aplicada; aguardando aprovação administrativa',
          },
          reprocessed: true,
        })
        txApp.save(audit)

        responseData = {
          id: record.id,
          collaborator_id: collaboratorId,
          catalog_id: catalog.id,
          version_number: record.getInt('version_number'),
          status: 'pendente',
          validity_state: 'pendente',
          issued_on: issuedOn,
          valid_until: validUntil,
          pending_reason: 'Correção aplicada; aguardando aprovação administrativa',
          reprocess_count: record.getInt('reprocess_count'),
          file: record.getString('file'),
          reprocessed: true,
        }
      })
    } catch (error) {
      const message = String(error)
      if (
        message.indexOf('pendentes') >= 0 ||
        message.indexOf('catálogo') >= 0 ||
        message.indexOf('Anexe') >= 0 ||
        message.indexOf('Já existe') >= 0
      ) {
        return e.badRequestError(message)
      }
      $app
        .logger()
        .error('Falha ao reprocessar versão documental', 'error', message, 'recordId', id)
      return e.badRequestError(
        'Não foi possível corrigir a versão. Nenhuma alteração parcial foi publicada.',
      )
    }

    return e.json(200, responseData)
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/documents',
  (e) => {
    if (!e.auth) return e.forbiddenError('Autenticação necessária.')

    const body = e.requestInfo().body || {}
    const collaboratorId =
      typeof body.collaborator_id === 'string' ? body.collaborator_id.trim() : ''
    const catalogId = typeof body.catalog_id === 'string' ? body.catalog_id.trim() : ''
    const idempotencyKey =
      typeof body.idempotency_key === 'string' ? body.idempotency_key.trim() : ''
    const issuedOn = typeof body.issued_on === 'string' ? body.issued_on.trim() : ''
    const origin = typeof body.origin === 'string' ? body.origin.trim() : ''
    const notes = typeof body.notes === 'string' ? body.notes.trim() : ''
    const files = e.findUploadedFiles('file')

    if (!/^[a-z0-9]{15}$/.test(collaboratorId) || !/^[a-z0-9]{15}$/.test(catalogId)) {
      return e.badRequestError('Colaborador ou catálogo inválido.')
    }
    if (!/^[A-Za-z0-9._:-]{10,100}$/.test(idempotencyKey)) {
      return e.badRequestError('Chave de repetição inválida.')
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(issuedOn)) {
      return e.badRequestError('Informe a data de emissão no formato AAAA-MM-DD.')
    }
    if (Number.isNaN(new Date(issuedOn + 'T00:00:00Z').getTime())) {
      return e.badRequestError('A data de emissão é inválida.')
    }
    if (origin.length < 2 || origin.length > 120) {
      return e.badRequestError('Informe a origem do documento.')
    }
    if (files.length !== 1) {
      return e.badRequestError('Envie exatamente um arquivo PDF.')
    }

    try {
      const existing = $app.findFirstRecordByData(
        'document_versions',
        'idempotency_key',
        idempotencyKey,
      )
      return e.json(200, {
        id: existing.id,
        collaborator_id: existing.getString('collaborator_id'),
        catalog_id: existing.getString('catalog_id'),
        version_number: existing.getInt('version_number'),
        status: existing.getString('status'),
        validity_state: existing.getString('validity_state'),
        issued_on: existing.getString('issued_on'),
        valid_until: existing.getString('valid_until'),
        origin: existing.getString('origin'),
        file: existing.getString('file'),
        idempotent: true,
      })
    } catch (_) {}

    let responseData
    try {
      $app.runInTransaction((txApp) => {
        const collaborator = txApp.findRecordById('colaboradores', collaboratorId)
        const catalog = txApp.findRecordById('document_catalog', catalogId)
        if (!catalog.getBool('active')) throw new BadRequestError('O catálogo está inativo.')

        const versions = txApp.findRecordsByFilter(
          'document_versions',
          "collaborator_id = '" + collaboratorId + "' && catalog_id = '" + catalogId + "'",
          '-version_number',
          100,
          0,
        )
        let nextVersion = 1
        for (const version of versions) {
          if (version.getInt('version_number') >= nextVersion)
            nextVersion = version.getInt('version_number') + 1
        }

        const issuedDate = new Date(issuedOn + 'T00:00:00Z')
        issuedDate.setUTCDate(issuedDate.getUTCDate() + catalog.getInt('validity_days'))
        const provisionalValidUntil = issuedDate.toISOString().slice(0, 10)
        const record = new Record(txApp.findCollectionByNameOrId('document_versions'))
        record.set('collaborator_id', collaborator.id)
        record.set('catalog_id', catalog.id)
        record.set('idempotency_key', idempotencyKey)
        record.set('version_number', nextVersion)
        record.set('status', 'pendente')
        record.set('validity_state', 'pendente')
        record.set('issued_on', issuedOn + ' 00:00:00.000Z')
        record.set('valid_until', provisionalValidUntil + ' 00:00:00.000Z')
        record.set('origin', origin)
        record.set('notes', notes)
        record.set('file', files[0])
        record.set('created_by', e.auth.id)
        record.set('updated_by', e.auth.id)
        txApp.save(record)

        const audit = new Record(txApp.findCollectionByNameOrId('audit_logs'))
        audit.set('collection_name', 'document_versions')
        audit.set('record_id', record.id)
        audit.set('action', 'create')
        audit.set('actor', e.auth.id)
        audit.set('details', 'Versão documental sintética criada e aguardando aprovação')
        audit.set('after_snapshot', {
          id: record.id,
          collaborator_id: collaborator.id,
          catalog_id: catalog.id,
          version_number: nextVersion,
          status: 'pendente',
          validity_state: 'pendente',
          issued_on: issuedOn,
          origin: origin,
        })
        audit.set('field_changes', { created: true })
        txApp.save(audit)

        responseData = {
          id: record.id,
          collaborator_id: collaborator.id,
          catalog_id: catalog.id,
          version_number: nextVersion,
          status: 'pendente',
          validity_state: 'pendente',
          issued_on: issuedOn,
          valid_until: provisionalValidUntil,
          origin: origin,
          file: record.getString('file'),
          idempotent: false,
        }
      })
    } catch (error) {
      $app.logger().error('Falha ao criar versão documental', 'error', String(error))
      return e.badRequestError(
        'Não foi possível registrar a versão. Nenhuma versão parcial foi publicada.',
      )
    }

    return e.json(201, responseData)
  },
  $apis.requireAuth(),
)

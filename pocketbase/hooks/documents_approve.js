routerAdd(
  'POST',
  '/backend/v1/documents/{id}/approve',
  (e) => {
    if (!e.auth) return e.forbiddenError('Autenticação necessária.')
    if (e.auth.getString('role') !== 'admin')
      return e.forbiddenError('Somente a autoridade de aprovação pode aprovar documentos.')

    const id = e.request.pathValue('id')
    if (!/^[a-z0-9]{15}$/.test(id)) return e.badRequestError('Documento inválido.')

    let responseData
    try {
      $app.runInTransaction((txApp) => {
        const record = txApp.findRecordById('document_versions', id)
        if (record.getString('status') !== 'pendente')
          throw new BadRequestError('Somente versões pendentes podem ser aprovadas.')
        const catalogId = record.getString('catalog_id')
        if (!catalogId)
          throw new BadRequestError('Corrija a pendência e associe um catálogo antes da aprovação.')
        if (!record.getString('file'))
          throw new BadRequestError('Anexe um arquivo PDF antes da aprovação.')

        const catalog = txApp.findRecordById('document_catalog', catalogId)
        if (!catalog.getBool('active'))
          throw new BadRequestError('O catálogo da versão está inativo e não pode ser aprovado.')
        const collaboratorId = record.getString('collaborator_id')
        const versions = txApp.findRecordsByFilter(
          'document_versions',
          "collaborator_id = '" + collaboratorId + "' && catalog_id = '" + catalogId + "'",
          '-version_number',
          100,
          0,
        )

        for (const previous of versions) {
          if (previous.id !== record.id && previous.getString('status') === 'vigente') {
            const before = {
              id: previous.id,
              status: previous.getString('status'),
              validity_state: previous.getString('validity_state'),
            }
            previous.set('status', 'historico')
            previous.set('validity_state', 'histórico')
            previous.set('updated_by', e.auth.id)
            txApp.save(previous)

            const previousAudit = new Record(txApp.findCollectionByNameOrId('audit_logs'))
            previousAudit.set('collection_name', 'document_versions')
            previousAudit.set('record_id', previous.id)
            previousAudit.set('action', 'update')
            previousAudit.set('actor', e.auth.id)
            previousAudit.set(
              'details',
              'Versão anterior preservada no histórico após aprovação de nova versão',
            )
            previousAudit.set('before_snapshot', before)
            previousAudit.set('after_snapshot', {
              id: previous.id,
              status: 'historico',
              validity_state: 'histórico',
            })
            previousAudit.set('field_changes', {
              status: { before: 'vigente', after: 'historico' },
            })
            txApp.save(previousAudit)
          }
        }

        const issuedOn = record.getString('issued_on').slice(0, 10)
        const expiry = new Date(issuedOn + 'T00:00:00Z')
        expiry.setUTCDate(expiry.getUTCDate() + catalog.getInt('validity_days'))
        const validUntil = expiry.toISOString().slice(0, 10)
        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)
        const expiryAtMidnight = new Date(validUntil + 'T00:00:00Z')
        let validityState = 'válido'
        if (today.getTime() > expiryAtMidnight.getTime()) validityState = 'vencido'
        else if (catalog.getInt('alert_days') > 0) {
          const alertStart = new Date(expiryAtMidnight.getTime())
          alertStart.setUTCDate(alertStart.getUTCDate() - catalog.getInt('alert_days'))
          if (today.getTime() >= alertStart.getTime()) validityState = 'em alerta'
        }

        const before = {
          id: record.id,
          status: record.getString('status'),
          validity_state: record.getString('validity_state'),
          valid_until: record.getString('valid_until'),
          pending_reason: record.getString('pending_reason'),
        }
        record.set('status', 'vigente')
        record.set('validity_state', validityState)
        record.set('valid_until', validUntil + ' 00:00:00.000Z')
        record.set('pending_reason', '')
        record.set('approved_by', e.auth.id)
        record.set('approved_at', new Date().toISOString())
        record.set('updated_by', e.auth.id)
        txApp.save(record)

        const audit = new Record(txApp.findCollectionByNameOrId('audit_logs'))
        audit.set('collection_name', 'document_versions')
        audit.set('record_id', record.id)
        audit.set('action', 'update')
        audit.set('actor', e.auth.id)
        audit.set('details', 'Versão documental aprovada e tornada vigente')
        audit.set('before_snapshot', before)
        audit.set('after_snapshot', {
          id: record.id,
          status: 'vigente',
          validity_state: validityState,
          valid_until: validUntil,
          approved_by: e.auth.id,
        })
        audit.set('field_changes', {
          status: { before: 'pendente', after: 'vigente' },
          validity_state: { before: 'pendente', after: validityState },
          pending_reason: { before: before.pending_reason, after: '' },
        })
        txApp.save(audit)

        responseData = {
          id: record.id,
          collaborator_id: collaboratorId,
          catalog_id: catalogId,
          version_number: record.getInt('version_number'),
          status: 'vigente',
          validity_state: validityState,
          issued_on: issuedOn,
          valid_until: validUntil,
          file: record.getString('file'),
        }
      })
    } catch (error) {
      const message = String(error)
      if (
        message.indexOf('pendentes') >= 0 ||
        message.indexOf('Corrija') >= 0 ||
        message.indexOf('Anexe') >= 0 ||
        message.indexOf('inativo') >= 0
      ) {
        return e.badRequestError(message)
      }
      $app.logger().error('Falha ao aprovar versão documental', 'error', message, 'recordId', id)
      return e.badRequestError('Não foi possível aprovar a versão documental.')
    }

    return e.json(200, responseData)
  },
  $apis.requireAuth(),
)

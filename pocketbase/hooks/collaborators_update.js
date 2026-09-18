routerAdd(
  'PATCH',
  '/backend/v1/collaborators/{id}',
  (e) => {
    if (!e.auth) return e.forbiddenError('Autenticação necessária.')

    const body = e.requestInfo().body || {}
    const id = e.request.pathValue('id')
    const allowed = ['nome', 'funcao', 'estabelecimento', 'status']
    let updated
    let changes

    try {
      $app.runInTransaction((txApp) => {
        const record = txApp.findRecordById('colaboradores', id)
        const before = {
          id: record.id,
          cpf_sintetico: record.getString('cpf_sintetico'),
          nome: record.getString('nome'),
          funcao: record.getString('funcao'),
          estabelecimento: record.getString('estabelecimento'),
          status: record.getString('status'),
        }
        changes = {}

        for (const field of allowed) {
          if (Object.prototype.hasOwnProperty.call(body, field)) {
            const value = typeof body[field] === 'string' ? body[field].trim() : ''
            if (field === 'status' && value !== 'Ativo' && value !== 'Inativo')
              throw new BadRequestError('Status inválido.')
            if (field !== 'status' && (value.length < 2 || value.length > 160))
              throw new BadRequestError('Campo de cadastro inválido.')
            if (value !== record.getString(field)) {
              changes[field] = { before: record.getString(field), after: value }
              record.set(field, value)
            }
          }
        }

        if (Object.keys(changes).length === 0)
          throw new BadRequestError('Nenhuma alteração foi informada.')
        record.set('updated_by', e.auth.id)
        txApp.save(record)
        updated = record

        const after = {
          id: record.id,
          cpf_sintetico: record.getString('cpf_sintetico'),
          nome: record.getString('nome'),
          funcao: record.getString('funcao'),
          estabelecimento: record.getString('estabelecimento'),
          status: record.getString('status'),
        }
        const audit = new Record(txApp.findCollectionByNameOrId('audit_logs'))
        audit.set('collection_name', 'colaboradores')
        audit.set('record_id', record.id)
        audit.set('action', 'update')
        audit.set('actor', e.auth.id)
        audit.set('details', 'Cadastro de colaborador atualizado')
        audit.set('before_snapshot', before)
        audit.set('after_snapshot', after)
        audit.set('field_changes', changes)
        txApp.save(audit)
      })
    } catch (error) {
      if (
        String(error).indexOf('Status inválido') >= 0 ||
        String(error).indexOf('Campo de cadastro inválido') >= 0 ||
        String(error).indexOf('Nenhuma alteração') >= 0
      ) {
        return e.badRequestError(String(error))
      }
      $app.logger().error('Falha ao atualizar colaborador', 'error', String(error), 'recordId', id)
      return e.badRequestError('Não foi possível atualizar o colaborador.')
    }

    return e.json(200, {
      id: updated.id,
      cpf_sintetico: updated.getString('cpf_sintetico'),
      nome: updated.getString('nome'),
      funcao: updated.getString('funcao'),
      estabelecimento: updated.getString('estabelecimento'),
      status: updated.getString('status'),
    })
  },
  $apis.requireAuth(),
)

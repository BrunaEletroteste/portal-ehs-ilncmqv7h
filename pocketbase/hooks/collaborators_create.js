routerAdd(
  'POST',
  '/backend/v1/collaborators',
  (e) => {
    if (!e.auth) return e.forbiddenError('Autenticação necessária.')

    const body = e.requestInfo().body || {}
    const cpfSintetico = typeof body.cpf_sintetico === 'string' ? body.cpf_sintetico.trim() : ''
    const nome = typeof body.nome === 'string' ? body.nome.trim() : ''
    const funcao = typeof body.funcao === 'string' ? body.funcao.trim() : ''
    const estabelecimento =
      typeof body.estabelecimento === 'string' ? body.estabelecimento.trim() : ''
    const status = body.status === 'Inativo' ? 'Inativo' : body.status === 'Ativo' ? 'Ativo' : ''

    if (!/^TESTE-CPF-[0-9]{3}$/.test(cpfSintetico)) {
      return e.badRequestError('Use um identificador sintético no formato TESTE-CPF-001.')
    }
    if (nome.length < 2 || nome.length > 120)
      return e.badRequestError('Informe o nome do colaborador.')
    if (funcao.length < 2 || funcao.length > 120) return e.badRequestError('Informe a função.')
    if (estabelecimento.length < 2 || estabelecimento.length > 160)
      return e.badRequestError('Informe o estabelecimento.')
    if (!status) return e.badRequestError('Informe o status do colaborador.')

    let created
    try {
      $app.runInTransaction((txApp) => {
        try {
          txApp.findFirstRecordByData('colaboradores', 'cpf_sintetico', cpfSintetico)
          throw new BadRequestError('Este identificador sintético já está cadastrado.')
        } catch (error) {
          if (String(error).indexOf('já está cadastrado') >= 0) throw error
        }

        const collection = txApp.findCollectionByNameOrId('colaboradores')
        const record = new Record(collection)
        record.set('cpf_sintetico', cpfSintetico)
        record.set('nome', nome)
        record.set('funcao', funcao)
        record.set('estabelecimento', estabelecimento)
        record.set('status', status)
        record.set('created_by', e.auth.id)
        record.set('updated_by', e.auth.id)
        txApp.save(record)
        created = record

        const audit = new Record(txApp.findCollectionByNameOrId('audit_logs'))
        audit.set('collection_name', 'colaboradores')
        audit.set('record_id', record.id)
        audit.set('action', 'create')
        audit.set('actor', e.auth.id)
        audit.set('details', 'Colaborador sintético criado')
        audit.set('after_snapshot', {
          id: record.id,
          cpf_sintetico: cpfSintetico,
          nome: nome,
          funcao: funcao,
          estabelecimento: estabelecimento,
          status: status,
        })
        audit.set('field_changes', { created: true })
        txApp.save(audit)
      })
    } catch (error) {
      if (String(error).indexOf('já está cadastrado') >= 0)
        return e.badRequestError('Este identificador sintético já está cadastrado.')
      $app.logger().error('Falha ao criar colaborador', 'error', String(error))
      return e.badRequestError('Não foi possível criar o colaborador.')
    }

    return e.json(201, {
      id: created.id,
      cpf_sintetico: created.getString('cpf_sintetico'),
      nome: created.getString('nome'),
      funcao: created.getString('funcao'),
      estabelecimento: created.getString('estabelecimento'),
      status: created.getString('status'),
    })
  },
  $apis.requireAuth(),
)

routerAdd('POST', '/backend/v1/setup/admin', (e) => {
  const body = e.requestInfo().body || {}
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''
  const passwordConfirm = typeof body.passwordConfirm === 'string' ? body.passwordConfirm : ''

  if ($app.countRecords('users') > 0) {
    return e.badRequestError('A configuração inicial já foi concluída.')
  }
  if (name.length < 2 || name.length > 120) {
    return e.badRequestError('Informe um nome entre 2 e 120 caracteres.')
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return e.badRequestError('Informe um e-mail válido.')
  }
  if (password.length < 12 || password !== passwordConfirm) {
    return e.badRequestError(
      'A senha deve ter ao menos 12 caracteres e coincidir com a confirmação.',
    )
  }

  try {
    $app.runInTransaction((txApp) => {
      const users = txApp.findCollectionByNameOrId('users')
      const user = new Record(users)
      user.setEmail(email)
      user.setPassword(password)
      user.setVerified(true)
      user.set('name', name)
      user.set('role', 'admin')
      user.set('active', true)
      txApp.save(user)

      const auditLogs = txApp.findCollectionByNameOrId('audit_logs')
      const audit = new Record(auditLogs)
      audit.set('collection_name', 'users')
      audit.set('record_id', user.id)
      audit.set('action', 'create')
      audit.set('actor', user.id)
      audit.set('details', 'Administrador inicial criado')
      audit.set('after_snapshot', { id: user.id, name: name, role: 'admin', active: true })
      audit.set('field_changes', { created: true })
      txApp.save(audit)
    })
  } catch (error) {
    $app.logger().error('Falha ao criar administrador inicial', 'error', String(error))
    return e.badRequestError('Não foi possível concluir a configuração inicial.')
  }

  return e.json(201, { message: 'Administrador inicial criado. Faça login para continuar.' })
})

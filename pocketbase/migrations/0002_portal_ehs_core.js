migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['admin', 'ehs'],
          maxSelect: 1,
        }),
      )
    }

    if (!users.fields.getByName('active')) {
      users.fields.add(new BoolField({ name: 'active' }))
    }

    users.createRule = null
    users.updateRule = null
    users.deleteRule = null
    app.save(users)

    const colaboradores = new Collection({
      name: 'colaboradores',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'cpf_sintetico',
          type: 'text',
          required: true,
          min: 1,
          max: 40,
          pattern: '^TESTE-CPF-[0-9]{3}$',
        },
        { name: 'nome', type: 'text', required: true, min: 2, max: 120 },
        { name: 'funcao', type: 'text', required: true, min: 2, max: 120 },
        { name: 'estabelecimento', type: 'text', required: true, min: 2, max: 160 },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Ativo', 'Inativo'],
          maxSelect: 1,
        },
        {
          name: 'created_by',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        {
          name: 'updated_by',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_colaboradores_cpf_sintetico ON colaboradores (cpf_sintetico)',
        'CREATE INDEX idx_colaboradores_nome ON colaboradores (nome)',
      ],
    })
    app.save(colaboradores)

    const auditLogs = new Collection({
      name: 'audit_logs',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'collection_name', type: 'text', required: true, max: 80 },
        { name: 'record_id', type: 'text', required: true, max: 40 },
        {
          name: 'action',
          type: 'select',
          required: true,
          values: ['create', 'update', 'delete'],
          maxSelect: 1,
        },
        {
          name: 'actor',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'details', type: 'text', required: true, max: 500 },
        { name: 'before_snapshot', type: 'json' },
        { name: 'after_snapshot', type: 'json' },
        { name: 'field_changes', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_audit_logs_record ON audit_logs (collection_name, record_id, created DESC)',
      ],
    })
    app.save(auditLogs)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('audit_logs'))
    app.delete(app.findCollectionByNameOrId('colaboradores'))

    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('role')
    users.fields.removeByName('active')
    users.createRule = ''
    users.updateRule = 'id = @request.auth.id'
    users.deleteRule = 'id = @request.auth.id'
    app.save(users)
  },
)

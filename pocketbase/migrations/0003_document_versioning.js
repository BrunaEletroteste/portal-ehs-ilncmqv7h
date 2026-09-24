migrate(
  (app) => {
    const catalogCollection = new Collection({
      name: 'document_catalog',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'slug',
          type: 'text',
          required: true,
          min: 3,
          max: 80,
          pattern: '^[a-z0-9-]+$',
        },
        { name: 'name', type: 'text', required: true, min: 2, max: 120 },
        { name: 'description', type: 'text', max: 500 },
        { name: 'validity_days', type: 'number', required: true, min: 1, max: 3650, onlyInt: true },
        { name: 'alert_days', type: 'number', required: true, min: 0, max: 3650, onlyInt: true },
        { name: 'rule_version', type: 'text', required: true, min: 1, max: 40 },
        { name: 'approval_authority', type: 'text', required: true, min: 2, max: 120 },
        { name: 'owner_area', type: 'text', required: true, min: 2, max: 80 },
        { name: 'active', type: 'bool', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_document_catalog_slug ON document_catalog (slug)'],
    })
    app.save(catalogCollection)

    const catalogId = app.findCollectionByNameOrId('document_catalog').id
    const collaboratorCollectionId = app.findCollectionByNameOrId('colaboradores').id
    const versionsCollection = new Collection({
      name: 'document_versions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'collaborator_id',
          type: 'relation',
          required: true,
          collectionId: collaboratorCollectionId,
          maxSelect: 1,
        },
        {
          name: 'catalog_id',
          type: 'relation',
          required: true,
          collectionId: catalogId,
          maxSelect: 1,
        },
        {
          name: 'idempotency_key',
          type: 'text',
          required: true,
          min: 10,
          max: 100,
          pattern: '^[A-Za-z0-9._:-]+$',
        },
        { name: 'version_number', type: 'number', required: true, min: 1, onlyInt: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pendente', 'vigente', 'historico', 'rejeitado'],
          maxSelect: 1,
        },
        {
          name: 'validity_state',
          type: 'select',
          required: true,
          values: ['pendente', 'válido', 'em alerta', 'vencido', 'não verificado', 'histórico'],
          maxSelect: 1,
        },
        { name: 'issued_on', type: 'date', required: true },
        { name: 'valid_until', type: 'date' },
        { name: 'origin', type: 'text', required: true, min: 2, max: 120 },
        { name: 'notes', type: 'text', max: 500 },
        {
          name: 'file',
          type: 'file',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['application/pdf'],
          protected: true,
        },
        {
          name: 'approved_by',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'approved_at', type: 'date' },
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
        'CREATE UNIQUE INDEX idx_document_versions_idempotency ON document_versions (idempotency_key)',
        'CREATE UNIQUE INDEX idx_document_versions_number ON document_versions (collaborator_id, catalog_id, version_number)',
        'CREATE INDEX idx_document_versions_lookup ON document_versions (collaborator_id, catalog_id, status)',
      ],
    })
    app.save(versionsCollection)

    try {
      app.findFirstRecordByData('document_catalog', 'slug', 'documento-sintetico-teste-ehs')
    } catch (_) {
      const catalog = new Record(app.findCollectionByNameOrId('document_catalog'))
      catalog.set('slug', 'documento-sintetico-teste-ehs')
      catalog.set('name', 'Documento sintético de teste EHS')
      catalog.set(
        'description',
        'Fixture sintética para validar upload, aprovação e versionamento.',
      )
      catalog.set('validity_days', 30)
      catalog.set('alert_days', 0)
      catalog.set('rule_version', 'TESTE-1.0')
      catalog.set('approval_authority', 'Bruna Oliveira')
      catalog.set('owner_area', 'EHS/SST')
      catalog.set('active', true)
      app.save(catalog)
    }
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('document_versions'))
    app.delete(app.findCollectionByNameOrId('document_catalog'))
  },
)

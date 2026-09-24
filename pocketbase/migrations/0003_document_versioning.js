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

    const catalog = new Record(app.findCollectionByNameOrId('document_catalog'))
    catalog.set('slug', 'documento-sintetico-teste-ehs')
    catalog.set('name', 'Documento sintético de teste EHS')
    catalog.set('description', 'Fixture sintética para validar upload, aprovação e versionamento.')
    catalog.set('validity_days', 30)
    catalog.set('alert_days', 0)
    catalog.set('rule_version', 'TESTE-1.0')
    catalog.set('approval_authority', 'Bruna Oliveira')
    catalog.set('owner_area', 'EHS/SST')
    catalog.set('active', true)
    app.save(catalog)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('document_catalog'))
  },
)

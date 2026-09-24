migrate(
  (app) => {
    const catalog = new Collection({
      name: 'document_catalog',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'name', type: 'text', required: true, min: 2, max: 120 },
        { name: 'active', type: 'bool', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(catalog)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('document_catalog'))
  },
)

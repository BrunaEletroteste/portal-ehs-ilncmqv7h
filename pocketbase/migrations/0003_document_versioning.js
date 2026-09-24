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
        { name: 'slug', type: 'text', required: true, min: 3, max: 80 },
        { name: 'name', type: 'text', required: true, min: 2, max: 120 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(catalogCollection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('document_catalog'))
  },
)

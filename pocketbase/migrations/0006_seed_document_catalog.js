migrate(
  (app) => {
    const catalogCollection = app.findCollectionByNameOrId('document_catalog')
    let catalog

    try {
      catalog = app.findFirstRecordByData(
        'document_catalog',
        'slug',
        'documento-sintetico-teste-ehs',
      )
    } catch (_) {
      catalog = new Record(catalogCollection)
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
    try {
      app.delete(
        app.findFirstRecordByData('document_catalog', 'slug', 'documento-sintetico-teste-ehs'),
      )
    } catch (_) {}
  },
)

migrate(
  (app) => {
    const versions = app.findCollectionByNameOrId('document_versions')
    const catalogField = versions.fields.getByName('catalog_id')
    if (catalogField) catalogField.required = false

    if (!versions.fields.getByName('pending_reason')) {
      versions.fields.add(new TextField({ name: 'pending_reason', max: 500 }))
    }
    if (!versions.fields.getByName('reprocessed_at')) {
      versions.fields.add(new DateField({ name: 'reprocessed_at' }))
    }
    if (!versions.fields.getByName('reprocess_count')) {
      versions.fields.add(
        new NumberField({ name: 'reprocess_count', min: 0, max: 100, onlyInt: true }),
      )
    }

    app.save(versions)
  },
  (app) => {
    const versions = app.findCollectionByNameOrId('document_versions')
    for (const fieldName of ['reprocess_count', 'reprocessed_at', 'pending_reason']) {
      if (versions.fields.getByName(fieldName)) versions.fields.removeByName(fieldName)
    }
    const catalogField = versions.fields.getByName('catalog_id')
    if (catalogField) catalogField.required = true
    app.save(versions)
  },
)

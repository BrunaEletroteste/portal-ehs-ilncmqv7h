migrate(
  (app) => {
    const catalog = app.findCollectionByNameOrId('document_catalog')

    if (!catalog.fields.getByName('slug')) {
      catalog.fields.add(
        new TextField({
          name: 'slug',
          required: true,
          min: 3,
          max: 80,
          pattern: '^[a-z0-9-]+$',
        }),
      )
    }
    if (!catalog.fields.getByName('description')) {
      catalog.fields.add(new TextField({ name: 'description', max: 500 }))
    }
    if (!catalog.fields.getByName('validity_days')) {
      catalog.fields.add(
        new NumberField({
          name: 'validity_days',
          required: true,
          min: 1,
          max: 3650,
          onlyInt: true,
        }),
      )
    }
    if (!catalog.fields.getByName('alert_days')) {
      catalog.fields.add(
        new NumberField({ name: 'alert_days', required: true, min: 0, max: 3650, onlyInt: true }),
      )
    }
    if (!catalog.fields.getByName('rule_version')) {
      catalog.fields.add(new TextField({ name: 'rule_version', required: true, min: 1, max: 40 }))
    }
    if (!catalog.fields.getByName('approval_authority')) {
      catalog.fields.add(
        new TextField({ name: 'approval_authority', required: true, min: 2, max: 120 }),
      )
    }
    if (!catalog.fields.getByName('owner_area')) {
      catalog.fields.add(new TextField({ name: 'owner_area', required: true, min: 2, max: 80 }))
    }

    app.save(catalog)
  },
  (app) => {
    const catalog = app.findCollectionByNameOrId('document_catalog')
    const fields = [
      'owner_area',
      'approval_authority',
      'rule_version',
      'alert_days',
      'validity_days',
      'description',
      'slug',
    ]
    for (const name of fields) {
      if (catalog.fields.getByName(name)) catalog.fields.removeByName(name)
    }
    app.save(catalog)
  },
)

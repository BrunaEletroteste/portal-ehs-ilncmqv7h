migrate(
  (app) => {
    // 1. Tornar listRule e viewRule públicos em colaboradores para permitir visualização direta sem login obrigatório
    const colaboradores = app.findCollectionByNameOrId('colaboradores')
    colaboradores.listRule = ''
    colaboradores.viewRule = ''

    // Relaxar restrição de cpf_sintetico se existir pattern restritivo
    const cpfField = colaboradores.fields.getByName('cpf_sintetico')
    if (cpfField) {
      cpfField.pattern = ''
      cpfField.required = false
    }

    // Adicionar campos de conformidade em colaboradores para suportar status e exames/ASO
    if (!colaboradores.fields.getByName('conformidade')) {
      colaboradores.fields.add(
        new SelectField({
          name: 'conformidade',
          values: ['em_dia', 'vence_30_dias', 'afastado', 'vencido'],
          maxSelect: 1,
          required: false,
        }),
      )
    }

    if (!colaboradores.fields.getByName('situacao')) {
      colaboradores.fields.add(
        new TextField({
          name: 'situacao',
          required: false,
        }),
      )
    }

    if (!colaboradores.fields.getByName('data_inicio')) {
      colaboradores.fields.add(
        new TextField({
          name: 'data_inicio',
          required: false,
        }),
      )
    }

    if (!colaboradores.fields.getByName('retorno_previsto')) {
      colaboradores.fields.add(
        new TextField({
          name: 'retorno_previsto',
          required: false,
        }),
      )
    }

    if (!colaboradores.fields.getByName('detalhes')) {
      colaboradores.fields.add(
        new TextField({
          name: 'detalhes',
          required: false,
        }),
      )
    }

    if (!colaboradores.fields.getByName('status_afastamento')) {
      colaboradores.fields.add(
        new TextField({
          name: 'status_afastamento',
          required: false,
        }),
      )
    }

    if (!colaboradores.fields.getByName('barra_cor')) {
      colaboradores.fields.add(
        new TextField({
          name: 'barra_cor',
          required: false,
        }),
      )
    }

    if (!colaboradores.fields.getByName('urgencia_grau')) {
      colaboradores.fields.add(
        new NumberField({
          name: 'urgencia_grau',
          required: false,
        }),
      )
    }

    // created_by e updated_by tornados não obrigatórios para possibilitar inserção sem auth
    const createdByField = colaboradores.fields.getByName('created_by')
    if (createdByField) createdByField.required = false
    const updatedByField = colaboradores.fields.getByName('updated_by')
    if (updatedByField) updatedByField.required = false

    app.save(colaboradores)

    // 2. Criar collection 'afastamentos' dedicada
    let afastamentosCol
    try {
      afastamentosCol = app.findCollectionByNameOrId('afastamentos')
    } catch (_) {
      afastamentosCol = new Collection({
        name: 'afastamentos',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: 'colaborador',
            type: 'relation',
            collectionId: colaboradores.id,
            maxSelect: 1,
            required: false,
          },
          { name: 'colaborador_nome', type: 'text', required: true },
          { name: 'situacao', type: 'text', required: true },
          { name: 'inicio', type: 'text', required: true },
          { name: 'retorno_previsto', type: 'text', required: true },
          { name: 'detalhes', type: 'text', required: true },
          { name: 'status', type: 'text', required: true },
          { name: 'barra_cor', type: 'text', required: false },
          { name: 'urgencia', type: 'number', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_afastamentos_colab_nome ON afastamentos (colaborador_nome)'],
      })
      app.save(afastamentosCol)
    }
  },
  (app) => {
    try {
      const afastamentos = app.findCollectionByNameOrId('afastamentos')
      app.delete(afastamentos)
    } catch (_) {}
  },
)

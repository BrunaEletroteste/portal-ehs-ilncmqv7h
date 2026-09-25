migrate(
  (app) => {
    const colabCol = app.findCollectionByNameOrId('colaboradores')
    const afastCol = app.findCollectionByNameOrId('afastamentos')

    // Limpar colaboradores e afastamentos anteriores para manter contagem e dados 100% fiéis
    app.db().newQuery('DELETE FROM afastamentos').execute()
    app.db().newQuery('DELETE FROM colaboradores').execute()

    // 1. Os 3 afastados EXATOS do screenshot
    const afastados = [
      {
        nome: 'Marcos Vinícius Silva',
        situacao: 'Acidente de trabalho',
        inicio: '12/09/2026',
        retorno_previsto: '—',
        detalhes: 'CAT emitida',
        status: 'Afastado',
        barra_cor: 'vermelho', // barra lateral vermelha
        urgencia: 1, // mais urgente
        funcao: 'Operador de Máquinas Pesadas',
        estabelecimento: 'Unidade Industrial 01',
      },
      {
        nome: 'Juliana de Souza Costa',
        situacao: 'Licença médica',
        inicio: '18/09/2026',
        retorno_previsto: '30/10/2026',
        detalhes: 'CID M54',
        status: 'Afastado',
        barra_cor: 'laranja', // barra lateral laranja/amarela
        urgencia: 2,
        funcao: 'Técnica de Segurança do Trabalho',
        estabelecimento: 'Sede Administrativa',
      },
      {
        nome: 'Roberto Almeida Lima',
        situacao: 'Benefício INSS',
        inicio: '21/09/2026',
        retorno_previsto: 'Em perícia',
        detalhes: 'B31',
        status: 'Afastado',
        barra_cor: 'cinza', // barra lateral cinza
        urgencia: 3,
        funcao: 'Eletricista de Alta Tensão',
        estabelecimento: 'Subestação Central',
      },
    ]

    for (let i = 0; i < afastados.length; i++) {
      const a = afastados[i]
      const rec = new Record(colabCol)
      rec.set('cpf_sintetico', 'AF-' + String(i + 1).padStart(3, '0'))
      rec.set('nome', a.nome)
      rec.set('funcao', a.funcao)
      rec.set('estabelecimento', a.estabelecimento)
      rec.set('status', 'Ativo')
      rec.set('conformidade', 'afastado')
      rec.set('situacao', a.situacao)
      rec.set('data_inicio', a.inicio)
      rec.set('retorno_previsto', a.retorno_previsto)
      rec.set('detalhes', a.detalhes)
      rec.set('status_afastamento', a.status)
      rec.set('barra_cor', a.barra_cor)
      rec.set('urgencia_grau', a.urgencia)
      app.save(rec)

      const recAfast = new Record(afastCol)
      recAfast.set('colaborador', rec.id)
      recAfast.set('colaborador_nome', a.nome)
      recAfast.set('situacao', a.situacao)
      recAfast.set('inicio', a.inicio)
      recAfast.set('retorno_previsto', a.retorno_previsto)
      recAfast.set('detalhes', a.detalhes)
      recAfast.set('status', a.status)
      recAfast.set('barra_cor', a.barra_cor)
      recAfast.set('urgencia', a.urgencia)
      app.save(recAfast)
    }

    // 2. Os 5 Vencidos (conformidade: 'vencido')
    const vencidos = [
      {
        nome: 'Carlos Eduardo Santos',
        funcao: 'Soldador Especializado',
        estabelecimento: 'Unidade Industrial 01',
        situacao: 'ASO Periódico Vencido',
        inicio: '01/02/2025',
        retorno_previsto: 'Imediato',
        detalhes: 'Exame clínico + Audiometria pendente',
      },
      {
        nome: 'Fernanda Lima Oliveira',
        funcao: 'Auxiliar de Laboratório Químico',
        estabelecimento: 'Laboratório Central',
        situacao: 'Exame Toxicológico Vencido',
        inicio: '15/02/2025',
        retorno_previsto: 'Imediato',
        detalhes: 'Necessita agendamento prioritário',
      },
      {
        nome: 'Lucas Ribeiro Mendes',
        funcao: 'Montador Industrial',
        estabelecimento: 'Fábrica de Estruturas Metálicas',
        situacao: 'NR-35 Trabalho em Altura Vencida',
        inicio: '20/02/2025',
        retorno_previsto: 'Reciclagem urgente',
        detalhes: 'Treinamento presencial 8h',
      },
      {
        nome: 'Amanda Beatriz Ferreira',
        funcao: 'Operadora de Ponte Rolante',
        estabelecimento: 'Galpão Logístico',
        situacao: 'NR-11 Vencida',
        inicio: '25/02/2025',
        retorno_previsto: 'Imediato',
        detalhes: 'Impedida de operar até renovação',
      },
      {
        nome: 'Rodrigo Gomes Martins',
        funcao: 'Pintor Industrial Jatista',
        estabelecimento: 'Unidade Industrial 02',
        situacao: 'Espirometria Vencida',
        inicio: '28/02/2025',
        retorno_previsto: 'Imediato',
        detalhes: 'Exame de função pulmonar',
      },
    ]

    for (let i = 0; i < vencidos.length; i++) {
      const v = vencidos[i]
      const rec = new Record(colabCol)
      rec.set('cpf_sintetico', 'VENC-' + String(i + 1).padStart(3, '0'))
      rec.set('nome', v.nome)
      rec.set('funcao', v.funcao)
      rec.set('estabelecimento', v.estabelecimento)
      rec.set('status', 'Ativo')
      rec.set('conformidade', 'vencido')
      rec.set('situacao', v.situacao)
      rec.set('data_inicio', v.inicio)
      rec.set('retorno_previsto', v.retorno_previsto)
      rec.set('detalhes', v.detalhes)
      rec.set('status_afastamento', 'Vencido')
      rec.set('barra_cor', 'vermelho')
      rec.set('urgencia_grau', 1)
      app.save(rec)
    }

    // 3. Os 18 Vence em 30 dias (conformidade: 'vence_30_dias')
    const vence30DiasNomes = [
      {
        nome: 'Ana Paula Rodrigues',
        funcao: 'Analista de Qualidade e Segurança',
        estabelecimento: 'Sede Administrativa',
        situacao: 'ASO Periódico',
        venc: '22/03/2025',
        det: 'Consulta médica agendada',
      },
      {
        nome: 'Bruno Henrique Cardoso',
        funcao: 'Operador de Empilhadeira',
        estabelecimento: 'Galpão Logístico',
        situacao: 'NR-11 Validade próxima',
        venc: '25/03/2025',
        det: 'Reciclagem teórica',
      },
      {
        nome: 'Camila Cristina Moreira',
        funcao: 'Técnica em Química',
        estabelecimento: 'Laboratório Central',
        situacao: 'Exame Químico de Controle',
        venc: '26/03/2025',
        det: 'Coleta de sangue',
      },
      {
        nome: 'Daniel Faria Barbosa',
        funcao: 'Caldeireiro Encanador',
        estabelecimento: 'Unidade Industrial 01',
        situacao: 'NR-33 Espaço Confinado',
        venc: '27/03/2025',
        det: 'Treinamento de reciclagem',
      },
      {
        nome: 'Eduardo Silveira Castro',
        funcao: 'Mecânico de Manutenção',
        estabelecimento: 'Oficina Central',
        situacao: 'ASO Periódico',
        venc: '28/03/2025',
        det: 'Audiometria + Raio-X',
      },
      {
        nome: 'Fabiana Antunes Prado',
        funcao: 'Supervisora de Operações',
        estabelecimento: 'Terminal Portuário',
        situacao: 'NR-10 Básico',
        venc: '29/03/2025',
        det: 'Revisão bianual',
      },
      {
        nome: 'Gabriel Nogueira Pires',
        funcao: 'Eletricista Predial',
        estabelecimento: 'Infraestrutura Geral',
        situacao: 'NR-10 SEP',
        venc: '30/03/2025',
        det: 'Curso SEP 40h',
      },
      {
        nome: 'Heloisa Duarte Borges',
        funcao: 'Almoxarife de EPIs',
        estabelecimento: 'Almoxarifado Central',
        situacao: 'ASO Periódico',
        venc: '01/04/2025',
        det: 'Exame clínico geral',
      },
      {
        nome: 'Igor Cavalcante Vieira',
        funcao: 'Operador de Caldeira',
        estabelecimento: 'Unidade Industrial 02',
        situacao: 'NR-13 Caldeiras e Vasos',
        venc: '02/04/2025',
        det: 'Aferição de competência',
      },
      {
        nome: 'Jéssica Santana Ramos',
        funcao: 'Enfermeira do Trabalho',
        estabelecimento: 'Ambulatório Médico',
        situacao: 'ASO Periódico',
        venc: '03/04/2025',
        det: 'Exame clínico periódico',
      },
      {
        nome: 'Leonardo Dias Tavares',
        funcao: 'Motorista Carreteiro',
        estabelecimento: 'Logística e Frota',
        situacao: 'Toxicológico Periódico',
        venc: '04/04/2025',
        det: 'Coleta laboratorial',
      },
      {
        nome: 'Mariana Azevedo Rocha',
        funcao: 'Engenheira de Segurança',
        estabelecimento: 'Sede Administrativa',
        situacao: 'ASO Periódico',
        venc: '05/04/2025',
        det: 'Consulta clínica',
      },
      {
        nome: 'Natália Vasconcelos Rios',
        funcao: 'Operadora de Produção',
        estabelecimento: 'Linha de Montagem',
        situacao: 'Audiometria Anual',
        venc: '06/04/2025',
        det: 'Exame audiométrico',
      },
      {
        nome: 'Otávio Augusto Franco',
        funcao: 'Torneiro Mecânico',
        estabelecimento: 'Oficina Central',
        situacao: 'ASO Periódico',
        venc: '07/04/2025',
        det: 'Acuidade visual + Clínico',
      },
      {
        nome: 'Priscila Macedo Nunes',
        funcao: 'Assistente Administrativo EHS',
        estabelecimento: 'Sede Administrativa',
        situacao: 'ASO Periódico',
        venc: '08/04/2025',
        det: 'Exame de rotina',
      },
      {
        nome: 'Renan Pacheco Guimarães',
        funcao: 'Inspetor de Solda N2',
        estabelecimento: 'Garantia da Qualidade',
        situacao: 'Exame Oftalmológico',
        venc: '08/04/2025',
        det: 'Teste de campimetria',
      },
      {
        nome: 'Sabrina Correia Fontes',
        funcao: 'Higienista Ocupacional',
        estabelecimento: 'Centro Técnico',
        situacao: 'ASO Periódico',
        venc: '09/04/2025',
        det: 'Consulta periódica',
      },
      {
        nome: 'Thiago Valença Barros',
        funcao: 'Riggers / Sinaleiro',
        estabelecimento: 'Pátio de Cargas',
        situacao: 'NR-11 Içamento',
        venc: '09/04/2025',
        det: 'Reciclagem prática',
      },
    ]

    for (let i = 0; i < vence30DiasNomes.length; i++) {
      const item = vence30DiasNomes[i]
      const rec = new Record(colabCol)
      rec.set('cpf_sintetico', 'V30-' + String(i + 1).padStart(3, '0'))
      rec.set('nome', item.nome)
      rec.set('funcao', item.funcao)
      rec.set('estabelecimento', item.estabelecimento)
      rec.set('status', 'Ativo')
      rec.set('conformidade', 'vence_30_dias')
      rec.set('situacao', item.situacao)
      rec.set('data_inicio', '10/03/2025')
      rec.set('retorno_previsto', item.venc)
      rec.set('detalhes', item.det)
      rec.set('status_afastamento', 'Em alerta')
      rec.set('barra_cor', 'laranja')
      rec.set('urgencia_grau', 2)
      app.save(rec)
    }

    // 4. Os 96 "Em dia" (conformidade: 'em_dia')
    // Lista de 96 colaboradores com dados realistas
    const primeirosNomes = [
      'Adriano',
      'Alessandra',
      'Alexandre',
      'Aline',
      'Anderson',
      'André',
      'Andreia',
      'Antônio',
      'Arthur',
      'Bárbara',
      'Beatriz',
      'Bernardo',
      'Bianca',
      'Breno',
      'Caio',
      'Camila',
      'Carla',
      'Carolina',
      'Cassio',
      'Cláudia',
      'Cláudio',
      'Cristiano',
      'Daiane',
      'Daniela',
      'Danilo',
      'David',
      'Débora',
      'Diego',
      'Douglas',
      'Edilson',
      'Elaine',
      'Elias',
      'Eliane',
      'Emerson',
      'Erica',
      'Evandro',
      'Fábio',
      'Fabrício',
      'Felipe',
      'Flávia',
      'Gisela',
      'Guilherme',
      'Gustavo',
      'Helena',
      'Henrique',
      'Hugo',
      'Isabela',
      'Jaqueline',
      'Jefferson',
      'Joana',
      'João Paulo',
      'Jonatas',
      'Jorge',
      'José Carlos',
      'Julio Cesar',
      'Kelly',
      'Larissa',
      'Leandro',
      'Leticia',
      'Lorena',
      'Luan',
      'Luciana',
      'Luiz Felipe',
      'Magno',
      'Marcelo',
      'Marcio',
      'Marcos Paulo',
      'Mateus',
      'Mauricio',
      'Mayara',
      'Michele',
      'Moacir',
      'Murilo',
      'Nathalia',
      'Nilton',
      'Paloma',
      'Patrícia',
      'Paulo Roberto',
      'Pedro Henrique',
      'Rafael',
      'Raquel',
      'Rebeca',
      'Reginaldo',
      'Renata',
      'Ricardo',
      'Rodolfo',
      'Rogério',
      'Ronaldo',
      'Samuel',
      'Sandra',
      'Sérgio',
      'Tatiane',
      'Valéria',
      'Vanessa',
      'Vinícius',
      'Wagner',
    ]

    const sobrenomes = [
      'Albuquerque',
      'Andrade',
      'Barreto',
      'Batista',
      'Borges',
      'Brandão',
      'Campos',
      'Carvalho',
      'Coelho',
      'Correia',
      'Coutinho',
      'Cunha',
      'Dantas',
      'Dias',
      'Diniz',
      'Duarte',
      'Fagundes',
      'Fernandes',
      'Figueiredo',
      'Fonseca',
      'Freitas',
      'Furtado',
      'Gomes',
      'Gonçalves',
      'Guedes',
      'Leal',
      'Leite',
      'Lopes',
      'Machado',
      'Magalhães',
      'Maia',
      'Marques',
      'Medeiros',
      'Melo',
      'Menezes',
      'Miranda',
      'Monteiro',
      'Moraes',
      'Moreira',
      'Moura',
      'Muniz',
      'Nascimento',
      'Neves',
      'Nogueira',
      'Noronha',
      'Pacheco',
      'Paiva',
      'Passos',
      'Peixoto',
      'Pereira',
      'Pinheiro',
      'Pinto',
      'Pires',
      'Porto',
      'Prado',
      'Ramos',
      'Reis',
      'Ribeiro',
      'Rocha',
      'Rodrigues',
      'Sales',
      'Santana',
      'Santos',
      'Saraiva',
      'Silveira',
      'Siqueira',
      'Soares',
      'Sousa',
      'Tavares',
      'Teixeira',
      'Teles',
      'Toledo',
      'Torres',
      'Uchoa',
      'Valente',
      'Vargas',
      'Vasconcelos',
      'Vaz',
      'Veiga',
      'Veloso',
      'Viana',
      'Vieira',
      'Vilar',
      'Xavier',
      'Alves',
      'Barros',
      'Cardoso',
      'Castro',
      'Costa',
      'Ferreira',
      'Lima',
      'Martins',
      'Oliveira',
      'Silva',
      'Souza',
      'Arruda',
    ]

    const funcoesEmDia = [
      'Eletricista de Manutenção',
      'Operador de Caldeira',
      'Técnico Mecânico Industrial',
      'Soldador TIG/MIG',
      'Operador de Ponte Rolante',
      'Auxiliar de Serviços Gerais',
      'Encarregado de Obra',
      'Técnico em Meio Ambiente',
      'Engenheiro Mecânico',
      'Mecânico Lubrificador',
      'Montador Eletromecânico',
      'Operador de Tratamento de Água',
      'Motorista Operacional',
      'Inspetor de Qualidade',
      'Assistente de Logística',
      'Operador de Empilhadeira',
    ]

    const estabelecimentos = [
      'Sede Administrativa',
      'Unidade Industrial 01',
      'Unidade Industrial 02',
      'Galpão Logístico',
      'Terminal Portuário',
      'Laboratório Central',
      'Oficina Central',
      'Subestação Central',
    ]

    for (let i = 0; i < 96; i++) {
      const pNome = primeirosNomes[i % primeirosNomes.length]
      const sNome = sobrenomes[i % sobrenomes.length]
      const nomeCompleto = pNome + ' ' + sNome
      const funcao = funcoesEmDia[i % funcoesEmDia.length]
      const estab = estabelecimentos[i % estabelecimentos.length]

      const rec = new Record(colabCol)
      rec.set('cpf_sintetico', 'OK-' + String(i + 1).padStart(3, '0'))
      rec.set('nome', nomeCompleto)
      rec.set('funcao', funcao)
      rec.set('estabelecimento', estab)
      rec.set('status', 'Ativo')
      rec.set('conformidade', 'em_dia')
      rec.set('situacao', 'ASO Vigente — Regular')
      rec.set('data_inicio', '10/03/2025')
      rec.set('retorno_previsto', 'Validade 2026')
      rec.set('detalhes', 'Exames periódicos em conformidade')
      rec.set('status_afastamento', 'Em dia')
      rec.set('barra_cor', 'verde')
      rec.set('urgencia_grau', 4)
      app.save(rec)
    }
  },
  (app) => {
    app.db().newQuery('DELETE FROM afastamentos').execute()
  },
)

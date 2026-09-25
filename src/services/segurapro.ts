import pb from '@/lib/pocketbase/client'

export type ConformidadeStatus =
  | 'em_dia'
  | 'vence_30_dias'
  | 'afastado'
  | 'vencido'
  | 'afastados'
  | 'vencidos'

export type ColaboradorRecord = {
  id: string
  cpf_sintetico: string
  nome: string
  funcao: string
  estabelecimento: string
  status: 'Ativo' | 'Inativo'
  conformidade: ConformidadeStatus
  situacao: string
  data_inicio: string
  retorno_previsto: string
  detalhes: string
  status_afastamento: string
  barra_cor: 'vermelho' | 'laranja' | 'cinza' | 'verde' | string
  urgencia_grau: number
  created: string
  updated: string
}

export type AfastamentoRecord = {
  id: string
  colaborador: string
  colaborador_nome: string
  situacao: string
  inicio: string
  retorno_previsto: string
  detalhes: string
  status: string
  barra_cor: 'vermelho' | 'laranja' | 'cinza' | string
  urgencia: number
  created: string
  updated: string
}

export type ConformidadeCounts = {
  total: number
  em_dia: number
  vence_30_dias: number
  afastados: number
  vencidos: number
}

export async function fetchAllColaboradores(): Promise<ColaboradorRecord[]> {
  // Buscar todos os 122 colaboradores (suporta paginação até 200)
  const result = await pb.collection('colaboradores').getList<ColaboradorRecord>(1, 200, {
    sort: 'urgencia_grau,nome',
  })
  return result.items
}

export async function fetchAfastamentos(): Promise<AfastamentoRecord[]> {
  const result = await pb.collection('afastamentos').getList<AfastamentoRecord>(1, 50, {
    sort: 'urgencia',
  })
  return result.items
}

export async function fetchConformidadeCounts(): Promise<ConformidadeCounts> {
  // Carrega todos para cálculo rápido e preciso
  const items = await fetchAllColaboradores()
  return {
    total: items.length,
    em_dia: items.filter((c) => c.conformidade === 'em_dia').length,
    vence_30_dias: items.filter((c) => c.conformidade === 'vence_30_dias').length,
    afastados: items.filter((c) => c.conformidade === 'afastado').length,
    vencidos: items.filter((c) => c.conformidade === 'vencido').length,
  }
}

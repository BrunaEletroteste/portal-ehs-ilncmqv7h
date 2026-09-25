import { Calendar, ChevronDown, Loader2, RefreshCw } from 'lucide-react'
import { KpiCards } from './KpiCards'
import { WorkersTable } from './WorkersTable'
import type {
  ColaboradorRecord,
  ConformidadeCounts,
  ConformidadeStatus,
} from '@/services/segurapro'

interface WorkersPageProps {
  collaborators: ColaboradorRecord[]
  counts: ConformidadeCounts
  activeFilter: ConformidadeStatus | null
  onFilterChange: (filter: ConformidadeStatus | null) => void
  loading: boolean
  searchQuery: string
  onRefresh: () => void
}

export function WorkersPage({
  collaborators,
  counts,
  activeFilter,
  onFilterChange,
  loading,
  searchQuery,
  onRefresh,
}: WorkersPageProps) {
  // Normalizar filtro para corresponder com o valor salvo no banco ('afastado'/'afastados', 'vencido'/'vencidos')
  const normalizeStatus = (status: string) => {
    if (status === 'afastados') return 'afastado'
    if (status === 'vencidos') return 'vencido'
    return status
  }

  // Filtragem combinada: filtro de KPI + busca por nome
  const filteredList = collaborators.filter((item) => {
    // 1. Filtro do KPI ativo
    if (activeFilter !== null) {
      const activeNormalized = normalizeStatus(activeFilter)
      const itemNormalized = normalizeStatus(item.conformidade)
      if (itemNormalized !== activeNormalized) {
        return false
      }
    }

    // 2. Busca por texto
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim()
      const matchesName = item.nome.toLowerCase().includes(q)
      const matchesFunction = (item.funcao || '').toLowerCase().includes(q)
      const matchesSituation = (item.situacao || '').toLowerCase().includes(q)
      const matchesDetails = (item.detalhes || '').toLowerCase().includes(q)
      if (!matchesName && !matchesFunction && !matchesSituation && !matchesDetails) {
        return false
      }
    }

    return true
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Trabalhadores</h1>
          <p className="text-sm text-slate-500 mt-0.5">Status de conformidade da equipe</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            title="Atualizar dados do banco"
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Date Selector exactly like screenshot: "Hoje, 10 de Março de 2025" */}
          <button
            type="button"
            className="inline-flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Hoje, 10 de Março de 2025</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <KpiCards counts={counts} activeFilter={activeFilter} onFilterChange={onFilterChange} />

      {/* Total summary caption */}
      <div className="text-sm text-slate-500 font-normal">
        {counts.total} colaboradores no total
      </div>

      {/* Main Table Card */}
      {loading && collaborators.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 flex flex-col items-center justify-center gap-3 shadow-sm">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500">Carregando dados dos colaboradores...</p>
        </div>
      ) : (
        <WorkersTable
          collaborators={filteredList}
          activeFilter={activeFilter}
          onClearFilter={() => onFilterChange(null)}
          totalCount={counts.total}
        />
      )}
    </div>
  )
}

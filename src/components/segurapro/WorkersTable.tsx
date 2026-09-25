import { ArrowUpDown, X } from 'lucide-react'
import type { ColaboradorRecord, ConformidadeStatus } from '@/services/segurapro'

interface WorkersTableProps {
  collaborators: ColaboradorRecord[]
  activeFilter: ConformidadeStatus | null
  onClearFilter: () => void
  totalCount: number
  selectedId?: string | null
  onSelect?: (id: string | null) => void
}

function getFilterLabel(filter: ConformidadeStatus | null, count: number): string {
  if (filter === 'afastados' || filter === 'afastado') {
    return `Afastados (${count})`
  }
  if (filter === 'em_dia') {
    return `Em dia (${count})`
  }
  if (filter === 'vence_30_dias') {
    return `Vence em 30 dias (${count})`
  }
  if (filter === 'vencidos' || filter === 'vencido') {
    return `Vencidos (${count})`
  }
  return `Todos os colaboradores (${count})`
}

function getBarColorClass(barra: string) {
  switch (barra) {
    case 'vermelho':
      return 'bg-red-500'
    case 'laranja':
      return 'bg-amber-500'
    case 'cinza':
      return 'bg-slate-400'
    case 'verde':
      return 'bg-emerald-500'
    default:
      return 'bg-slate-300'
  }
}

function getStatusBadge(statusText: string, conformidade: ConformidadeStatus) {
  if (conformidade === 'afastado' || statusText.toLowerCase() === 'afastado') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100/80 text-red-700">
        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
        Afastado
      </span>
    )
  }

  if (conformidade === 'vencido' || statusText.toLowerCase() === 'vencido') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100/80 text-red-700">
        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
        Vencido
      </span>
    )
  }

  if (conformidade === 'vence_30_dias') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
        Em alerta
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
      Em dia
    </span>
  )
}

export function WorkersTable({
  collaborators,
  activeFilter,
  onClearFilter,
  selectedId,
  onSelect,
}: WorkersTableProps) {
  const headerTitle = getFilterLabel(activeFilter, collaborators.length)

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Table Card Header */}
      <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">{headerTitle}</h2>
          {activeFilter !== null && (
            <button
              type="button"
              onClick={onClearFilter}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <span>Limpar filtro</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
          <span>Ordenado por urgência</span>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 pl-6 pr-4">Colaborador</th>
              <th className="py-3.5 px-4">Situação</th>
              <th className="py-3.5 px-4">Início</th>
              <th className="py-3.5 px-4">Retorno previsto</th>
              <th className="py-3.5 px-4">Detalhes</th>
              <th className="py-3.5 pl-4 pr-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {collaborators.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  Nenhum colaborador encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              collaborators.map((c) => {
                const barColor = getBarColorClass(c.barra_cor)
                const isSelected = selectedId === c.id

                return (
                  <tr
                    key={c.id}
                    tabIndex={0}
                    aria-current={isSelected ? 'true' : undefined}
                    title="Clique para ver o resumo no painel de contexto"
                    onClick={() => onSelect?.(isSelected ? null : c.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onSelect?.(isSelected ? null : c.id)
                      }
                    }}
                    className={`cursor-pointer transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                      isSelected ? 'bg-blue-50' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    {/* Colaborador com barra lateral colorida */}
                    <td className="py-4 pl-0 pr-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`w-1 self-stretch rounded-r ${barColor} mr-5 group-hover:w-1.5 transition-all`}
                        />
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{c.nome}</p>
                          {c.funcao && <p className="text-xs text-slate-400 mt-0.5">{c.funcao}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Situação */}
                    <td className="py-4 px-4 whitespace-nowrap text-slate-700 font-normal">
                      {c.situacao || '—'}
                    </td>

                    {/* Início */}
                    <td className="py-4 px-4 whitespace-nowrap text-slate-600 font-normal">
                      {c.data_inicio || '—'}
                    </td>

                    {/* Retorno previsto */}
                    <td className="py-4 px-4 whitespace-nowrap text-slate-600 font-normal">
                      {c.retorno_previsto || '—'}
                    </td>

                    {/* Detalhes */}
                    <td className="py-4 px-4 whitespace-nowrap text-slate-600 font-normal">
                      {c.detalhes || '—'}
                    </td>

                    {/* Status badge */}
                    <td className="py-4 pl-4 pr-6 whitespace-nowrap">
                      {getStatusBadge(c.status_afastamento || '', c.conformidade)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

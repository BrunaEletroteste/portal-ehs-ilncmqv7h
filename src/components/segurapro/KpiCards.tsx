import { Check, Clock, UserX, AlertTriangle } from 'lucide-react'
import type { ConformidadeStatus } from '@/services/segurapro'

interface KpiCardsProps {
  counts: {
    em_dia: number
    vence_30_dias: number
    afastados: number
    vencidos: number
  }
  activeFilter: ConformidadeStatus | null
  onFilterChange: (filter: ConformidadeStatus | null) => void
}

export function KpiCards({ counts, activeFilter, onFilterChange }: KpiCardsProps) {
  const cards = [
    {
      key: 'em_dia' as ConformidadeStatus,
      label: 'Em dia',
      value: counts.em_dia,
      icon: Check,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    {
      key: 'vence_30_dias' as ConformidadeStatus,
      label: 'Vence em 30 dias',
      value: counts.vence_30_dias,
      icon: Clock,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      key: 'afastados' as ConformidadeStatus,
      label: 'Afastados',
      value: counts.afastados,
      icon: UserX,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      key: 'vencidos' as ConformidadeStatus,
      label: 'Vencidos',
      value: counts.vencidos,
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        const isSelected = activeFilter === card.key

        return (
          <button
            key={card.key}
            type="button"
            onClick={() => {
              // Clicar no mesmo cartão alterna/limpa o filtro
              if (isSelected) {
                onFilterChange(null)
              } else {
                onFilterChange(card.key)
              }
            }}
            className={`text-left p-4 rounded-xl transition-all duration-150 relative cursor-pointer ${
              isSelected
                ? 'bg-[#eff6ff] border-2 border-[#2563eb] shadow-sm'
                : 'bg-white border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${card.iconBg} ${card.iconColor}`}
              >
                <Icon className="w-6 h-6" strokeWidth={2.4} />
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-xs text-slate-500 font-medium block">{card.label}</span>

                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                    {card.value}
                  </span>

                  {isSelected && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#dbeafe] text-[#1d4ed8]">
                      ✓ Filtro ativo
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

import { Building2, CalendarDays, MousePointerClick } from 'lucide-react'
import type { ColaboradorRecord } from '@/services/segurapro'

function initials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  const letters: string[] = []
  if (parts.length > 0 && parts[0]) letters.push(parts[0].charAt(0))
  if (parts.length > 1) {
    const last = parts[parts.length - 1]
    if (last) letters.push(last.charAt(0))
  }
  return letters.join('').toUpperCase() || '?'
}

const conformidadeMeta: Record<string, { label: string; dot: string; badge: string }> = {
  em_dia: { label: 'Em dia', dot: 'bg-emerald-600', badge: 'bg-emerald-100 text-emerald-800' },
  vence_30_dias: {
    label: 'Vence em 30 dias',
    dot: 'bg-amber-600',
    badge: 'bg-amber-100 text-amber-800',
  },
  afastado: { label: 'Afastado', dot: 'bg-red-600', badge: 'bg-red-100/80 text-red-700' },
  vencido: { label: 'Vencido', dot: 'bg-red-600', badge: 'bg-red-100/80 text-red-700' },
}

/**
 * Painel contextual de Trabalhadores: resumo do colaborador selecionado.
 * Usa apenas os dados já carregados na listagem — nenhuma consulta adicional.
 */
export function WorkerContextPanel({ worker }: { worker: ColaboradorRecord | null }) {
  if (!worker) {
    return (
      <div className="text-center py-12 px-2">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
          <MousePointerClick className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Nenhum trabalhador selecionado</p>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Clique em uma linha da tabela para ver aqui o resumo do colaborador: função,
          estabelecimento, situação e conformidade.
        </p>
      </div>
    )
  }

  const meta = conformidadeMeta[worker.conformidade] ?? {
    label: worker.conformidade,
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-700',
  }

  const rows: { label: string; value: string }[] = [
    { label: 'Situação', value: worker.situacao },
    { label: 'Início', value: worker.data_inicio },
    { label: 'Retorno previsto', value: worker.retorno_previsto },
    { label: 'Detalhes', value: worker.detalhes },
    { label: 'Status do afastamento', value: worker.status_afastamento },
  ]

  return (
    <div className="space-y-5">
      {/* Identificação */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shrink-0">
          {initials(worker.nome)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 leading-tight">{worker.nome}</p>
          <p className="text-xs text-slate-500 mt-0.5">{worker.funcao || 'Função não informada'}</p>
        </div>
      </div>

      {/* Estabelecimento e situação cadastral */}
      <div className="space-y-2.5">
        <div className="flex items-start gap-2.5">
          <Building2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Estabelecimento
            </p>
            <p className="text-sm text-slate-700 mt-0.5">{worker.estabelecimento || '—'}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <CalendarDays className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Situação cadastral
            </p>
            <p className="text-sm text-slate-700 mt-0.5">{worker.status}</p>
          </div>
        </div>
      </div>

      {/* Conformidade */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Conformidade
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${meta.badge}`}
          >
            {meta.label}
          </span>
        </div>
      </div>

      {/* Afastamento */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Afastamento
        </p>
        <dl className="space-y-2.5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-3">
              <dt className="text-xs text-slate-500 shrink-0">{row.label}</dt>
              <dd className="text-xs text-slate-800 text-right font-medium">{row.value || '—'}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3">
        Resumo montado com os dados já carregados na listagem de Trabalhadores. Nenhuma consulta
        adicional é feita.
      </p>
    </div>
  )
}

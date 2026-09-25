import { ArrowLeft, Clock } from 'lucide-react'
import type { NavItemKey } from './Sidebar'

interface PlaceholderPageProps {
  title: string
  tabKey: NavItemKey
  onBackToWorkers: () => void
}

export function PlaceholderPage({ title, onBackToWorkers }: PlaceholderPageProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-sm max-w-2xl mx-auto my-12">
      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <Clock className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
      <p className="text-sm text-slate-500 mb-6">
        Módulo em sincronização com o banco de dados do sistema SEGURAPRO. A tela principal e
        funcional no momento é a de <strong>Trabalhadores</strong>.
      </p>
      <button
        type="button"
        onClick={onBackToWorkers}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Trabalhadores
      </button>
    </div>
  )
}

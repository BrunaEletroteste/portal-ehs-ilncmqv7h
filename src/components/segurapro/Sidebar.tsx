import React from 'react'
import {
  Shield,
  Home,
  Users,
  HardHat,
  GraduationCap,
  FileText,
  AlertTriangle,
  BarChart3,
  FileSpreadsheet,
  Settings,
  Headphones,
} from 'lucide-react'

export type NavItemKey =
  | 'dashboard'
  | 'trabalhadores'
  | 'epis'
  | 'treinamentos'
  | 'documentos'
  | 'ocorrencias'
  | 'indicadores'
  | 'relatorios'
  | 'configuracoes'

interface SidebarProps {
  currentTab: NavItemKey
  onSelectTab: (tab: NavItemKey) => void
  onSupportClick?: () => void
}

const navItems: {
  id: NavItemKey
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'trabalhadores', label: 'Trabalhadores', icon: Users },
  { id: 'epis', label: 'EPIs', icon: HardHat },
  { id: 'treinamentos', label: 'Treinamentos', icon: GraduationCap },
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'ocorrencias', label: 'Ocorrências', icon: AlertTriangle },
  { id: 'indicadores', label: 'Indicadores', icon: BarChart3 },
  { id: 'relatorios', label: 'Relatórios', icon: FileSpreadsheet },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
]

export function Sidebar({ currentTab, onSelectTab, onSupportClick }: SidebarProps) {
  return (
    <aside className="w-64 bg-[#0d2b52] text-white flex flex-col h-screen shrink-0 sticky top-0 select-none z-20">
      {/* Logo & Header */}
      <div className="px-5 pt-6 pb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md">
          <Shield className="w-6 h-6 text-[#0d2b52] fill-[#0d2b52]" strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-wide text-white">EHS+Fácil</h1>
          <p className="text-xs text-slate-300 font-normal">Gestão em SST</p>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#2563eb] text-white shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Footer Support Card */}
      <div className="p-4 mt-auto">
        <div className="bg-[#081b34] rounded-xl p-3.5 border border-white/10">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/10 rounded-lg text-white">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Precisa de ajuda?</p>
              <p className="text-[11px] text-slate-300">Fale com nosso time</p>
              <button
                type="button"
                onClick={onSupportClick}
                className="mt-1 text-xs text-white font-medium underline hover:text-blue-200 inline-flex items-center gap-1 transition-colors"
              >
                Suporte &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

import type { ReactNode } from 'react'
import { PanelRightClose, PanelRightOpen } from 'lucide-react'

interface AppShellProps {
  sidebar: ReactNode
  topbar: ReactNode
  main: ReactNode
  panelAvailable: boolean
  panelOpen: boolean
  onTogglePanel: () => void
  panelTitle: string
  panelSubtitle?: string
  panelBody: ReactNode
}

function PanelHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string
  subtitle?: string
  onClose: () => void
}) {
  return (
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 px-5 py-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Painel de contexto
        </p>
        <h2 className="text-sm font-bold text-slate-900 truncate mt-0.5">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 truncate mt-0.5">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar painel de contexto"
        title="Fechar painel"
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
      >
        <PanelRightClose className="w-5 h-5" />
      </button>
    </div>
  )
}

/**
 * Shell global do app: sidebar fixa + área principal + painel contextual lateral.
 * O painel é opcional (panelAvailable), colapsável e responsivo:
 * - xl (>=1280px): coluna fixa à direita da área principal
 * - abaixo de xl: sobrepõe o conteúdo com fundo escurecido
 * Quando fechado, um botão flutuante permite reabrir.
 */
export function AppShell({
  sidebar,
  topbar,
  main,
  panelAvailable,
  panelOpen,
  onTogglePanel,
  panelTitle,
  panelSubtitle,
  panelBody,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800">
      {sidebar}

      <div className="flex-1 flex flex-col min-w-0">
        {topbar}

        <div className="flex-1 flex items-start">
          <main className="flex-1 min-w-0 p-6 lg:p-8 max-w-7xl w-full mx-auto">{main}</main>

          {panelAvailable && panelOpen && (
            <aside
              aria-label="Painel de contexto"
              className="hidden xl:flex xl:flex-col w-[360px] shrink-0 bg-white border-l border-slate-200 sticky top-0 h-screen overflow-y-auto z-10"
            >
              <PanelHeader title={panelTitle} subtitle={panelSubtitle} onClose={onTogglePanel} />
              <div className="px-5 py-5">{panelBody}</div>
            </aside>
          )}
        </div>
      </div>

      {/* Painel em telas menores (abaixo de xl): sobrepõe o conteúdo */}
      {panelAvailable && panelOpen && (
        <div className="xl:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={onTogglePanel}
            aria-hidden="true"
          />
          <aside
            aria-label="Painel de contexto"
            className="absolute right-0 top-0 h-full w-[90%] max-w-[380px] bg-white shadow-xl flex flex-col overflow-y-auto"
          >
            <PanelHeader title={panelTitle} subtitle={panelSubtitle} onClose={onTogglePanel} />
            <div className="px-5 py-5">{panelBody}</div>
          </aside>
        </div>
      )}

      {/* Botão flutuante para abrir/reabrir o painel */}
      {panelAvailable && !panelOpen && (
        <button
          type="button"
          onClick={onTogglePanel}
          className="fixed bottom-20 right-6 z-30 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0d2b52] text-white text-sm font-medium shadow-lg hover:bg-[#123a6d] transition-colors"
        >
          <PanelRightOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Painel de contexto</span>
        </button>
      )}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { Info } from 'lucide-react'
import { Sidebar, type NavItemKey } from '@/components/segurapro/Sidebar'
import { Topbar } from '@/components/segurapro/Topbar'
import { WorkersPage } from '@/components/segurapro/WorkersPage'
import { PlaceholderPage } from '@/components/segurapro/PlaceholderPage'
import { AppShell } from '@/components/shell/AppShell'
import { WorkerContextPanel } from '@/components/shell/ContextPanels'
import {
  fetchAllColaboradores,
  type ColaboradorRecord,
  type ConformidadeCounts,
  type ConformidadeStatus,
} from '@/services/segurapro'
import { useToast } from '@/hooks/use-toast'

export default function Index() {
  const { toast } = useToast()

  // Navigation tab (default: 'trabalhadores')
  const [currentTab, setCurrentTab] = useState<NavItemKey>('trabalhadores')

  // Search input in topbar
  const [searchQuery, setSearchQuery] = useState('')

  // Active KPI filter
  const [activeFilter, setActiveFilter] = useState<ConformidadeStatus | null>('afastados')

  // Data from PocketBase
  const [collaborators, setCollaborators] = useState<ColaboradorRecord[]>([])
  const [counts, setCounts] = useState<ConformidadeCounts>({
    total: 122,
    em_dia: 96,
    vence_30_dias: 18,
    afastados: 3,
    vencidos: 5,
  })
  const [loading, setLoading] = useState(true)

  // Painel de contexto (shell global)
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const list = await fetchAllColaboradores()
      setCollaborators(list)

      // Calcular contagens reais do banco
      const em_dia = list.filter((c) => c.conformidade === 'em_dia').length
      const vence_30_dias = list.filter((c) => c.conformidade === 'vence_30_dias').length
      const afastados = list.filter((c) => c.conformidade === 'afastado').length
      const vencidos = list.filter((c) => c.conformidade === 'vencido').length

      setCounts({
        total: list.length,
        em_dia,
        vence_30_dias,
        afastados,
        vencidos,
      })
    } catch (err) {
      console.error('Erro ao carregar colaboradores do banco:', err)
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível carregar os dados em tempo real.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  function getTabTitle(tab: NavItemKey): string {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard Geral'
      case 'epis':
        return 'Gestão de EPIs'
      case 'treinamentos':
        return 'Treinamentos e Certificações'
      case 'documentos':
        return 'Documentos e Laudos SST'
      case 'ocorrencias':
        return 'Registro de Ocorrências e Incidentes'
      case 'indicadores':
        return 'Indicadores de Segurança'
      case 'relatorios':
        return 'Relatórios e Exportações'
      case 'configuracoes':
        return 'Configurações do Sistema'
      default:
        return 'Trabalhadores'
    }
  }

  const selectedWorker = collaborators.find((c) => c.id === selectedWorkerId) ?? null
  const isWorkersTab = currentTab === 'trabalhadores'

  function handleSelectWorker(id: string | null) {
    setSelectedWorkerId(id)
    if (id !== null) setPanelOpen(true)
  }

  function handleSelectTab(tab: NavItemKey) {
    setCurrentTab(tab)
    setSelectedWorkerId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const panelBody = isWorkersTab ? (
    <WorkerContextPanel worker={selectedWorker} />
  ) : (
    <div className="text-center py-12 px-2">
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
        <Info className="w-5 h-5" />
      </div>
      <p className="text-sm font-semibold text-slate-700">Sem contexto nesta seção</p>
      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
        Quando o módulo {getTabTitle(currentTab)} estiver ativo, os itens selecionados aparecerão
        aqui.
      </p>
    </div>
  )

  return (
    <AppShell
      sidebar={
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          onSupportClick={() => {
            toast({
              title: 'Suporte SEGURAPRO',
              description: 'Canal de atendimento aberto. E-mail: suporte@segurapro.com.br',
            })
          }}
        />
      }
      topbar={
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          unreadNotifications={5}
          userName="João Silva"
          userRole="Administrador"
          userInitials="JS"
        />
      }
      main={
        isWorkersTab ? (
          <WorkersPage
            collaborators={collaborators}
            counts={counts}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            loading={loading}
            searchQuery={searchQuery}
            onRefresh={loadData}
            selectedWorkerId={selectedWorkerId}
            onSelectWorker={handleSelectWorker}
          />
        ) : (
          <PlaceholderPage
            title={getTabTitle(currentTab)}
            tabKey={currentTab}
            onBackToWorkers={() => handleSelectTab('trabalhadores')}
          />
        )
      }
      panelAvailable
      panelOpen={panelOpen}
      onTogglePanel={() => setPanelOpen((open) => !open)}
      panelTitle={
        isWorkersTab ? selectedWorker?.nome || 'Painel de contexto' : 'Painel de contexto'
      }
      panelSubtitle={
        isWorkersTab ? selectedWorker?.funcao || 'Trabalhadores' : getTabTitle(currentTab)
      }
      panelBody={panelBody}
    />
  )
}

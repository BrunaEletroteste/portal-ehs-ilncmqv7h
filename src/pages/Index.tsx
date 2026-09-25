import { useState, useEffect, useCallback } from 'react'
import { Sidebar, type NavItemKey } from '@/components/segurapro/Sidebar'
import { Topbar } from '@/components/segurapro/Topbar'
import { WorkersPage } from '@/components/segurapro/WorkersPage'
import { PlaceholderPage } from '@/components/segurapro/PlaceholderPage'
import {
  fetchAllColaboradores,
  type ColaboradorRecord,
  type ConformidadeCounts,
  type ConformidadeStatus,
} from '@/services/segurapro'
import { useToast } from '@/hooks/use-toast'

export default function Index() {
  const { toast } = useToast()

  // Navigation tab (default: 'trabalhadores' as in screenshot)
  const [currentTab, setCurrentTab] = useState<NavItemKey>('trabalhadores')

  // Search input in topbar
  const [searchQuery, setSearchQuery] = useState('')

  // Active KPI filter: default 'afastados' as shown selected in the screenshot!
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

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800">
      {/* Sidebar - Fixa à esquerda com fundo azul-marinho escuro */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        onSupportClick={() => {
          toast({
            title: 'Suporte SEGURAPRO',
            description: 'Canal de atendimento aberto. E-mail: suporte@segurapro.com.br',
          })
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <Topbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          unreadNotifications={5}
          userName="João Silva"
          userRole="Administrador"
          userInitials="JS"
        />

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'trabalhadores' ? (
            <WorkersPage
              collaborators={collaborators}
              counts={counts}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              loading={loading}
              searchQuery={searchQuery}
              onRefresh={loadData}
            />
          ) : (
            <PlaceholderPage
              title={getTabTitle(currentTab)}
              tabKey={currentTab}
              onBackToWorkers={() => setCurrentTab('trabalhadores')}
            />
          )}
        </main>
      </div>
    </div>
  )
}

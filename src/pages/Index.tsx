import { useEffect, useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { createInitialAdmin, getCurrentUser, signIn, signOut, type AuthUser } from '@/services/auth'
import {
  createCollaborator,
  listCollaboratorHistory,
  listCollaborators,
  updateCollaborator,
  type AuditLog,
  type Collaborator,
} from '@/services/colaboradores'
import DocumentPanel from '@/components/documents/DocumentPanel'

type AuthView = 'setup' | 'login'
type Notice = { type: 'success' | 'error'; text: string }

type CollaboratorForm = {
  cpf_sintetico: string
  nome: string
  funcao: string
  estabelecimento: string
  status: 'Ativo' | 'Inativo'
}

const approvedFixture: CollaboratorForm = {
  cpf_sintetico: 'TESTE-CPF-001',
  nome: 'Colaborador Teste EHS',
  funcao: 'Técnico de campo — TESTE',
  estabelecimento: 'Sede Eletroteste — TESTE',
  status: 'Ativo',
}

const emptyAdmin = { name: '', email: '', password: '', passwordConfirm: '' }

function formatDate(value?: string) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function NoticeBanner({ notice }: { notice: Notice | null }) {
  if (!notice) return null
  return (
    <Alert variant={notice.type === 'error' ? 'destructive' : 'default'} className="mb-6">
      <AlertTitle>
        {notice.type === 'error' ? 'Não foi possível concluir' : 'Tudo certo'}
      </AlertTitle>
      <AlertDescription>{notice.text}</AlertDescription>
    </Alert>
  )
}

function AuthScreen({
  view,
  setView,
  notice,
  setNotice,
  onAuthenticated,
}: {
  view: AuthView
  setView: (view: AuthView) => void
  notice: Notice | null
  setNotice: (notice: Notice | null) => void
  onAuthenticated: (user: AuthUser) => void
}) {
  const [admin, setAdmin] = useState(emptyAdmin)
  const [login, setLogin] = useState({ email: '', password: '' })
  const [saving, setSaving] = useState(false)

  async function handleSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)
    try {
      const result = await createInitialAdmin(admin)
      setNotice({ type: 'success', text: result.message })
      setAdmin(emptyAdmin)
      setView('login')
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) })
    } finally {
      setSaving(false)
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)
    try {
      const result = await signIn(login.email, login.password)
      onAuthenticated(result.record as AuthUser)
    } catch (error) {
      setNotice({ type: 'error', text: 'E-mail ou senha inválidos, ou conta inativa.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-2xl text-white shadow-lg">
            🛡️
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              Eletroteste
            </p>
            <h1 className="text-2xl font-bold tracking-tight">Portal EHS</h1>
          </div>
          <Badge variant="outline" className="ml-auto border-sky-200 bg-sky-50 text-sky-700">
            Ambiente de teste
          </Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <section className="pt-4 lg:pt-12">
            <Badge className="mb-4 bg-sky-600 hover:bg-sky-600">Núcleo de cadastro</Badge>
            <h2 className="max-w-xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Documentos e evidências de EHS em um só lugar.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Esta primeira entrega testa o cadastro interno de um colaborador sintético, sua
              consulta e a trilha imutável das alterações.
            </p>
            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              {['Massa sintética', 'Acesso interno', 'Histórico auditável'].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm"
                >
                  <span className="mb-2 block text-xl">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </section>

          <Card className="border-slate-200 shadow-xl shadow-slate-200/60">
            <CardHeader>
              <div className="mb-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'setup' ? 'default' : 'outline'}
                  onClick={() => {
                    setView('setup')
                    setNotice(null)
                  }}
                >
                  Primeiro acesso
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={view === 'login' ? 'default' : 'outline'}
                  onClick={() => {
                    setView('login')
                    setNotice(null)
                  }}
                >
                  Entrar
                </Button>
              </div>
              <CardTitle>
                {view === 'setup' ? 'Configuração inicial' : 'Entrar no portal'}
              </CardTitle>
              <CardDescription>
                {view === 'setup'
                  ? 'O primeiro usuário será criado como administrador. Esta tela só funciona uma vez.'
                  : 'Use a conta administrativa criada na configuração inicial.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NoticeBanner notice={notice} />
              {view === 'setup' ? (
                <form className="space-y-4" onSubmit={handleSetup}>
                  <div className="space-y-2">
                    <Label htmlFor="admin-name">Nome</Label>
                    <Input
                      id="admin-name"
                      required
                      minLength={2}
                      value={admin.name}
                      onChange={(event) => setAdmin({ ...admin, name: event.target.value })}
                      placeholder="Bruna Oliveira"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">E-mail administrativo</Label>
                    <Input
                      id="admin-email"
                      required
                      type="email"
                      value={admin.email}
                      onChange={(event) => setAdmin({ ...admin, email: event.target.value })}
                      placeholder="nome@empresa.com.br"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Senha</Label>
                    <Input
                      id="admin-password"
                      required
                      minLength={12}
                      type="password"
                      value={admin.password}
                      onChange={(event) => setAdmin({ ...admin, password: event.target.value })}
                      placeholder="Mínimo de 12 caracteres"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password-confirm">Confirmar senha</Label>
                    <Input
                      id="admin-password-confirm"
                      required
                      minLength={12}
                      type="password"
                      value={admin.passwordConfirm}
                      onChange={(event) =>
                        setAdmin({ ...admin, passwordConfirm: event.target.value })
                      }
                      placeholder="Repita a senha"
                      autoComplete="new-password"
                    />
                  </div>
                  <Button className="w-full" disabled={saving} type="submit">
                    {saving ? 'Criando administrador…' : 'Criar administrador inicial'}
                  </Button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-mail</Label>
                    <Input
                      id="login-email"
                      required
                      type="email"
                      value={login.email}
                      onChange={(event) => setLogin({ ...login, email: event.target.value })}
                      placeholder="nome@empresa.com.br"
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      required
                      type="password"
                      value={login.password}
                      onChange={(event) => setLogin({ ...login, password: event.target.value })}
                      placeholder="Sua senha"
                      autoComplete="current-password"
                    />
                  </div>
                  <Button className="w-full" disabled={saving} type="submit">
                    {saving ? 'Entrando…' : 'Entrar'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

function Dashboard({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [selected, setSelected] = useState<Collaborator | null>(null)
  const [history, setHistory] = useState<AuditLog[]>([])
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CollaboratorForm>(approvedFixture)

  async function refreshCollaborators() {
    const result = await listCollaborators()
    setCollaborators(result.items)
    return result.items
  }

  async function loadHistory(collaborator: Collaborator) {
    setSelected(collaborator)
    try {
      const result = await listCollaboratorHistory(collaborator.id)
      setHistory(result.items)
    } catch (error) {
      setHistory([])
      setNotice({ type: 'error', text: getErrorMessage(error) })
    }
  }

  useEffect(() => {
    refreshCollaborators()
      .catch((error) => setNotice({ type: 'error', text: getErrorMessage(error) }))
      .finally(() => setLoading(false))
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm(approvedFixture)
    setShowForm(true)
    setNotice(null)
  }

  function openEdit(collaborator: Collaborator) {
    setEditingId(collaborator.id)
    setForm({
      cpf_sintetico: collaborator.cpf_sintetico,
      nome: collaborator.nome,
      funcao: collaborator.funcao,
      estabelecimento: collaborator.estabelecimento,
      status: collaborator.status,
    })
    setShowForm(true)
    setNotice(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setNotice(null)
    try {
      if (editingId) {
        await updateCollaborator(editingId, {
          nome: form.nome,
          funcao: form.funcao,
          estabelecimento: form.estabelecimento,
          status: form.status,
        })
        const items = await refreshCollaborators()
        const refreshed = items.find((item) => item.id === editingId)
        if (refreshed) await loadHistory(refreshed)
        setNotice({
          type: 'success',
          text: 'Cadastro atualizado e alteração registrada no histórico.',
        })
      } else {
        const created = await createCollaborator(form)
        const items = await refreshCollaborators()
        const refreshed = items.find((item) => item.id === created.id) ?? created
        await loadHistory(refreshed)
        setNotice({ type: 'success', text: 'Colaborador sintético criado sem duplicidade.' })
      }
      setShowForm(false)
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-xl text-white">
            🛡️
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              Eletroteste
            </p>
            <h1 className="font-bold tracking-tight">Portal EHS</h1>
          </div>
          <Badge
            variant="outline"
            className="hidden border-sky-200 bg-sky-50 text-sky-700 sm:inline-flex"
          >
            Ambiente de teste
          </Badge>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{user.name || 'Administrador'}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onLogout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <NoticeBanner notice={notice} />
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-sky-700">Cadastro central</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">Colaboradores</h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Registros internos sintéticos com consulta e trilha imutável das alterações.
            </p>
          </div>
          <Button onClick={openCreate}>+ Novo colaborador</Button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Registros cadastrados</p>
              <p className="mt-2 text-3xl font-bold">{collaborators.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Ativos</p>
              <p className="mt-2 text-3xl font-bold text-emerald-700">
                {collaborators.filter((item) => item.status === 'Ativo').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Perfil atual</p>
              <p className="mt-2 text-lg font-bold">Administrador</p>
              <p className="text-xs text-slate-500">Acesso interno EHS/SST</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-xl">Base de colaboradores</CardTitle>
              <CardDescription>
                CPF sintético é obrigatório nesta fase; nenhum dado real deve ser inserido.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-sm text-slate-500">Carregando registros…</div>
              ) : collaborators.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="font-semibold">Nenhum colaborador cadastrado</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Use os dados sintéticos aprovados para iniciar a prova.
                  </p>
                  <Button className="mt-4" onClick={openCreate}>
                    Cadastrar primeiro colaborador
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Atualizado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collaborators.map((collaborator) => (
                      <TableRow
                        key={collaborator.id}
                        className={selected?.id === collaborator.id ? 'bg-sky-50/60' : undefined}
                      >
                        <TableCell>
                          <button
                            className="text-left font-semibold hover:text-sky-700"
                            onClick={() => loadHistory(collaborator)}
                          >
                            {collaborator.nome}
                            <span className="mt-1 block text-xs font-normal text-slate-500">
                              {collaborator.cpf_sintetico}
                            </span>
                          </button>
                        </TableCell>
                        <TableCell className="max-w-[180px] text-sm text-slate-600">
                          {collaborator.funcao}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={collaborator.status === 'Ativo' ? 'default' : 'secondary'}
                          >
                            {collaborator.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-slate-500">
                          {formatDate(collaborator.updated)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(collaborator)}>
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Histórico do cadastro</CardTitle>
              <CardDescription>
                {selected
                  ? `Trilha de ${selected.nome}`
                  : 'Selecione um colaborador para consultar as alterações.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selected ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-slate-50 p-4 text-sm">
                    <p className="font-semibold">{selected.nome}</p>
                    <p className="mt-1 text-slate-500">
                      {selected.funcao} · {selected.estabelecimento}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">ID interno: {selected.id}</p>
                  </div>
                  {history.length === 0 ? (
                    <p className="text-sm text-slate-500">Nenhum evento encontrado.</p>
                  ) : (
                    <div className="space-y-3">
                      {history.map((event) => (
                        <div key={event.id} className="border-l-2 border-sky-500 pl-4">
                          <div className="flex items-center justify-between gap-3">
                            <Badge variant="outline">
                              {event.action === 'create'
                                ? 'Criação'
                                : event.action === 'update'
                                  ? 'Atualização'
                                  : 'Exclusão'}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {formatDate(event.created)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-700">{event.details}</p>
                          {event.field_changes && (
                            <p className="mt-1 text-xs text-slate-500">
                              Campos alterados: {Object.keys(event.field_changes).join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  A consulta exibirá criação, atualizações, responsável e campos alterados.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DocumentPanel collaborator={selected} isAdmin={user.role === 'admin'} />

        {showForm && (
          <Card className="mt-6 border-sky-200 shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>
                    {editingId ? 'Editar colaborador' : 'Cadastrar colaborador sintético'}
                  </CardTitle>
                  <CardDescription>
                    {editingId
                      ? 'A alteração será registrada na trilha imutável.'
                      : 'Use a massa aprovada: Colaborador Teste EHS.'}
                  </CardDescription>
                </div>
                <Button variant="ghost" onClick={() => setShowForm(false)}>
                  Fechar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="cpf-sintetico">Identificador sintético</Label>
                  <Input
                    id="cpf-sintetico"
                    required
                    disabled={Boolean(editingId)}
                    pattern="TESTE-CPF-[0-9]{3}"
                    value={form.cpf_sintetico}
                    onChange={(event) => setForm({ ...form, cpf_sintetico: event.target.value })}
                  />
                  <p className="text-xs text-slate-500">
                    Formato permitido: TESTE-CPF-001. Não informe CPF real.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collaborator-name">Nome</Label>
                  <Input
                    id="collaborator-name"
                    required
                    minLength={2}
                    value={form.nome}
                    onChange={(event) => setForm({ ...form, nome: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collaborator-role">Função</Label>
                  <Input
                    id="collaborator-role"
                    required
                    minLength={2}
                    value={form.funcao}
                    onChange={(event) => setForm({ ...form, funcao: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collaborator-establishment">Estabelecimento</Label>
                  <Input
                    id="collaborator-establishment"
                    required
                    minLength={2}
                    value={form.estabelecimento}
                    onChange={(event) => setForm({ ...form, estabelecimento: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collaborator-status">Status</Label>
                  <select
                    id="collaborator-status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.status}
                    onChange={(event) =>
                      setForm({ ...form, status: event.target.value as 'Ativo' | 'Inativo' })
                    }
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
                <div className="flex items-end gap-3">
                  <Button type="submit" disabled={saving}>
                    {saving
                      ? 'Salvando…'
                      : editingId
                        ? 'Salvar alteração'
                        : 'Cadastrar colaborador'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setForm(approvedFixture)}>
                    Restaurar dados aprovados
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

const Index = () => {
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser())
  const [authView, setAuthView] = useState<AuthView>('setup')
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    if (pb.authStore.isValid) setUser(getCurrentUser())
  }, [])

  if (user) {
    return (
      <Dashboard
        user={user}
        onLogout={() => {
          signOut()
          setUser(null)
          setAuthView('login')
          setNotice({ type: 'success', text: 'Sessão encerrada.' })
        }}
      />
    )
  }

  return (
    <AuthScreen
      view={authView}
      setView={setAuthView}
      notice={notice}
      setNotice={setNotice}
      onAuthenticated={setUser}
    />
  )
}

export default Index

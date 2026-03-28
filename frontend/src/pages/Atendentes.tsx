import { useState, useEffect } from 'react'
import { atendentes, setores, type Atendentes, type Setores } from '../api/client'
import { coletarTodasPaginas } from '../api/collectPages'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { IconPencil } from '../components/ui/IconPencil'
import { FiltroInativos } from '../components/ui/FiltroInativos'
import { BarraBuscaPaginacao, PAGE_SIZE_PADRAO } from '../components/ui/BarraBuscaPaginacao'
import { Switch } from '../components/ui/Switch'
import { CheckboxField } from '../components/ui/CheckboxField'
import { Select } from '../components/ui/Select'

export function Atendentes() {
  const [list, setList] = useState<Atendentes.Atendente[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [busca, setBusca] = useState('')
  const [debouncedBusca, setDebouncedBusca] = useState('')
  const [setoresList, setSetoresList] = useState<Setores.Setor[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [incluirInativos, setIncluirInativos] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [senha, setSenha] = useState('')
  const [role, setRole] = useState<'admin' | 'atendente'>('atendente')
  const [ativo, setAtivo] = useState(true)
  const [setorIds, setSetorIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedBusca(busca.trim()), 400)
    return () => clearTimeout(t)
  }, [busca])

  useEffect(() => {
    setPage(1)
  }, [debouncedBusca, incluirInativos])

  function load() {
    setLoading(true)
    setLoadError('')
    atendentes
      .list({
        incluir_inativos: incluirInativos,
        busca: debouncedBusca || undefined,
        offset: (page - 1) * PAGE_SIZE_PADRAO,
        limit: PAGE_SIZE_PADRAO,
      })
      .then(({ items, total: t }) => {
        setList(items)
        setTotal(t)
      })
      .catch((err) => {
        setList([])
        setTotal(0)
        setLoadError(err instanceof Error ? err.message : 'Erro ao carregar atendentes')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, debouncedBusca, incluirInativos])

  useEffect(() => {
    coletarTodasPaginas<Setores.Setor>((o, l) =>
      setores.list({ incluir_inativos: true, offset: o, limit: l }),
    ).then(setSetoresList)
  }, [])

  function openCreate() {
    setEditingId(null)
    setEmail('')
    setNome('')
    setSenha('')
    setRole('atendente')
    setAtivo(true)
    setSetorIds([])
    setError('')
    setModalOpen(true)
  }

  function openEdit(item: Atendentes.Atendente) {
    setEditingId(item.id)
    setEmail(item.email)
    setNome(item.nome)
    setSenha('')
    setRole((item.role as 'admin') || 'atendente')
    setAtivo(item.ativo)
    setSetorIds(item.setor_ids ?? [])
    setError('')
    setModalOpen(true)
  }

  function toggleSetor(id: number) {
    setSetorIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editingId) {
        await atendentes.update(editingId, {
          email,
          nome: nome.trim(),
          role,
          ativo,
          setor_ids: setorIds,
          ...(senha ? { senha } : {}),
        })
      } else {
        if (!senha) throw new Error('Senha obrigatória para novo atendente')
        await atendentes.create({
          email,
          nome: nome.trim(),
          senha,
          role,
          setor_ids: setorIds,
          ativo,
        })
      }
      setModalOpen(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Atendentes</h1>
        <Button onClick={openCreate}>Novo atendente</Button>
      </div>
      {!modalOpen && (
        <Card>
          <BarraBuscaPaginacao
            busca={busca}
            onBuscaChange={setBusca}
            placeholder="Buscar por nome ou e-mail"
            page={page}
            total={total}
            onPageChange={setPage}
            disabled={loading}
            extra={<FiltroInativos incluirInativos={incluirInativos} onChange={setIncluirInativos} />}
          />
        {loadError && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-200">
            {loadError}
          </div>
        )}
        {loading ? (
          <p className="text-slate-500 dark:text-slate-400">Carregando...</p>
        ) : list.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">Nenhum atendente encontrado.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {list.map((a) => (
              <li
                key={a.id}
                role="button"
                tabIndex={0}
                onClick={() => openEdit(a)}
                onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openEdit(a); } }}
                className="flex cursor-pointer items-center justify-between rounded-lg py-3 px-2 -mx-2 transition-colors duration-150 hover:bg-slate-50 dark:bg-slate-800/40 dark:hover:bg-slate-800/60/80 dark:hover:bg-slate-800/50 focus:outline-none focus:bg-slate-50 dark:bg-slate-800/40 dark:focus:bg-slate-800/40/80"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className={`font-medium ${a.ativo ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>{a.nome}</span>
                  {!a.ativo && <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600 dark:text-slate-400">Inativo</span>}
                  <span className="text-slate-500 dark:text-slate-400">{a.email}</span>
                  <span className="text-xs text-slate-400">({a.role})</span>
                </div>
                <div className="shrink-0" onClick={(ev) => ev.stopPropagation()}>
                  <Button variant="ghost" onClick={() => openEdit(a)} aria-label="Editar"><IconPencil /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        </Card>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <Card title={editingId ? 'Editar atendente' : 'Novo atendente'} className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
              <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              <Input
                label={editingId ? 'Nova senha (deixe em branco para manter)' : 'Senha'}
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required={!editingId}
              />
              <Select
                label="Perfil"
                value={role}
                onChange={(v) => setRole(v === 'admin' ? 'admin' : 'atendente')}
                options={[
                  { value: 'atendente', label: 'Atendente' },
                  { value: 'admin', label: 'Administrador' },
                ]}
              />
              {role === 'atendente' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Setores</label>
                  <div className="flex flex-wrap gap-2">
                    {setoresList.map((s) => (
                      <CheckboxField
                        key={s.id}
                        checked={setorIds.includes(s.id)}
                        onChange={() => toggleSetor(s.id)}
                      >
                        {s.nome}
                      </CheckboxField>
                    ))}
                  </div>
                </div>
              )}
              <Switch checked={ativo} onCheckedChange={setAtivo} label="Usuário ativo" description="Inativos não acessam o sistema." />
              <div className="flex gap-2">
                <Button type="submit" loading={saving}>Salvar</Button>
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}

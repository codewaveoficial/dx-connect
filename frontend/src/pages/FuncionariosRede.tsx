import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  funcionariosRede,
  redes,
  empresas,
  type FuncionariosRede as FuncionarioRedeTipo,
  type Redes,
  type Empresas,
} from '../api/client'
import { coletarTodasPaginas } from '../api/collectPages'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { IconPencil } from '../components/ui/IconPencil'
import { IconTrash } from '../components/ui/IconTrash'
import { useToast } from '../components/ui/Toast'
import { FiltroInativos } from '../components/ui/FiltroInativos'
import { SelectComPesquisa } from '../components/ui/SelectComPesquisa'
import { Select } from '../components/ui/Select'
import { BarraBuscaPaginacao, PAGE_SIZE_PADRAO } from '../components/ui/BarraBuscaPaginacao'
import { CabecalhoOrdenavel } from '../components/ui/CabecalhoOrdenavel'
import { useOrdenacaoLista } from '../hooks/useOrdenacaoLista'
import { Switch } from '../components/ui/Switch'
import { CheckboxField } from '../components/ui/CheckboxField'

type Tipo = 'socio' | 'supervisor' | 'colaborador'
type ColunaFuncionario = 'nome' | 'email' | 'tipo'

export function FuncionariosRede() {
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const { ordenarPor, ordem, aoOrdenarColuna, sortParams } = useOrdenacaoLista<ColunaFuncionario>()
  const [list, setList] = useState<FuncionarioRedeTipo.Funcionario[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [busca, setBusca] = useState('')
  const [debouncedBusca, setDebouncedBusca] = useState('')
  const [redesList, setRedesList] = useState<Redes.Rede[]>([])
  const [empresasList, setEmpresasList] = useState<Empresas.Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [incluirInativos, setIncluirInativos] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [tipo, setTipo] = useState<Tipo>('colaborador')
  const [ativo, setAtivo] = useState(true)
  const [redeId, setRedeId] = useState<number | ''>('')
  const [empresaId, setEmpresaId] = useState<number | ''>('')
  const [empresaIds, setEmpresaIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedBusca(busca.trim()), 400)
    return () => clearTimeout(t)
  }, [busca])

  useEffect(() => {
    setPage(1)
  }, [debouncedBusca, incluirInativos, ordenarPor, ordem])

  function load(override?: { busca?: string; page?: number }) {
    setLoading(true)
    const buscaEff = override?.busca !== undefined ? override.busca : debouncedBusca
    const pageEff = override?.page !== undefined ? override.page : page
    funcionariosRede
      .list({
        incluir_inativos: incluirInativos,
        busca: buscaEff.trim() || undefined,
        ...sortParams,
        offset: (pageEff - 1) * PAGE_SIZE_PADRAO,
        limit: PAGE_SIZE_PADRAO,
      })
      .then(({ items, total: t }) => {
        setList(items)
        setTotal(t)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, debouncedBusca, incluirInativos, ordenarPor, ordem])

  useEffect(() => {
    coletarTodasPaginas<Redes.Rede>((o, l) => redes.list({ incluir_inativos: true, offset: o, limit: l })).then(
      setRedesList,
    )
    coletarTodasPaginas<Empresas.Empresa>((o, l) =>
      empresas.list({ incluir_inativos: true, offset: o, limit: l }),
    ).then(setEmpresasList)
  }, [])

  const openEdit = useCallback(
    (item: FuncionarioRedeTipo.Funcionario) => {
      setEditingId(item.id)
      setNome(item.nome)
      setEmail(item.email)
      setTipo(item.tipo as Tipo)
      setAtivo(item.ativo)
      let r = item.rede_id ?? ('' as number | '')
      if (r === '' && item.tipo === 'colaborador' && item.empresa_id) {
        const em = empresasList.find((e) => e.id === item.empresa_id)
        if (em) r = em.rede_id
      }
      if (r === '' && item.tipo === 'supervisor' && item.empresa_ids?.length) {
        const em = empresasList.find((e) => e.id === item.empresa_ids![0])
        if (em) r = em.rede_id
      }
      setRedeId(r)
      setEmpresaId(item.empresa_id ?? '')
      setEmpresaIds(item.empresa_ids ?? [])
      setError('')
      setModalOpen(true)
    },
    [empresasList],
  )

  useEffect(() => {
    const editId = (location.state as { editId?: number } | null)?.editId
    if (editId == null) return
    navigate(location.pathname, { replace: true, state: {} })
    funcionariosRede
      .get(editId)
      .then((item) => openEdit(item))
      .catch(() => toast.showWarning('Funcionário não encontrado.'))
  // eslint-disable-next-line react-hooks/exhaustive-deps -- abre edição uma vez ao receber editId na navegação
  }, [location.state, location.pathname, navigate, openEdit])

  function redePadraoRecente() {
    const sorted = [...redesList].sort(
      (a, b) => (Date.parse(b.created_at ?? '') || 0) - (Date.parse(a.created_at ?? '') || 0),
    )
    return sorted[0]?.id ?? ''
  }

  function openCreate() {
    setEditingId(null)
    setNome('')
    setEmail('')
    setTipo('colaborador')
    setAtivo(true)
    setRedeId(redePadraoRecente())
    setEmpresaId('')
    setEmpresaIds([])
    setError('')
    setModalOpen(true)
  }

  function toggleEmpresa(id: number) {
    setEmpresaIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!redeId) {
      setError('Selecione a rede.')
      return
    }
    const rid = Number(redeId)
    const empresasNaRede = empresasList.filter((em) => em.rede_id === rid)
    if (tipo === 'colaborador') {
      const em = empresasList.find((x) => x.id === empresaId)
      if (!em || em.rede_id !== rid) {
        setError('Selecione uma empresa desta rede.')
        return
      }
    }
    if (tipo === 'supervisor') {
      if (!empresaIds.length) {
        setError('Marque ao menos uma empresa da rede.')
        return
      }
      const invalid = empresaIds.some((id) => !empresasNaRede.some((e) => e.id === id))
      if (invalid) {
        setError('Todas as empresas do supervisor devem ser da rede selecionada.')
        return
      }
    }
    setSaving(true)
    try {
      const payload = {
        nome: nome.trim(),
        email,
        tipo,
        ativo,
        rede_id: tipo === 'socio' ? rid : undefined,
        empresa_id: tipo === 'colaborador' ? Number(empresaId) : undefined,
        empresa_ids: tipo === 'supervisor' ? empresaIds : undefined,
      }
      if (editingId) {
        await funcionariosRede.update(editingId, payload)
        setModalOpen(false)
        load()
        navigate(`/funcionarios-rede/${editingId}`, { replace: true })
      } else {
        const criado = await funcionariosRede.create(payload)
        setModalOpen(false)
        setBusca('')
        setDebouncedBusca('')
        setPage(1)
        load({ busca: '', page: 1 })
        navigate(`/funcionarios-rede/${criado.id}`, { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir este funcionário?')) return
    try {
      await funcionariosRede.delete(id)
      load()
    } catch (err) {
      toast.showWarning(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  const tipoLabel = { socio: 'Sócio', supervisor: 'Supervisor', colaborador: 'Colaborador' }

  const empresasDaRede = empresasList.filter(
    (em) => em.rede_id === Number(redeId) && (em.ativo || em.id === empresaId || empresaIds.includes(em.id)),
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Funcionários da rede</h1>
        <Button onClick={openCreate} disabled={modalOpen}>
          Novo
        </Button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <Card title={editingId ? 'Editar funcionário' : 'Novo funcionário'} className="w-full max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
              <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Select
                label="Tipo"
                value={tipo}
                onChange={(v) => {
                  const t = v as Tipo
                  setTipo(t)
                  setEmpresaId('')
                  setEmpresaIds([])
                  if (t === 'socio' && !redeId) setRedeId(redePadraoRecente())
                }}
                options={[
                  { value: 'socio', label: 'Sócio' },
                  { value: 'supervisor', label: 'Supervisor' },
                  { value: 'colaborador', label: 'Colaborador' },
                ]}
              />
              <SelectComPesquisa
                id="funcionario-rede"
                label="Rede"
                value={redeId}
                onChange={(id) => {
                  setRedeId(id)
                  setEmpresaId('')
                  setEmpresaIds([])
                }}
                required
                items={redesList.map((r) => ({
                  id: r.id,
                  label: r.nome,
                  createdAt: r.created_at,
                }))}
                hint="Últimas redes cadastradas. Digite para buscar outras."
              />
              {tipo === 'colaborador' && (
                <SelectComPesquisa
                  id="funcionario-empresa"
                  label="Empresa desta rede"
                  value={empresaId}
                  onChange={(id) => setEmpresaId(id)}
                  required
                  disabled={!redeId}
                  items={empresasDaRede.map((x) => ({
                    id: x.id,
                    label: x.nome,
                    createdAt: x.created_at,
                  }))}
                  hint={!redeId ? 'Selecione a rede primeiro.' : 'Últimas empresas desta rede. Digite para buscar.'}
                />
              )}
              {tipo === 'supervisor' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Empresas desta rede</label>
                  {!redeId ? (
                    <p className="text-sm text-slate-500">Selecione a rede primeiro.</p>
                  ) : empresasDaRede.length === 0 ? (
                    <p className="text-sm text-slate-500">Nenhuma empresa ativa nesta rede.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50/40 p-3">
                      {empresasDaRede.map((e) => (
                        <CheckboxField
                          key={e.id}
                          checked={empresaIds.includes(e.id)}
                          onChange={() => toggleEmpresa(e.id)}
                        >
                          {e.nome}
                        </CheckboxField>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <Switch checked={ativo} onCheckedChange={setAtivo} label="Ativo" />
              <div className="flex gap-2 border-t border-slate-200 pt-2">
                <Button type="submit" loading={saving}>
                  Salvar
                </Button>
                <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

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
          {loading ? (
            <p className="text-slate-500">Carregando...</p>
          ) : list.length === 0 ? (
            <p className="text-slate-500">Nenhum cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40">
                    <CabecalhoOrdenavel coluna="nome" rotulo="Nome" ordenarPor={ordenarPor} ordem={ordem} aoOrdenar={aoOrdenarColuna} />
                    <CabecalhoOrdenavel coluna="email" rotulo="E-mail" ordenarPor={ordenarPor} ordem={ordem} aoOrdenar={aoOrdenarColuna} />
                    <CabecalhoOrdenavel coluna="tipo" rotulo="Tipo" ordenarPor={ordenarPor} ordem={ordem} aoOrdenar={aoOrdenarColuna} />
                    <th className="w-px px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500 sm:px-6 dark:text-slate-400">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {list.map((f) => (
                    <tr
                      key={f.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/funcionarios-rede/${f.id}`)}
                      onKeyDown={(ev) => {
                        if (ev.key === 'Enter' || ev.key === ' ') {
                          ev.preventDefault()
                          navigate(`/funcionarios-rede/${f.id}`)
                        }
                      }}
                      className="cursor-pointer transition-colors hover:bg-slate-50/80 focus:outline-none focus-visible:bg-slate-100/80 dark:hover:bg-slate-800/50 dark:focus-visible:bg-slate-800/60"
                    >
                      <td className="px-4 py-3.5 sm:px-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`font-medium ${f.ativo ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>{f.nome}</span>
                          {!f.ativo && (
                            <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600 dark:text-slate-400">
                              Inativo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="max-w-[14rem] truncate px-4 py-3.5 text-slate-600 sm:px-6 dark:text-slate-400" title={f.email}>
                        {f.email}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-600 sm:px-6 dark:text-slate-400">
                        {tipoLabel[f.tipo as Tipo]}
                      </td>
                      <td className="px-4 py-3.5 text-right sm:px-6" onClick={(ev) => ev.stopPropagation()}>
                        <div className="inline-flex gap-1.5">
                          <Button
                            variant="ghost"
                            onClick={(ev) => {
                              ev.stopPropagation()
                              openEdit(f)
                            }}
                            aria-label="Editar funcionário"
                          >
                            <IconPencil ariaHidden={false} />
                          </Button>
                          <Button variant="ghost" onClick={() => handleDelete(f.id)} aria-label="Excluir funcionário">
                            <IconTrash ariaHidden={false} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { funcionariosRede, redes, empresas } from '../api/client'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { IconPencil } from '../components/ui/IconPencil'
import { IconTrash } from '../components/ui/IconTrash'
import { useToast } from '../components/ui/Toast'
import { FiltroInativos } from '../components/ui/FiltroInativos'
import { SelectComPesquisa } from '../components/ui/SelectComPesquisa'

type Tipo = 'socio' | 'supervisor' | 'colaborador'

export function FuncionariosRede() {
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const [list, setList] = useState<Awaited<ReturnType<typeof funcionariosRede.list>>>([])
  const [redesList, setRedesList] = useState<Awaited<ReturnType<typeof redes.list>>>([])
  const [empresasList, setEmpresasList] = useState<Awaited<ReturnType<typeof empresas.list>>>([])
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

  function load() {
    setLoading(true)
    funcionariosRede.list({ incluir_inativos: incluirInativos }).then(setList).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    redes.list({ incluir_inativos: true }).then(setRedesList)
    empresas.list({ incluir_inativos: true }).then(setEmpresasList)
  }, [incluirInativos])

  useEffect(() => {
    const editId = (location.state as { editId?: number } | null)?.editId
    if (editId && list.length > 0) {
      const item = list.find((f) => f.id === editId)
      if (item) openEdit(item)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [list, location.state, location.pathname, navigate])

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

  function openEdit(item: Awaited<ReturnType<typeof funcionariosRede.list>>[0]) {
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
      } else {
        await funcionariosRede.create(payload)
      }
      setModalOpen(false)
      load()
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
        <Button onClick={openCreate} disabled={modalOpen}>Novo</Button>
      </div>

      {modalOpen && (
        <Card title={editingId ? 'Editar funcionário' : 'Novo funcionário'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
            <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => {
                  const t = e.target.value as Tipo
                  setTipo(t)
                  setEmpresaId('')
                  setEmpresaIds([])
                  if (t === 'socio' && !redeId) setRedeId(redePadraoRecente())
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="socio">Sócio</option>
                <option value="supervisor">Supervisor</option>
                <option value="colaborador">Colaborador</option>
              </select>
            </div>
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
                  <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 p-3">
                    {empresasDaRede.map((e) => (
                      <label key={e.id} className="flex items-center gap-2">
                        <input type="checkbox" checked={empresaIds.includes(e.id)} onChange={() => toggleEmpresa(e.id)} />
                        <span>{e.nome}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="rounded border-slate-300" />
              Ativo
            </label>
            <div className="flex gap-2 pt-2 border-t border-slate-200">
              <Button type="submit" loading={saving}>Salvar</Button>
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="mb-4 flex items-center justify-end">
          <FiltroInativos incluirInativos={incluirInativos} onChange={setIncluirInativos} />
        </div>
        {loading ? (
          <p className="text-slate-500">Carregando...</p>
        ) : list.length === 0 ? (
          <p className="text-slate-500">Nenhum cadastrado.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {list.map((f) => (
              <li
                key={f.id}
                role="button"
                tabIndex={0}
                onClick={() => openEdit(f)}
                onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openEdit(f); } }}
                className="flex cursor-pointer items-center justify-between rounded-lg py-3 px-2 -mx-2 transition-colors duration-150 hover:bg-slate-50/80 focus:outline-none focus:bg-slate-50/80"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className={`font-medium ${f.ativo ? 'text-slate-800' : 'text-slate-400'}`}>{f.nome}</span>
                  {!f.ativo && <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600">Inativo</span>}
                  <span className="text-slate-500">{f.email}</span>
                  <span className="text-xs text-slate-400">({tipoLabel[f.tipo as Tipo]})</span>
                </div>
                <div className="flex shrink-0 gap-1.5" onClick={(ev) => ev.stopPropagation()}>
                  <Button variant="ghost" onClick={() => openEdit(f)} aria-label="Editar funcionário">
                    <IconPencil ariaHidden={false} />
                  </Button>
                  <Button variant="ghost" onClick={() => handleDelete(f.id)} aria-label="Excluir funcionário">
                    <IconTrash ariaHidden={false} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

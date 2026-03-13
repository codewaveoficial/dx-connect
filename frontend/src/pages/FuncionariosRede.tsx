import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { funcionariosRede, redes, empresas } from '../api/client'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { IconPencil } from '../components/ui/IconPencil'
import { IconTrash } from '../components/ui/IconTrash'

type Tipo = 'socio' | 'supervisor' | 'colaborador'

export function FuncionariosRede() {
  const location = useLocation()
  const navigate = useNavigate()
  const [list, setList] = useState<Awaited<ReturnType<typeof funcionariosRede.list>>>([])
  const [redesList, setRedesList] = useState<Awaited<ReturnType<typeof redes.list>>>([])
  const [empresasList, setEmpresasList] = useState<Awaited<ReturnType<typeof empresas.list>>>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [tipo, setTipo] = useState<Tipo>('colaborador')
  const [redeId, setRedeId] = useState<number | ''>('')
  const [empresaId, setEmpresaId] = useState<number | ''>('')
  const [empresaIds, setEmpresaIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    funcionariosRede.list().then(setList).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    redes.list().then(setRedesList)
    empresas.list().then(setEmpresasList)
  }, [])

  useEffect(() => {
    const editId = (location.state as { editId?: number } | null)?.editId
    if (editId && list.length > 0) {
      const item = list.find((f) => f.id === editId)
      if (item) openEdit(item)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [list, location.state, location.pathname, navigate])

  function openCreate() {
    setEditingId(null)
    setNome('')
    setEmail('')
    setTipo('colaborador')
    setRedeId('')
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
    setRedeId(item.rede_id ?? '')
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
    setSaving(true)
    try {
      const payload = {
        nome: nome.trim(),
        email,
        tipo,
        ativo: true,
        rede_id: tipo === 'socio' ? Number(redeId) : undefined,
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
      alert(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  const tipoLabel = { socio: 'Sócio', supervisor: 'Supervisor', colaborador: 'Colaborador' }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Funcionários da rede</h1>
        <Button onClick={openCreate}>Novo</Button>
      </div>
      <Card>
        {loading ? (
          <p className="text-slate-500">Carregando...</p>
        ) : list.length === 0 ? (
          <p className="text-slate-500">Nenhum cadastrado.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {list.map((f) => (
              <li key={f.id} className="flex items-center justify-between py-3">
                <div>
                  <span className="font-medium">{f.nome}</span>
                  <span className="ml-2 text-slate-500">{f.email}</span>
                  <span className="ml-2 text-xs text-slate-400">({tipoLabel[f.tipo as Tipo]})</span>
                </div>
                <div className="flex gap-1.5">
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

      {modalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <Card title={editingId ? 'Editar' : 'Novo funcionário'} className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
              <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value as Tipo)} className="w-full rounded-lg border border-slate-300 px-3 py-2">
                  <option value="socio">Sócio</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="colaborador">Colaborador</option>
                </select>
              </div>
              {tipo === 'socio' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Rede</label>
                  <select value={redeId} onChange={(e) => setRedeId(Number(e.target.value))} required className="w-full rounded-lg border border-slate-300 px-3 py-2">
                    <option value="">Selecione</option>
                    {redesList.map((r) => (
                      <option key={r.id} value={r.id}>{r.nome}</option>
                    ))}
                  </select>
                </div>
              )}
              {tipo === 'colaborador' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Empresa</label>
                  <select value={empresaId} onChange={(e) => setEmpresaId(Number(e.target.value))} required className="w-full rounded-lg border border-slate-300 px-3 py-2">
                    <option value="">Selecione</option>
                    {empresasList.map((e) => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                  </select>
                </div>
              )}
              {tipo === 'supervisor' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Empresas</label>
                  <div className="flex flex-wrap gap-2">
                    {empresasList.map((e) => (
                      <label key={e.id} className="flex items-center gap-2">
                        <input type="checkbox" checked={empresaIds.includes(e.id)} onChange={() => toggleEmpresa(e.id)} />
                        <span>{e.nome}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
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

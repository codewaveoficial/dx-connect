import { useState, useEffect } from 'react'
import { empresas as apiEmpresas, redes } from '../api/client'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { IconPencil } from '../components/ui/IconPencil'
import { IconTrash } from '../components/ui/IconTrash'

export function Empresas() {
  const [list, setList] = useState<Awaited<ReturnType<typeof apiEmpresas.list>>>([])
  const [redesList, setRedesList] = useState<Awaited<ReturnType<typeof redes.list>>>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [redeId, setRedeId] = useState<number | ''>('')
  const [nome, setNome] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    apiEmpresas.list().then(setList).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    redes.list().then(setRedesList)
  }, [])

  function openCreate() {
    setEditingId(null)
    setRedeId(redesList[0]?.id ?? '')
    setNome('')
    setError('')
    setModalOpen(true)
  }

  function openEdit(item: { id: number; rede_id: number; nome: string }) {
    setEditingId(item.id)
    setRedeId(item.rede_id)
    setNome(item.nome)
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!redeId) return
    setError('')
    setSaving(true)
    try {
      if (editingId) {
        await apiEmpresas.update(editingId, { rede_id: Number(redeId), nome: nome.trim() })
      } else {
        await apiEmpresas.create({ rede_id: Number(redeId), nome: nome.trim(), ativo: true })
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
    if (!confirm('Excluir esta empresa?')) return
    try {
      await apiEmpresas.delete(id)
      load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Empresas</h1>
        <Button onClick={openCreate}>Nova empresa</Button>
      </div>
      <Card>
        {loading ? (
          <p className="text-slate-500">Carregando...</p>
        ) : list.length === 0 ? (
          <p className="text-slate-500">Nenhuma empresa cadastrada.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {list.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-3">
                <span className="font-medium">{e.nome}</span>
                <div className="flex gap-1.5">
                  <Button variant="ghost" onClick={() => openEdit(e)} aria-label="Editar empresa">
                    <IconPencil ariaHidden={false} />
                  </Button>
                  <Button variant="ghost" onClick={() => handleDelete(e.id)} aria-label="Excluir empresa">
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
          <Card title={editingId ? 'Editar empresa' : 'Nova empresa'} className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Rede</label>
                <select value={redeId} onChange={(e) => setRedeId(Number(e.target.value))} required className="w-full rounded-lg border border-slate-300 px-3 py-2">
                  {redesList.map((r) => (
                    <option key={r.id} value={r.id}>{r.nome}</option>
                  ))}
                </select>
              </div>
              <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
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

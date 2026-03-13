import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { redes } from '../api/client'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { IconPencil } from '../components/ui/IconPencil'
import { IconEye } from '../components/ui/IconEye'
import { IconTrash } from '../components/ui/IconTrash'

export function Redes() {
  const [list, setList] = useState<Awaited<ReturnType<typeof redes.list>>>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [nome, setNome] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    redes.list().then(setList).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  function openCreate() {
    setEditingId(null)
    setNome('')
    setError('')
    setModalOpen(true)
  }

  function openEdit(item: { id: number; nome: string }) {
    setEditingId(item.id)
    setNome(item.nome)
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editingId) {
        await redes.update(editingId, { nome: nome.trim() })
      } else {
        await redes.create({ nome: nome.trim(), ativo: true })
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
    if (!confirm('Excluir esta rede?')) return
    try {
      await redes.delete(id)
      load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Redes</h1>
        <Button onClick={openCreate}>Nova rede</Button>
      </div>
      <Card>
        {loading ? (
          <p className="text-slate-500">Carregando...</p>
        ) : list.length === 0 ? (
          <p className="text-slate-500">Nenhuma rede cadastrada.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {list.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <span className="font-medium">{r.nome}</span>
                <div className="flex gap-1.5">
                  <Link to={`/redes/${r.id}`} aria-label="Ver detalhes da rede">
                    <Button variant="ghost">
                      <IconEye ariaHidden={false} />
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={() => openEdit(r)} aria-label="Editar rede">
                    <IconPencil ariaHidden={false} />
                  </Button>
                  <Button variant="ghost" onClick={() => handleDelete(r.id)} aria-label="Excluir rede">
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
          <Card title={editingId ? 'Editar rede' : 'Nova rede'} className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
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

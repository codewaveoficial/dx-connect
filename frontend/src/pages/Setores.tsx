import { useState, useEffect } from 'react'
import { setores } from '../api/client'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { IconPencil } from '../components/ui/IconPencil'
import { IconTrash } from '../components/ui/IconTrash'

export function Setores() {
  const [list, setList] = useState<Awaited<ReturnType<typeof setores.list>>>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    setores.list().then(setList).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  function openCreate() {
    setEditingId(null)
    setNome('')
    setSlug('')
    setError('')
    setModalOpen(true)
  }

  function openEdit(item: { id: number; nome: string; slug: string }) {
    setEditingId(item.id)
    setNome(item.nome)
    setSlug(item.slug)
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editingId) {
        await setores.update(editingId, { nome: nome.trim(), slug: slug.trim() })
      } else {
        await setores.create({ nome: nome.trim(), slug: slug.trim(), ativo: true })
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
    if (!confirm('Excluir este setor?')) return
    try {
      await setores.delete(id)
      load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Setores</h1>
        <Button onClick={openCreate}>Novo setor</Button>
      </div>
      <Card>
        {loading ? (
          <p className="text-slate-500">Carregando...</p>
        ) : list.length === 0 ? (
          <p className="text-slate-500">Nenhum setor cadastrado.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {list.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-3">
                <span className="font-medium">{s.nome}</span>
                <span className="text-slate-500 text-sm">{s.slug}</span>
                <div className="flex gap-1.5">
                  <Button variant="ghost" onClick={() => openEdit(s)} aria-label="Editar setor">
                    <IconPencil ariaHidden={false} />
                  </Button>
                  <Button variant="ghost" onClick={() => handleDelete(s.id)} aria-label="Excluir setor">
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
          <Card title={editingId ? 'Editar setor' : 'Novo setor'} className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
              <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ex: suporte" required />
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

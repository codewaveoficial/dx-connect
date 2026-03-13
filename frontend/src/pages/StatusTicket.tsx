import { useState, useEffect } from 'react'
import { statusTicket } from '../api/client'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { IconPencil } from '../components/ui/IconPencil'

export function StatusTicketPage() {
  const [list, setList] = useState<Awaited<ReturnType<typeof statusTicket.list>>>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [ordem, setOrdem] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    statusTicket.list().then(setList).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  function openCreate() {
    setEditingId(null)
    setNome('')
    setSlug('')
    setOrdem(list.length)
    setError('')
    setModalOpen(true)
  }

  function openEdit(item: Awaited<ReturnType<typeof statusTicket.list>>[0]) {
    setEditingId(item.id)
    setNome(item.nome)
    setSlug(item.slug)
    setOrdem(item.ordem)
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editingId) {
        await statusTicket.update(editingId, { nome: nome.trim(), slug: slug.trim(), ordem })
      } else {
        await statusTicket.create({ nome: nome.trim(), slug: slug.trim(), ordem, ativo: true })
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
        <h1 className="text-2xl font-bold text-slate-800">Status de ticket</h1>
        <Button onClick={openCreate}>Novo status</Button>
      </div>
      <Card>
        {loading ? (
          <p className="text-slate-500">Carregando...</p>
        ) : list.length === 0 ? (
          <p className="text-slate-500">Nenhum status cadastrado.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {list.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <span className="font-medium">{s.nome}</span>
                  <span className="ml-2 text-slate-500 text-sm">{s.slug}</span>
                  <span className="ml-2 text-slate-400">ordem: {s.ordem}</span>
                </div>
                <Button variant="ghost" onClick={() => openEdit(s)} aria-label="Editar"><IconPencil /></Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <Card title={editingId ? 'Editar status' : 'Novo status'} className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
              <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ex: aberto" required />
              <Input label="Ordem" type="number" value={ordem} onChange={(e) => setOrdem(Number(e.target.value))} />
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

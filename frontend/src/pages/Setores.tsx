import { useState, useEffect } from 'react'
import { setores } from '../api/client'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { IconPencil } from '../components/ui/IconPencil'
import { IconTrash } from '../components/ui/IconTrash'
import { useToast } from '../components/ui/Toast'
import { FiltroInativos } from '../components/ui/FiltroInativos'

export function Setores() {
  const toast = useToast()
  const [list, setList] = useState<Awaited<ReturnType<typeof setores.list>>>([])
  const [loading, setLoading] = useState(true)
  const [incluirInativos, setIncluirInativos] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    setores.list({ incluir_inativos: incluirInativos }).then(setList).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [incluirInativos])

  function openCreate() {
    setEditingId(null)
    setNome('')
    setSlug('')
    setAtivo(true)
    setError('')
    setModalOpen(true)
  }

  function openEdit(item: { id: number; nome: string; slug: string; ativo: boolean }) {
    setEditingId(item.id)
    setNome(item.nome)
    setSlug(item.slug)
    setAtivo(item.ativo)
    setError('')
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editingId) {
        await setores.update(editingId, { nome: nome.trim(), slug: slug.trim(), ativo })
      } else {
        await setores.create({ nome: nome.trim(), slug: slug.trim(), ativo })
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
      toast.showWarning(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Setores</h1>
        <Button onClick={openCreate}>Novo setor</Button>
      </div>
      <Card>
        <div className="mb-4 flex items-center justify-end">
          <FiltroInativos incluirInativos={incluirInativos} onChange={setIncluirInativos} />
        </div>
        {loading ? (
          <p className="text-slate-500">Carregando...</p>
        ) : list.length === 0 ? (
          <p className="text-slate-500">Nenhum setor cadastrado.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {list.map((s) => (
              <li
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={() => openEdit(s)}
                onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openEdit(s); } }}
                className="flex cursor-pointer items-center justify-between rounded-lg py-3 px-2 -mx-2 transition-colors duration-150 hover:bg-slate-50/80 focus:outline-none focus:bg-slate-50/80"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`font-medium ${s.ativo ? 'text-slate-800' : 'text-slate-400'}`}>{s.nome}</span>
                  {!s.ativo && <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600">Inativo</span>}
                </div>
                <span className="text-slate-500 text-sm">{s.slug}</span>
                <div className="flex gap-1.5 shrink-0" onClick={(ev) => ev.stopPropagation()}>
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
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="rounded border-slate-300" />
                Ativo
              </label>
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

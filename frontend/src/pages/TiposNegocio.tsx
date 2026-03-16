import { useState, useEffect } from 'react'
import { tiposNegocio } from '../api/client'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { IconPencil } from '../components/ui/IconPencil'
import { IconTrash } from '../components/ui/IconTrash'
import { useToast } from '../components/ui/Toast'
import { FiltroInativos } from '../components/ui/FiltroInativos'

export function TiposNegocio() {
  const toast = useToast()
  const [list, setList] = useState<Awaited<ReturnType<typeof tiposNegocio.list>>>([])
  const [loading, setLoading] = useState(true)
  const [incluirInativos, setIncluirInativos] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [nome, setNome] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    tiposNegocio.list({ incluir_inativos: incluirInativos }).then(setList).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [incluirInativos])

  function openCreate() {
    setEditingId(null)
    setNome('')
    setAtivo(true)
    setError('')
    setModalOpen(true)
  }

  function openEdit(item: { id: number; nome: string; ativo: boolean }) {
    setEditingId(item.id)
    setNome(item.nome)
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
        await tiposNegocio.update(editingId, { nome: nome.trim(), ativo })
      } else {
        await tiposNegocio.create({ nome: nome.trim(), ativo })
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
    if (!confirm('Excluir este tipo de negócio?')) return
    try {
      await tiposNegocio.delete(id)
      load()
    } catch (err) {
      toast.showWarning(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Tipos de negócio</h1>
        <Button onClick={openCreate}>Novo tipo</Button>
      </div>
      <Card>
        <div className="mb-4 flex items-center justify-end">
          <FiltroInativos incluirInativos={incluirInativos} onChange={setIncluirInativos} />
        </div>
        {loading ? (
          <p className="text-slate-500">Carregando...</p>
        ) : list.length === 0 ? (
          <p className="text-slate-500">Nenhum tipo cadastrado.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {list.map((t) => (
              <li
                key={t.id}
                role="button"
                tabIndex={0}
                onClick={() => openEdit(t)}
                onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openEdit(t); } }}
                className="flex cursor-pointer items-center justify-between rounded-lg py-3 px-2 -mx-2 transition-colors duration-150 hover:bg-slate-50/80 focus:outline-none focus:bg-slate-50/80"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`font-medium ${t.ativo ? 'text-slate-800' : 'text-slate-400'}`}>{t.nome}</span>
                  {!t.ativo && <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600">Inativo</span>}
                </div>
                <div className="flex shrink-0 gap-1.5" onClick={(ev) => ev.stopPropagation()}>
                  <Button variant="ghost" onClick={() => openEdit(t)} aria-label="Editar">
                    <IconPencil ariaHidden={false} />
                  </Button>
                  <Button variant="ghost" onClick={() => handleDelete(t.id)} aria-label="Excluir">
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
          <Card title={editingId ? 'Editar tipo' : 'Novo tipo de negócio'} className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
              <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
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

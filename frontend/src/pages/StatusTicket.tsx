import { useState, useEffect } from 'react'
import { statusTicket, type StatusTicket } from '../api/client'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { IconPencil } from '../components/ui/IconPencil'
import { FiltroInativos } from '../components/ui/FiltroInativos'
import { BarraBuscaPaginacao, PAGE_SIZE_PADRAO } from '../components/ui/BarraBuscaPaginacao'
import { Switch } from '../components/ui/Switch'

export function StatusTicketPage() {
  const [list, setList] = useState<StatusTicket.Status[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [busca, setBusca] = useState('')
  const [debouncedBusca, setDebouncedBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [incluirInativos, setIncluirInativos] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [ordem, setOrdem] = useState(0)
  const [ativo, setAtivo] = useState(true)
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
    statusTicket
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
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, debouncedBusca, incluirInativos])

  function openCreate() {
    setEditingId(null)
    setNome('')
    setSlug('')
    setOrdem(total)
    setAtivo(true)
    setError('')
    setModalOpen(true)
  }

  function openEdit(item: StatusTicket.Status) {
    setEditingId(item.id)
    setNome(item.nome)
    setSlug(item.slug)
    setOrdem(item.ordem)
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
        await statusTicket.update(editingId, { nome: nome.trim(), slug: slug.trim(), ordem, ativo })
      } else {
        await statusTicket.create({ nome: nome.trim(), slug: slug.trim(), ordem, ativo })
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
      {!modalOpen && (
        <Card>
          <BarraBuscaPaginacao
            busca={busca}
            onBuscaChange={setBusca}
            placeholder="Buscar por nome ou slug"
            page={page}
            total={total}
            onPageChange={setPage}
            disabled={loading}
            extra={<FiltroInativos incluirInativos={incluirInativos} onChange={setIncluirInativos} />}
          />
        {loading ? (
          <p className="text-slate-500">Carregando...</p>
        ) : list.length === 0 ? (
          <p className="text-slate-500">Nenhum status encontrado.</p>
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
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className={`font-medium ${s.ativo ? 'text-slate-800' : 'text-slate-400'}`}>{s.nome}</span>
                  {!s.ativo && <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600">Inativo</span>}
                  <span className="text-slate-500 text-sm">{s.slug}</span>
                  <span className="text-slate-400">ordem: {s.ordem}</span>
                </div>
                <div className="shrink-0" onClick={(ev) => ev.stopPropagation()}>
                  <Button variant="ghost" onClick={() => openEdit(s)} aria-label="Editar"><IconPencil /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        </Card>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <Card title={editingId ? 'Editar status' : 'Novo status'} className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
              <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="ex: aberto" required />
              <Input label="Ordem" type="number" value={ordem} onChange={(e) => setOrdem(Number(e.target.value))} />
              <Switch checked={ativo} onCheckedChange={setAtivo} label="Ativo" />
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

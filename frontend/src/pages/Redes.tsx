import { useState, useEffect } from 'react'
import { CabecalhoOrdenavel } from '../components/ui/CabecalhoOrdenavel'
import { useOrdenacaoLista } from '../hooks/useOrdenacaoLista'
import { useNavigate } from 'react-router-dom'
import { redes, type Redes } from '../api/client'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { IconPencil } from '../components/ui/IconPencil'
import { IconTrash } from '../components/ui/IconTrash'
import { useToast } from '../components/ui/Toast'
import { FiltroInativos } from '../components/ui/FiltroInativos'
import { BarraBuscaPaginacao, PAGE_SIZE_PADRAO } from '../components/ui/BarraBuscaPaginacao'
import { Switch } from '../components/ui/Switch'

type ColunaRede = 'nome' | 'ativo'

export function Redes() {
  const navigate = useNavigate()
  const toast = useToast()
  const { ordenarPor, ordem, aoOrdenarColuna, sortParams } = useOrdenacaoLista<ColunaRede>()
  const [list, setList] = useState<Redes.Rede[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [busca, setBusca] = useState('')
  const [debouncedBusca, setDebouncedBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [incluirInativos, setIncluirInativos] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [nome, setNome] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedBusca(busca.trim()), 400)
    return () => clearTimeout(t)
  }, [busca])

  useEffect(() => {
    setPage(1)
  }, [debouncedBusca, incluirInativos, ordenarPor, ordem])

  function load() {
    setLoading(true)
    redes
      .list({
        incluir_inativos: incluirInativos,
        busca: debouncedBusca || undefined,
        ...sortParams,
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
  }, [page, debouncedBusca, incluirInativos, ordenarPor, ordem])

  function openCreate() {
    setEditingId(null)
    setNome('')
    setAtivo(true)
    setModalOpen(true)
  }

  function openEdit(item: Redes.Rede) {
    setEditingId(item.id)
    setNome(item.nome)
    setAtivo(item.ativo)
    setModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await redes.update(editingId, { nome: nome.trim(), ativo })
        toast.showSuccess('Rede atualizada.')
      } else {
        await redes.create({ nome: nome.trim(), ativo })
        toast.showSuccess('Rede cadastrada.')
      }
      setModalOpen(false)
      load()
    } catch (err) {
      toast.showError(err instanceof Error ? err.message : 'Erro')
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
      toast.showWarning(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Redes</h1>
        <Button onClick={openCreate}>Nova rede</Button>
      </div>
      {!modalOpen && (
        <Card>
          <BarraBuscaPaginacao
            busca={busca}
            onBuscaChange={setBusca}
            placeholder="Buscar por nome da rede"
            page={page}
            total={total}
            onPageChange={setPage}
            disabled={loading}
            extra={<FiltroInativos incluirInativos={incluirInativos} onChange={setIncluirInativos} />}
          />
          {loading ? (
            <p className="text-slate-500 dark:text-slate-400">Carregando...</p>
          ) : list.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">Nenhuma rede encontrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40">
                    <CabecalhoOrdenavel
                      coluna="nome"
                      rotulo="Nome"
                      ordenarPor={ordenarPor}
                      ordem={ordem}
                      aoOrdenar={aoOrdenarColuna}
                    />
                    <CabecalhoOrdenavel
                      coluna="ativo"
                      rotulo="Situação"
                      ordenarPor={ordenarPor}
                      ordem={ordem}
                      aoOrdenar={aoOrdenarColuna}
                    />
                    <th className="w-px whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6 dark:text-slate-400">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {list.map((r) => (
                    <tr
                      key={r.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/redes/${r.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          navigate(`/redes/${r.id}`)
                        }
                      }}
                      className="cursor-pointer transition-colors hover:bg-slate-50/90 focus:outline-none focus-visible:bg-slate-100/80 dark:hover:bg-slate-800/50 dark:focus-visible:bg-slate-800/60"
                    >
                      <td className="px-4 py-3.5 sm:px-6">
                        <span className={`font-medium ${r.ativo ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
                          {r.nome}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                        {r.ativo ? (
                          <span className="text-slate-600 dark:text-slate-400">Ativo</span>
                        ) : (
                          <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right sm:px-6" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex gap-1.5">
                          <Button variant="ghost" onClick={() => openEdit(r)} aria-label="Editar rede">
                            <IconPencil ariaHidden={false} />
                          </Button>
                          <Button variant="ghost" onClick={() => handleDelete(r.id)} aria-label="Excluir rede">
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

      {modalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <Card title={editingId ? 'Editar rede' : 'Nova rede'} className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              <Switch checked={ativo} onCheckedChange={setAtivo} label="Ativo" description="Inativos ficam ocultos nas listagens padrão." />
              <div className="flex gap-2">
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
    </div>
  )
}

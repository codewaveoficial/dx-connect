import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { tickets, statusTicket, type Tickets } from '../api/client'
import { coletarTodasPaginas } from '../api/collectPages'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { IconEye } from '../components/ui/IconEye'
import { BarraBuscaPaginacao, PAGE_SIZE_PADRAO } from '../components/ui/BarraBuscaPaginacao'

export function Tickets() {
  const navigate = useNavigate()
  const [list, setList] = useState<Tickets.Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [busca, setBusca] = useState('')
  const [debouncedBusca, setDebouncedBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<number | ''>('')
  const [statusList, setStatusList] = useState<{ id: number; nome: string }[]>([])

  useEffect(() => {
    coletarTodasPaginas((o, l) => statusTicket.list({ offset: o, limit: l })).then((rows) =>
      setStatusList(rows.map((s) => ({ id: s.id, nome: s.nome }))),
    )
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedBusca(busca.trim()), 400)
    return () => clearTimeout(t)
  }, [busca])

  useEffect(() => {
    setPage(1)
  }, [debouncedBusca, filtroStatus])

  useEffect(() => {
    setLoading(true)
    tickets
      .list({
        busca: debouncedBusca || undefined,
        status_id: filtroStatus !== '' ? Number(filtroStatus) : undefined,
        offset: (page - 1) * PAGE_SIZE_PADRAO,
        limit: PAGE_SIZE_PADRAO,
      })
      .then(({ items, total: t }) => {
        setList(items)
        setTotal(t)
      })
      .catch(() => {
        setList([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, debouncedBusca, filtroStatus])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Tickets</h1>
        <Link to="/tickets/novo">
          <Button>Novo ticket</Button>
        </Link>
      </div>

      <Card>
        <BarraBuscaPaginacao
          busca={busca}
          onBuscaChange={setBusca}
          placeholder="Buscar por protocolo, assunto ou empresa"
          page={page}
          total={total}
          onPageChange={setPage}
          disabled={loading}
          extra={
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value === '' ? '' : Number(e.target.value))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              aria-label="Filtrar por status"
            >
              <option value="">Todos os status</option>
              {statusList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          }
        />

        {loading ? (
          <p className="text-slate-500">Carregando...</p>
        ) : list.length === 0 ? (
          <p className="text-slate-500">Nenhum ticket encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="pb-2 pr-4 font-medium">Protocolo</th>
                  <th className="pb-2 pr-4 font-medium">Empresa</th>
                  <th className="pb-2 pr-4 font-medium">Setor</th>
                  <th className="pb-2 pr-4 font-medium">Assunto</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Atendente</th>
                  <th className="pb-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/tickets/${t.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(`/tickets/${t.id}`)
                      }
                    }}
                    className="cursor-pointer border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50/80 focus:outline-none focus:bg-slate-50/80"
                  >
                    <td className="py-3 pr-4 font-mono text-slate-800">{t.protocolo}</td>
                    <td className="py-3 pr-4">{t.empresa_nome ?? t.empresa_id}</td>
                    <td className="py-3 pr-4">{t.setor_nome ?? t.setor_id}</td>
                    <td className="py-3 pr-4 font-medium text-slate-800">{t.assunto}</td>
                    <td className="py-3 pr-4">{t.status_nome ?? t.status_id}</td>
                    <td className="py-3 pr-4">{t.atendente_nome ?? '—'}</td>
                    <td className="py-3" onClick={(e) => e.stopPropagation()}>
                      <Button
                        type="button"
                        variant="ghost"
                        className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900"
                        onClick={() => navigate(`/tickets/${t.id}`)}
                        aria-label="Ver ticket"
                      >
                        <IconEye ariaHidden={false} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

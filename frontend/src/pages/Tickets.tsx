import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { tickets, statusTicket, type Tickets } from '../api/client'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { IconEye } from '../components/ui/IconEye'

export function Tickets() {
  const [list, setList] = useState<Tickets.Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroProtocolo, setFiltroProtocolo] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<number | ''>('')
  const [statusList, setStatusList] = useState<{ id: number; nome: string }[]>([])

  useEffect(() => {
    statusTicket.list().then((s) => setStatusList(s))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params: { protocolo?: string; status_id?: number } = {}
    if (filtroProtocolo) params.protocolo = filtroProtocolo
    if (filtroStatus !== '') params.status_id = Number(filtroStatus)
    tickets
      .list(params)
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [filtroProtocolo, filtroStatus])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Tickets</h1>
        <Link to="/tickets/novo">
          <Button>Novo ticket</Button>
        </Link>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Buscar por protocolo"
            value={filtroProtocolo}
            onChange={(e) => setFiltroProtocolo(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value === '' ? '' : Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Todos os status</option>
            {statusList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>

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
                  <tr key={t.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-mono text-slate-800">{t.protocolo}</td>
                    <td className="py-3 pr-4">{t.empresa_nome ?? t.empresa_id}</td>
                    <td className="py-3 pr-4">{t.setor_nome ?? t.setor_id}</td>
                    <td className="py-3 pr-4">{t.assunto}</td>
                    <td className="py-3 pr-4">{t.status_nome ?? t.status_id}</td>
                    <td className="py-3 pr-4">{t.atendente_nome ?? '—'}</td>
                    <td className="py-3">
                      <Link to={`/tickets/${t.id}`} aria-label="Ver ticket">
                        <Button
                          type="button"
                          variant="ghost"
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900"
                        >
                          <IconEye ariaHidden={false} />
                        </Button>
                      </Link>
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

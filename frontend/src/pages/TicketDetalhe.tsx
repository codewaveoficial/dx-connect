import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { tickets, statusTicket, atendentes } from '../api/client'
import { coletarTodasPaginas } from '../api/collectPages'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export function TicketDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<Awaited<ReturnType<typeof tickets.get>> | null>(null)
  const [historico, setHistorico] = useState<Awaited<ReturnType<typeof tickets.getHistorico>>>([])
  const [statusList, setStatusList] = useState<{ id: number; nome: string }[]>([])
  const [atendentesList, setAtendentesList] = useState<{ id: number; nome: string }[]>([])
  const [editStatus, setEditStatus] = useState<number | ''>('')
  const [editAtendente, setEditAtendente] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    tickets.get(Number(id)).then(setTicket).catch(() => setTicket(null))
    tickets.getHistorico(Number(id)).then(setHistorico).catch(() => setHistorico([]))
    coletarTodasPaginas((o, l) => statusTicket.list({ offset: o, limit: l })).then((rows) =>
      setStatusList(rows.map((s) => ({ id: s.id, nome: s.nome }))),
    )
    coletarTodasPaginas((o, l) => atendentes.list({ offset: o, limit: l })).then((rows) =>
      setAtendentesList(rows.map((a) => ({ id: a.id, nome: a.nome }))),
    )
  }, [id])

  useEffect(() => {
    if (ticket) {
      setEditStatus(ticket.status_id)
      setEditAtendente(ticket.atendente_id ?? '')
    }
  }, [ticket])

  async function handleSalvar() {
    if (!ticket) return
    setSaving(true)
    try {
      const updated = await tickets.update(ticket.id, {
        status_id: Number(editStatus),
        atendente_id: editAtendente === '' ? null : Number(editAtendente),
      } as { status_id: number; atendente_id: number | null })
      setTicket(updated)
      const hist = await tickets.getHistorico(ticket.id)
      setHistorico(hist)
    } finally {
      setSaving(false)
    }
  }

  if (!ticket) {
    return (
      <div className="text-slate-600">
        Carregando... ou ticket não encontrado.
        <button type="button" onClick={() => navigate('/')} className="ml-2 underline">
          Voltar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Ticket #{ticket.protocolo}
          </h1>
          <p className="text-slate-500">
            {ticket.empresa_nome} · {ticket.setor_nome}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/')}>
          Voltar à lista
        </Button>
      </div>

      <Card title={ticket.assunto}>
        <p className="whitespace-pre-wrap text-slate-700">{ticket.descricao || '—'}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
          <span>Status: {ticket.status_nome}</span>
          <span>Atendente: {ticket.atendente_nome ?? '—'}</span>
          <span>Aberto em: {ticket.created_at ? new Date(ticket.created_at).toLocaleString('pt-BR') : '—'}</span>
        </div>
      </Card>

      <Card title="Alterar ticket">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value === '' ? '' : Number(e.target.value))}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              {statusList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Atendente</label>
            <select
              value={editAtendente}
              onChange={(e) => setEditAtendente(e.target.value === '' ? '' : Number(e.target.value))}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">— Nenhum —</option>
              {atendentesList.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleSalvar} loading={saving}>
              Salvar alterações
            </Button>
          </div>
        </div>
      </Card>

      {historico.length > 0 && (
        <Card title="Histórico de alterações">
          <ul className="space-y-2 text-sm">
            {historico.map((h) => (
              <li key={h.id} className="rounded bg-slate-50 px-3 py-2">
                <span className="font-medium">{h.campo}</span>: {h.valor_antigo ?? '—'} → {h.valor_novo ?? '—'} ·{' '}
                {new Date(h.created_at).toLocaleString('pt-BR')}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

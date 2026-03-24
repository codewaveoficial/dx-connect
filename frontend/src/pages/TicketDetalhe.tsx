import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { tickets, statusTicket, atendentes, setores, type StatusTicket, type Atendentes, type Setores, type Tickets } from '../api/client'
import { coletarTodasPaginas } from '../api/collectPages'
import { Card } from '../components/ui/Card'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../contexts/AuthContext'

const ROTULO_CAMPO: Record<string, string> = {
  status_id: 'Status',
  setor_id: 'Setor',
  atendente_id: 'Responsável',
  assunto: 'Assunto',
  descricao: 'Descrição',
}

function resolverValorHistorico(
  campo: string,
  valor: string | null | undefined,
  maps: {
    status: Map<number, string>
    setor: Map<number, string>
    atendente: Map<number, string>
  },
): string {
  if (valor == null || valor === '') return '—'
  if (campo === 'status_id' || campo === 'setor_id' || campo === 'atendente_id') {
    const id = Number(valor)
    if (Number.isNaN(id)) return valor
    const m =
      campo === 'status_id' ? maps.status : campo === 'setor_id' ? maps.setor : maps.atendente
    return m.get(id) ?? `#${id}`
  }
  const t = (valor || '').trim()
  return t || '—'
}

function tituloTipoMensagem(tipo: string): string {
  if (tipo === 'abertura') return 'Solicitação inicial'
  if (tipo === 'publico') return 'Mensagem da equipe'
  if (tipo === 'interno') return 'Comentário interno'
  return tipo
}

export function TicketDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { isAdmin, user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [ticket, setTicket] = useState<Tickets.Ticket | null>(null)
  const [historico, setHistorico] = useState<Tickets.Historico[]>([])
  const [mensagens, setMensagens] = useState<Tickets.Mensagem[]>([])
  const [statusList, setStatusList] = useState<StatusTicket.Status[]>([])
  const [atendentesList, setAtendentesList] = useState<Atendentes.Atendente[]>([])
  const [setoresList, setSetoresList] = useState<Setores.Setor[]>([])

  const [editSetor, setEditSetor] = useState<number | ''>('')
  const [editStatus, setEditStatus] = useState<number | ''>('')
  const [editAtendente, setEditAtendente] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [novaMensagemTexto, setNovaMensagemTexto] = useState('')
  const [tipoNovaMensagem, setTipoNovaMensagem] = useState<'publico' | 'interno'>('publico')
  const [enviandoMensagem, setEnviandoMensagem] = useState(false)
  const [modalGerirAberto, setModalGerirAberto] = useState(false)
  /** Qual bloco do modal recebe destaque ao abrir (chips no cabeçalho). */
  const [modalGerirFoco, setModalGerirFoco] = useState<'geral' | 'setor' | 'status' | 'atendente'>('geral')
  const [historicoAberto, setHistoricoAberto] = useState(false)

  const setorIdsPermitidos = useMemo(() => {
    if (isAdmin) return null
    return new Set(user?.setor_ids ?? [])
  }, [isAdmin, user?.setor_ids])

  const setoresParaSelect = useMemo(() => {
    const ativos = setoresList.filter((s) => s.ativo)
    let base = !setorIdsPermitidos ? ativos : ativos.filter((s) => setorIdsPermitidos.has(s.id))
    if (ticket) {
      const cur = setoresList.find((s) => s.id === ticket.setor_id)
      if (cur && !base.some((s) => s.id === cur.id)) {
        base = [...base, cur]
      }
    }
    return [...base].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [setoresList, setorIdsPermitidos, ticket])

  const statusParaSelect = useMemo(() => {
    const ativos = statusList.filter((s) => s.ativo)
    if (!ticket) return ativos
    if (ativos.some((s) => s.id === ticket.status_id)) return ativos
    return [
      ...ativos,
      {
        id: ticket.status_id,
        nome: ticket.status_nome ?? `Status #${ticket.status_id}`,
        slug: '',
        ordem: 999,
        ativo: false,
      },
    ]
  }, [statusList, ticket])

  const mapsHistorico = useMemo(() => {
    const status = new Map<number, string>()
    statusList.forEach((s) => status.set(s.id, s.nome))
    const setor = new Map<number, string>()
    setoresList.forEach((s) => setor.set(s.id, s.nome))
    const atendente = new Map<number, string>()
    atendentesList.forEach((a) => atendente.set(a.id, a.nome))
    if (ticket?.status_nome) status.set(ticket.status_id, ticket.status_nome)
    if (ticket?.setor_nome) setor.set(ticket.setor_id, ticket.setor_nome)
    if (ticket?.atendente_nome && ticket.atendente_id != null) {
      atendente.set(ticket.atendente_id, ticket.atendente_nome)
    }
    return { status, setor, atendente }
  }, [statusList, setoresList, atendentesList, ticket])

  useEffect(() => {
    coletarTodasPaginas<StatusTicket.Status>((o, l) =>
      statusTicket.list({ incluir_inativos: false, offset: o, limit: l }),
    ).then(setStatusList)
    coletarTodasPaginas<Atendentes.Atendente>((o, l) =>
      atendentes.list({ incluir_inativos: false, offset: o, limit: l }),
    ).then(setAtendentesList)
    coletarTodasPaginas<Setores.Setor>((o, l) =>
      setores.list({ incluir_inativos: true, offset: o, limit: l }),
    ).then(setSetoresList)
  }, [])

  useEffect(() => {
    if (!id) return
    const numId = Number(id)
    if (Number.isNaN(numId)) {
      setNotFound(true)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setNotFound(false)
    Promise.all([tickets.get(numId), tickets.getHistorico(numId), tickets.listMensagens(numId)])
      .then(([t, h, m]) => {
        if (cancelled) return
        setTicket(t)
        setHistorico(h)
        setMensagens(m)
        setEditSetor(t.setor_id)
        setEditStatus(t.status_id)
        setEditAtendente(t.atendente_id ?? '')
      })
      .catch(() => {
        if (!cancelled) {
          setTicket(null)
          setHistorico([])
          setMensagens([])
          setNotFound(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!modalGerirAberto || !ticket) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setModalGerirAberto(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [modalGerirAberto, ticket])

  function abrirModalGerir(foco: 'geral' | 'setor' | 'status' | 'atendente' = 'geral') {
    if (!ticket) return
    setEditSetor(ticket.setor_id)
    setEditStatus(ticket.status_id)
    setEditAtendente(ticket.atendente_id ?? '')
    setModalGerirFoco(foco)
    setModalGerirAberto(true)
  }

  const modalApenasUmCampo = modalGerirFoco !== 'geral'

  async function handleSalvar() {
    if (!ticket) return
    const patch: Tickets.Update = {}
    if (editSetor !== '' && Number(editSetor) !== ticket.setor_id) patch.setor_id = Number(editSetor)
    if (editStatus !== '' && Number(editStatus) !== ticket.status_id) patch.status_id = Number(editStatus)
    const atendAtual = ticket.atendente_id
    const atendNovo = editAtendente === '' ? null : Number(editAtendente)
    if (atendNovo !== atendAtual) patch.atendente_id = atendNovo

    if (Object.keys(patch).length === 0) {
      toast.showWarning('Nenhuma alteração para salvar.')
      return
    }

    setSaving(true)
    try {
      const updated = await tickets.update(ticket.id, patch)
      setTicket(updated)
      const hist = await tickets.getHistorico(ticket.id)
      setHistorico(hist)
      setEditSetor(updated.setor_id)
      setEditStatus(updated.status_id)
      setEditAtendente(updated.atendente_id ?? '')
      setModalGerirAberto(false)
      toast.showSuccess('Alterações aplicadas.')
    } catch (err) {
      toast.showWarning(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleEnviarMensagem() {
    if (!ticket) return
    const texto = novaMensagemTexto.trim()
    if (!texto) {
      toast.showWarning('Escreva uma mensagem antes de enviar.')
      return
    }
    setEnviandoMensagem(true)
    try {
      await tickets.addMensagem(ticket.id, { corpo: texto, tipo: tipoNovaMensagem })
      const m = await tickets.listMensagens(ticket.id)
      setMensagens(m)
      setNovaMensagemTexto('')
      toast.showSuccess(tipoNovaMensagem === 'interno' ? 'Comentário interno registrado.' : 'Mensagem enviada.')
    } catch (err) {
      toast.showWarning(err instanceof Error ? err.message : 'Erro ao enviar')
    } finally {
      setEnviandoMensagem(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">Carregando ticket…</div>
    )
  }

  if (notFound || !ticket) {
    return (
      <div className="space-y-4">
        <p className="text-slate-600">Ticket não encontrado ou sem permissão.</p>
        <Link to="/tickets" className="text-slate-800 underline font-medium">
          Voltar para tickets
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link to="/tickets" className="font-medium text-slate-600 hover:text-slate-900">
          Tickets
        </Link>
        <span aria-hidden className="text-slate-300">
          /
        </span>
        <span className="font-semibold text-slate-800">#{ticket.protocolo}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Assunto</p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{ticket.assunto}</h1>
          <p className="mt-2 text-sm text-slate-600">
            <span className="font-medium text-slate-800">{ticket.empresa_nome ?? `Empresa #${ticket.empresa_id}`}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Ações rápidas do ticket">
            <button
              type="button"
              onClick={() => abrirModalGerir('setor')}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs shadow-sm ring-slate-900/[0.03] transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <span className="shrink-0 font-medium text-slate-400">Setor</span>
              <span className="min-w-0 truncate font-semibold text-slate-800">
                {ticket.setor_nome ?? `Setor #${ticket.setor_id}`}
              </span>
            </button>
            <button
              type="button"
              onClick={() => abrirModalGerir('status')}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <span className="shrink-0 font-medium text-slate-400">Status</span>
              <span className="min-w-0 truncate font-semibold text-slate-800">
                {ticket.status_nome ?? String(ticket.status_id)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => abrirModalGerir('atendente')}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <span className="shrink-0 font-medium text-slate-400">Responsável</span>
              <span className="min-w-0 truncate font-semibold text-slate-800">
                {ticket.atendente_nome ?? '—'}
              </span>
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>
              Aberto em {ticket.created_at ? new Date(ticket.created_at).toLocaleString('pt-BR') : '—'}
            </span>
            {ticket.fechado_em && (
              <span className="font-medium text-emerald-700">
                Fechado em {new Date(ticket.fechado_em).toLocaleString('pt-BR')}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => abrirModalGerir('geral')}>
            Gerir ticket
          </Button>
          <Button variant="secondary" onClick={() => navigate('/tickets')}>
            Voltar
          </Button>
        </div>
      </div>

      <Card title="Conversa">
        <p className="mb-4 text-sm text-slate-500">
          Mensagens da equipe para o andamento; comentários internos só para atendentes.
        </p>
        <div className="space-y-4">
          {mensagens.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma mensagem ainda.</p>
          ) : (
            <ul className="space-y-3">
              {mensagens.map((msg) => {
                const isAbertura = msg.tipo === 'abertura'
                const isInterno = msg.tipo === 'interno'
                const autor =
                  msg.atendente_nome ??
                  (isAbertura ? 'Registro legado / sistema' : '—')
                return (
                  <li
                    key={msg.id}
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      isInterno
                        ? 'border-amber-200/90 bg-amber-50/60'
                        : isAbertura
                          ? 'border border-slate-200 border-l-4 border-l-slate-500 bg-slate-50/90'
                          : 'border border-slate-200/90 bg-white shadow-sm'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2 text-xs">
                      <span className="font-semibold text-slate-800">{tituloTipoMensagem(msg.tipo)}</span>
                      {isInterno && (
                        <span className="rounded-md bg-amber-100/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                          Só equipe interna
                        </span>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-slate-800">{msg.corpo}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {autor}
                      <span className="text-slate-400"> · </span>
                      {new Date(msg.created_at).toLocaleString('pt-BR')}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="border-t border-slate-200 pt-4">
            <p className="mb-2 text-sm font-medium text-slate-700">Nova mensagem</p>
            <div className="mb-3 inline-flex rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200/80">
              <button
                type="button"
                onClick={() => setTipoNovaMensagem('publico')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  tipoNovaMensagem === 'publico'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mensagem da equipe
              </button>
              <button
                type="button"
                onClick={() => setTipoNovaMensagem('interno')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  tipoNovaMensagem === 'interno'
                    ? 'bg-white text-amber-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Comentário interno
              </button>
            </div>
            <textarea
              value={novaMensagemTexto}
              onChange={(e) => setNovaMensagemTexto(e.target.value)}
              rows={4}
              placeholder={
                tipoNovaMensagem === 'interno'
                  ? 'Anotação visível apenas para atendentes…'
                  : 'Descreva o que foi feito, testado ou o que falta…'
              }
              className="w-full rounded-xl border-0 bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-slate-200/90 focus:outline-none focus:ring-2 focus:ring-slate-400/35"
            />
            <div className="mt-2">
              <Button type="button" onClick={handleEnviarMensagem} loading={enviandoMensagem}>
                Enviar
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {historico.length > 0 && (
        <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setHistoricoAberto((o) => !o)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50/80 sm:px-5"
            aria-expanded={historicoAberto}
          >
            <span>
              Histórico técnico
              <span className="ml-2 font-normal text-slate-400">({historico.length})</span>
            </span>
            <span className="text-slate-400" aria-hidden>
              {historicoAberto ? '▴' : '▾'}
            </span>
          </button>
          {historicoAberto && (
            <ul className="space-y-2 border-t border-slate-100 px-4 py-3 text-sm sm:px-5">
              {historico.map((h) => (
                <li key={h.id} className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                  <div className="font-medium text-slate-800">{ROTULO_CAMPO[h.campo] ?? h.campo}</div>
                  <div className="mt-1 text-slate-600">
                    <span className="text-slate-500">
                      {resolverValorHistorico(h.campo, h.valor_antigo, mapsHistorico)}
                    </span>
                    <span className="mx-2 text-slate-400">→</span>
                    <span>{resolverValorHistorico(h.campo, h.valor_novo, mapsHistorico)}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {new Date(h.created_at).toLocaleString('pt-BR')}
                    {h.atendente_nome ? ` · ${h.atendente_nome}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {modalGerirAberto && (
        <div
          className="fixed inset-0 z-[500] flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
          role="presentation"
          onClick={() => setModalGerirAberto(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-gerir-titulo"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="ticket-gerir-titulo" className="text-lg font-semibold text-slate-900">
              {modalGerirFoco === 'setor'
                ? 'Transferir de setor'
                : modalGerirFoco === 'status'
                  ? 'Alterar status'
                  : modalGerirFoco === 'atendente'
                    ? 'Transferir responsável'
                    : 'Gerir ticket'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {modalGerirFoco === 'geral' && 'Transfira de setor, altere o status ou atribua a outro atendente.'}
              {modalGerirFoco === 'setor' && 'Escolha o setor que passará a tratar este ticket.'}
              {modalGerirFoco === 'status' && 'Atualize o status conforme o andamento do atendimento.'}
              {modalGerirFoco === 'atendente' && 'Defina quem é o responsável pelo ticket (ou deixe sem responsável).'}
            </p>
            <div className="mt-5 space-y-4">
              {(modalGerirFoco === 'geral' || modalGerirFoco === 'setor') && (
                <>
                  <Select
                    label="Setor"
                    value={editSetor}
                    onChange={(v) => setEditSetor(v === '' ? '' : Number(v))}
                    options={setoresParaSelect.map((s) => ({
                      value: s.id,
                      label: `${s.nome}${!s.ativo ? ' (inativo)' : ''}`,
                    }))}
                    placeholder="Setor"
                  />
                  {!isAdmin && setoresParaSelect.length === 0 && (
                    <p className="text-xs text-amber-700">Nenhum setor vinculado ao seu usuário.</p>
                  )}
                </>
              )}
              {(modalGerirFoco === 'geral' || modalGerirFoco === 'status') && (
                <Select
                  label="Status"
                  value={editStatus}
                  onChange={(v) => setEditStatus(v === '' ? '' : Number(v))}
                  options={statusParaSelect.map((s) => ({
                    value: s.id,
                    label: `${s.nome}${!s.ativo ? ' (inativo)' : ''}`,
                  }))}
                  placeholder="Status"
                />
              )}
              {(modalGerirFoco === 'geral' || modalGerirFoco === 'atendente') && (
                <Select
                  label="Responsável"
                  value={editAtendente}
                  onChange={(v) => setEditAtendente(v === '' ? '' : Number(v))}
                  options={atendentesList.map((a) => ({
                    value: a.id,
                    label: `${a.nome}${!a.ativo ? ' (inativo)' : ''}`,
                  }))}
                  includeEmpty
                  emptyLabel="— Nenhum —"
                  placeholder="— Nenhum —"
                />
              )}
            </div>
            {(modalGerirFoco === 'geral' || modalGerirFoco === 'status') && (
              <p className="mt-4 text-xs text-slate-500">
                Status com slug <code className="rounded bg-slate-100 px-1">fechado</code> registra a data de fechamento.
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalGerirAberto(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSalvar} loading={saving}>
                {modalApenasUmCampo ? 'Salvar' : 'Aplicar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

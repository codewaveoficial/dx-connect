import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { tickets, statusTicket, empresas, setores, type Tickets, type StatusTicket, type Empresas, type Setores } from '../api/client'
import { coletarTodasPaginas } from '../api/collectPages'
import { Button } from '../components/ui/Button'
import { IconEye } from '../components/ui/IconEye'
import { Select } from '../components/ui/Select'
import { PAGE_SIZE_PADRAO } from '../components/ui/BarraBuscaPaginacao'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../contexts/AuthContext'

const searchIcon = (
  <svg className="size-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

export function Tickets() {
  const navigate = useNavigate()
  const toast = useToast()
  const { isAdmin, user } = useAuth()

  const [list, setList] = useState<Tickets.Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [busca, setBusca] = useState('')
  const [debouncedBusca, setDebouncedBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState<number | ''>('')
  const [filtroEmpresa, setFiltroEmpresa] = useState<number | ''>('')
  const [filtroSetor, setFiltroSetor] = useState<number | ''>('')
  const [statusList, setStatusList] = useState<StatusTicket.Status[]>([])
  const [empresasOpt, setEmpresasOpt] = useState<Empresas.Empresa[]>([])
  const [setoresOpt, setSetoresOpt] = useState<Setores.Setor[]>([])

  const setoresFiltro = useMemo(() => {
    const ativos = setoresOpt.filter((s) => s.ativo)
    const sorted = [...ativos].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    if (isAdmin) return sorted
    const ids = new Set(user?.setor_ids ?? [])
    return sorted.filter((s) => ids.has(s.id))
  }, [isAdmin, user?.setor_ids, setoresOpt])

  const empresasOrdenadas = useMemo(
    () => [...empresasOpt].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [empresasOpt],
  )

  const opcoesEmpresaFiltro = useMemo(
    () => empresasOrdenadas.map((e) => ({ value: e.id, label: e.nome })),
    [empresasOrdenadas],
  )
  const opcoesSetorFiltro = useMemo(
    () => setoresFiltro.map((s) => ({ value: s.id, label: s.nome })),
    [setoresFiltro],
  )
  const opcoesStatusFiltro = useMemo(
    () => statusList.map((s) => ({ value: s.id, label: s.nome })),
    [statusList],
  )

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE_PADRAO))
  const inicio = total === 0 ? 0 : (page - 1) * PAGE_SIZE_PADRAO + 1
  const fim = Math.min(page * PAGE_SIZE_PADRAO, total)

  const temFiltrosAtivos =
    busca.trim() !== '' || filtroEmpresa !== '' || filtroSetor !== '' || filtroStatus !== ''

  useEffect(() => {
    coletarTodasPaginas<StatusTicket.Status>((o, l) =>
      statusTicket.list({ incluir_inativos: false, offset: o, limit: l }),
    ).then(setStatusList)
    coletarTodasPaginas<Empresas.Empresa>((o, l) => empresas.list({ offset: o, limit: l })).then(setEmpresasOpt)
    coletarTodasPaginas<Setores.Setor>((o, l) =>
      setores.list({ incluir_inativos: true, offset: o, limit: l }),
    ).then(setSetoresOpt)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedBusca(busca.trim()), 400)
    return () => clearTimeout(t)
  }, [busca])

  useEffect(() => {
    setPage(1)
  }, [debouncedBusca, filtroStatus, filtroEmpresa, filtroSetor])

  useEffect(() => {
    if (filtroSetor !== '' && !setoresFiltro.some((s) => s.id === filtroSetor)) {
      setFiltroSetor('')
    }
  }, [setoresFiltro, filtroSetor])

  useEffect(() => {
    setLoading(true)
    tickets
      .list({
        busca: debouncedBusca || undefined,
        status_id: filtroStatus !== '' ? Number(filtroStatus) : undefined,
        empresa_id: filtroEmpresa !== '' ? Number(filtroEmpresa) : undefined,
        setor_id: filtroSetor !== '' ? Number(filtroSetor) : undefined,
        offset: (page - 1) * PAGE_SIZE_PADRAO,
        limit: PAGE_SIZE_PADRAO,
      })
      .then(({ items, total: t }) => {
        setList(items)
        setTotal(t)
      })
      .catch(() => {
        toast.showWarning('Não foi possível carregar os tickets.')
        setList([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [page, debouncedBusca, filtroStatus, filtroEmpresa, filtroSetor])

  function limparFiltros() {
    setBusca('')
    setDebouncedBusca('')
    setFiltroEmpresa('')
    setFiltroSetor('')
    setFiltroStatus('')
    setPage(1)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Tickets</h1>
          <p className="mt-1 text-sm text-slate-500">Acompanhe e filtre as demandas do suporte.</p>
        </div>
        <Link to="/tickets/novo">
          <Button>Novo ticket</Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50/90 to-slate-50/40 px-4 py-5 sm:px-6">
          <div className="relative max-w-2xl">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">{searchIcon}</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Protocolo, assunto ou empresa…"
              disabled={loading}
              className="w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm ring-1 ring-slate-200/80 transition-shadow focus:outline-none focus:ring-2 focus:ring-slate-400/25"
              aria-label="Buscar tickets"
            />
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end lg:gap-4">
              <Select
                label="Empresa"
                labelStyle="overline"
                className="min-w-0 flex-1 sm:max-w-[220px]"
                value={filtroEmpresa}
                onChange={(v) => setFiltroEmpresa(v === '' ? '' : Number(v))}
                options={opcoesEmpresaFiltro}
                includeEmpty
                emptyLabel="Todas"
                placeholder="Todas"
              />
              <Select
                label="Setor"
                labelStyle="overline"
                className="min-w-0 flex-1 sm:max-w-[220px]"
                value={filtroSetor}
                onChange={(v) => setFiltroSetor(v === '' ? '' : Number(v))}
                options={opcoesSetorFiltro}
                includeEmpty
                emptyLabel="Todos"
                placeholder="Todos"
              />
              <Select
                label="Status"
                labelStyle="overline"
                className="min-w-0 flex-1 sm:max-w-[220px]"
                value={filtroStatus}
                onChange={(v) => setFiltroStatus(v === '' ? '' : Number(v))}
                options={opcoesStatusFiltro}
                includeEmpty
                emptyLabel="Todos"
                placeholder="Todos"
              />
            </div>
            {temFiltrosAtivos && (
              <button
                type="button"
                onClick={limparFiltros}
                className="shrink-0 self-start text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 transition-colors hover:text-slate-900 sm:self-auto lg:mb-0.5"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-6">
          <p className="text-xs text-slate-500">
            {loading ? (
              'Carregando…'
            ) : total === 0 ? (
              'Nenhum resultado'
            ) : (
              <>
                <span className="font-medium text-slate-700">
                  {inicio}–{fim}
                </span>
                <span className="text-slate-400"> de </span>
                {total}
              </>
            )}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="min-w-[4rem] text-center text-xs tabular-nums text-slate-500">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={loading || page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>

        {loading ? (
          <div className="px-4 py-16 text-center text-sm text-slate-500 sm:px-6">Carregando lista…</div>
        ) : list.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-slate-500 sm:px-6">
            Nenhum ticket encontrado.
            {temFiltrosAtivos && (
              <>
                {' '}
                <button type="button" onClick={limparFiltros} className="font-medium text-slate-800 underline">
                  Limpar filtros
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                    Protocolo
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                    Empresa
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                    Setor
                  </th>
                  <th className="min-w-[8rem] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                    Assunto
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                    Status
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                    Responsável
                  </th>
                  <th className="w-px whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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
                    className="cursor-pointer transition-colors hover:bg-slate-50/90 focus:outline-none focus-visible:bg-slate-100/80"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-sm text-slate-900 sm:px-6">
                      {t.protocolo}
                    </td>
                    <td className="max-w-[10rem] truncate px-4 py-3.5 text-slate-700 sm:max-w-[12rem] sm:px-6" title={t.empresa_nome}>
                      {t.empresa_nome ?? t.empresa_id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600 sm:px-6">{t.setor_nome ?? t.setor_id}</td>
                    <td className="max-w-xs truncate px-4 py-3.5 font-medium text-slate-900 sm:px-6" title={t.assunto}>
                      {t.assunto}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {t.status_nome ?? t.status_id}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600 sm:px-6">{t.atendente_nome ?? '—'}</td>
                    <td className="px-4 py-3.5 text-right sm:px-6" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        onClick={() => navigate(`/tickets/${t.id}`)}
                        aria-label={`Abrir ticket ${t.protocolo}`}
                      >
                        <IconEye className="size-[18px] shrink-0 opacity-70" ariaHidden={false} />
                        <span className="hidden sm:inline">Abrir</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

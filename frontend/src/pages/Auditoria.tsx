import { useState, useEffect } from 'react'
import { audit, type Audit } from '../api/client'
import { Card } from '../components/ui/Card'
import { BarraBuscaPaginacao, PAGE_SIZE_PADRAO } from '../components/ui/BarraBuscaPaginacao'

const entityTypeLabel: Record<string, string> = {
  rede: 'Rede',
  empresa: 'Empresa',
  setor: 'Setor',
  atendente: 'Atendente',
  funcionario_rede: 'Funcionário da rede',
  status_ticket: 'Status de ticket',
}

const actionLabel: Record<string, string> = {
  create: 'Cadastro',
  update: 'Alteração',
}

export function Auditoria() {
  const [list, setList] = useState<Audit.AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [busca, setBusca] = useState('')
  const [debouncedBusca, setDebouncedBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [filtroTipo, setFiltroTipo] = useState<string>('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedBusca(busca.trim()), 400)
    return () => clearTimeout(t)
  }, [busca])

  useEffect(() => {
    setPage(1)
  }, [debouncedBusca, filtroTipo])

  function load() {
    setLoading(true)
    audit
      .list({
        entity_type: filtroTipo || undefined,
        busca: debouncedBusca || undefined,
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
  }

  useEffect(() => {
    load()
  }, [page, debouncedBusca, filtroTipo])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Auditoria</h1>
      <p className="text-slate-600 text-sm">Registro de cadastros e alterações: quem fez e quando.</p>
      <Card>
        <BarraBuscaPaginacao
          busca={busca}
          onBuscaChange={setBusca}
          placeholder="Buscar por tipo ou nome do atendente"
          page={page}
          total={total}
          onPageChange={setPage}
          disabled={loading}
          extra={
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span>Tipo:</span>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                {Object.entries(entityTypeLabel).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          }
        />
        {loading ? (
          <p className="text-slate-500">Carregando...</p>
        ) : list.length === 0 ? (
          <p className="text-slate-500">Nenhum registro de auditoria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="pb-2 pr-4 font-medium">Data/Hora</th>
                  <th className="pb-2 pr-4 font-medium">Tipo</th>
                  <th className="pb-2 pr-4 font-medium">ID</th>
                  <th className="pb-2 pr-4 font-medium">Ação</th>
                  <th className="pb-2 font-medium">Quem</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 text-slate-600">
                      {r.created_at ? new Date(r.created_at).toLocaleString('pt-BR') : '—'}
                    </td>
                    <td className="py-2 pr-4">{entityTypeLabel[r.entity_type] ?? r.entity_type}</td>
                    <td className="py-2 pr-4 font-mono text-slate-600">{r.entity_id}</td>
                    <td className="py-2 pr-4">{actionLabel[r.action] ?? r.action}</td>
                    <td className="py-2">{r.atendente_nome ?? '—'}</td>
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

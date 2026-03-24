import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dashboard } from '../api/client'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { IconEye } from '../components/ui/IconEye'

export function Dashboard() {
  const [data, setData] = useState<Awaited<ReturnType<typeof dashboard.get>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    dashboard
      .get()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="text-slate-500">Carregando dashboard...</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        {error ?? 'Dados não disponíveis.'}
      </div>
    )
  }

  const { resumo, ultimos_tickets } = data

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <Link to="/tickets/novo">
          <Button>Novo ticket</Button>
        </Link>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-slate-400">
          <p className="text-sm font-medium text-slate-500">Total de tickets</p>
          <p className="mt-1 text-3xl font-bold text-slate-800">{resumo.total_tickets}</p>
        </Card>
        <Card className="border-l-4 border-l-amber-400">
          <p className="text-sm font-medium text-slate-500">Abertos hoje</p>
          <p className="mt-1 text-3xl font-bold text-slate-800">{resumo.abertos_hoje}</p>
        </Card>
        <Card className="border-l-4 border-l-emerald-400 sm:col-span-2 lg:col-span-1">
          <p className="text-sm font-medium text-slate-500">Por status</p>
          <ul className="mt-2 space-y-1">
            {resumo.por_status.length === 0 ? (
              <li className="text-slate-500">Nenhum ticket</li>
            ) : (
              resumo.por_status.map((s) => (
                <li key={s.status_id} className="flex justify-between text-sm">
                  <span className="text-slate-600">{s.status_nome}</span>
                  <span className="font-medium text-slate-800">{s.total}</span>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      {/* Últimos tickets */}
      <Card title="Últimos tickets">
        {ultimos_tickets.length === 0 ? (
          <p className="text-slate-500">Nenhum ticket ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="pb-2 pr-4 font-medium">Protocolo</th>
                  <th className="pb-2 pr-4 font-medium">Empresa</th>
                  <th className="pb-2 pr-4 font-medium">Assunto</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {ultimos_tickets.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-mono text-slate-800">{t.protocolo}</td>
                    <td className="py-3 pr-4">{t.empresa_nome ?? t.empresa_id}</td>
                    <td className="py-3 pr-4">{t.assunto}</td>
                    <td className="py-3 pr-4">{t.status_nome ?? t.status_id}</td>
                    <td className="py-3">
                      <Link
                        to={`/tickets/${t.id}`}
                        aria-label="Ver ticket"
                        className="inline-flex shrink-0"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-0 text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900"
                        >
                          <IconEye className="size-5 shrink-0" ariaHidden={false} />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4">
          <Link to="/tickets">
            <Button variant="secondary">Ver todos os tickets</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

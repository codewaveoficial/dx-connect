import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { tickets, empresas, setores } from '../api/client'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function TicketNovo() {
  const [empresasList, setEmpresasList] = useState<{ id: number; nome: string }[]>([])
  const [setoresList, setSetoresList] = useState<{ id: number; nome: string }[]>([])
  const [empresaId, setEmpresaId] = useState<number | ''>('')
  const [setorId, setSetorId] = useState<number | ''>('')
  const [assunto, setAssunto] = useState('')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    empresas.list().then((e) => setEmpresasList(e))
    setores.list().then((s) => setSetoresList(s))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!empresaId || !setorId || !assunto.trim()) {
      setError('Preencha empresa, setor e assunto.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const created = await tickets.create({
        empresa_id: Number(empresaId),
        setor_id: Number(setorId),
        assunto: assunto.trim(),
        descricao: descricao.trim() || undefined,
      })
      navigate(`/tickets/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Novo ticket</h1>
      <Card title="Abrir ticket">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Empresa</label>
            <select
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Selecione</option>
              {empresasList.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Setor</label>
            <select
              value={setorId}
              onChange={(e) => setSetorId(e.target.value === '' ? '' : Number(e.target.value))}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="">Selecione</option>
              {setoresList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Assunto"
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            required
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" loading={loading}>
              Criar ticket
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/')}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

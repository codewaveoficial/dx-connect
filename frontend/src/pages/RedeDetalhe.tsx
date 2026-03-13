import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { redes, empresas, funcionariosRede } from '../api/client'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { IconPencil } from '../components/ui/IconPencil'
import { IconTrash } from '../components/ui/IconTrash'

type Aba = 'empresas' | 'funcionarios'
const tipoLabel: Record<string, string> = { socio: 'Sócio', supervisor: 'Supervisor', colaborador: 'Colaborador' }

export function RedeDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const redeId = id ? parseInt(id, 10) : NaN

  const [rede, setRede] = useState<Awaited<ReturnType<typeof redes.get>> | null>(null)
  const [empresasList, setEmpresasList] = useState<Awaited<ReturnType<typeof empresas.list>>>([])
  const [funcionariosList, setFuncionariosList] = useState<Awaited<ReturnType<typeof redes.getFuncionarios>>>([])
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<Aba>('empresas')

  const [modalEmpresa, setModalEmpresa] = useState(false)
  const [editingEmpresaId, setEditingEmpresaId] = useState<number | null>(null)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [savingEmpresa, setSavingEmpresa] = useState(false)
  const [errorEmpresa, setErrorEmpresa] = useState('')

  function load() {
    if (!redeId || isNaN(redeId)) return
    setLoading(true)
    Promise.all([
      redes.get(redeId),
      empresas.list(redeId),
      redes.getFuncionarios(redeId),
    ])
      .then(([r, e, f]) => {
        setRede(r)
        setEmpresasList(e)
        setFuncionariosList(f)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [redeId])

  function openNovaEmpresa() {
    setEditingEmpresaId(null)
    setNomeEmpresa('')
    setErrorEmpresa('')
    setModalEmpresa(true)
  }

  function openEditEmpresa(e: { id: number; nome: string }) {
    setEditingEmpresaId(e.id)
    setNomeEmpresa(e.nome)
    setErrorEmpresa('')
    setModalEmpresa(true)
  }

  async function handleSubmitEmpresa(ev: React.FormEvent) {
    ev.preventDefault()
    setErrorEmpresa('')
    setSavingEmpresa(true)
    try {
      if (editingEmpresaId) {
        await empresas.update(editingEmpresaId, { nome: nomeEmpresa.trim(), rede_id: redeId })
      } else {
        await empresas.create({ rede_id: redeId, nome: nomeEmpresa.trim(), ativo: true })
      }
      setModalEmpresa(false)
      load()
    } catch (err) {
      setErrorEmpresa(err instanceof Error ? err.message : 'Erro')
    } finally {
      setSavingEmpresa(false)
    }
  }

  async function handleDeleteEmpresa(empresaId: number) {
    if (!confirm('Excluir esta empresa?')) return
    try {
      await empresas.delete(empresaId)
      load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  function openEditFuncionario(funcionarioId: number) {
    navigate('/funcionarios-rede', { state: { editId: funcionarioId } })
  }

  async function handleDeleteFuncionario(funcionarioId: number) {
    if (!confirm('Excluir este funcionário?')) return
    try {
      await funcionariosRede.delete(funcionarioId)
      load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  if (!id || isNaN(redeId)) {
    return (
      <div className="space-y-6">
        <p className="text-slate-500">Rede inválida.</p>
        <Link to="/redes" className="text-blue-600 hover:underline">Voltar às redes</Link>
      </div>
    )
  }

  if (loading && !rede) {
    return <p className="text-slate-500">Carregando...</p>
  }

  if (!rede) {
    return (
      <div className="space-y-6">
        <p className="text-slate-500">Rede não encontrada.</p>
        <Link to="/redes" className="text-blue-600 hover:underline">Voltar às redes</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/redes" className="text-slate-500 hover:text-slate-700">← Redes</Link>
        <h1 className="text-2xl font-bold text-slate-800">{rede.nome}</h1>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex gap-4">
          <button
            type="button"
            onClick={() => setAba('empresas')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${aba === 'empresas' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Empresas
          </button>
          <button
            type="button"
            onClick={() => setAba('funcionarios')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${aba === 'funcionarios' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Funcionários
          </button>
        </nav>
      </div>

      {aba === 'empresas' && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Empresas da rede</h2>
            <Button onClick={openNovaEmpresa}>Nova empresa</Button>
          </div>
          {loading && !empresasList.length ? (
            <p className="text-slate-500">Carregando...</p>
          ) : empresasList.length === 0 ? (
            <p className="text-slate-500">Nenhuma empresa nesta rede.</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {empresasList.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-3">
                  <span className="font-medium">{e.nome}</span>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" onClick={() => openEditEmpresa(e)} aria-label="Editar empresa">
                      <IconPencil ariaHidden={false} />
                    </Button>
                    <Button variant="ghost" onClick={() => handleDeleteEmpresa(e.id)} aria-label="Excluir empresa">
                      <IconTrash ariaHidden={false} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {aba === 'funcionarios' && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Funcionários da rede</h2>
          {loading && !funcionariosList.length ? (
            <p className="text-slate-500">Carregando...</p>
          ) : funcionariosList.length === 0 ? (
            <p className="text-slate-500">Nenhum funcionário vinculado a esta rede.</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {funcionariosList.map((f) => (
                <li key={f.id} className="flex items-center justify-between py-3">
                  <div>
                    <span className="font-medium">{f.nome}</span>
                    <span className="ml-2 text-slate-500">{f.email}</span>
                    <span className="ml-2 text-xs text-slate-400">({tipoLabel[f.tipo] ?? f.tipo})</span>
                    <span className="ml-2 text-slate-500">— {f.vinculado_a}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="ghost" onClick={() => openEditFuncionario(f.id)} aria-label="Editar funcionário">
                      <IconPencil ariaHidden={false} />
                    </Button>
                    <Button variant="ghost" onClick={() => handleDeleteFuncionario(f.id)} aria-label="Excluir funcionário">
                      <IconTrash ariaHidden={false} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {modalEmpresa && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <Card title={editingEmpresaId ? 'Editar empresa' : 'Nova empresa'} className="w-full max-w-md">
            <form onSubmit={handleSubmitEmpresa} className="space-y-4">
              {errorEmpresa && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{errorEmpresa}</div>}
              <Input label="Nome" value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} required />
              <div className="flex gap-2">
                <Button type="submit" loading={savingEmpresa}>Salvar</Button>
                <Button type="button" variant="secondary" onClick={() => setModalEmpresa(false)}>Cancelar</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}

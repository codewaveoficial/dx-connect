import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { redes, empresas, funcionariosRede, tiposNegocio } from '../api/client'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { IconPencil } from '../components/ui/IconPencil'
import { IconTrash } from '../components/ui/IconTrash'
import { useToast } from '../components/ui/Toast'
import { FiltroInativos } from '../components/ui/FiltroInativos'
import { maskCnpjCpf, digitsOnly, isCnpj } from '../utils/maskCnpjCpf'

type Aba = 'empresas' | 'funcionarios'
const tipoLabel: Record<string, string> = { socio: 'Sócio', supervisor: 'Supervisor', colaborador: 'Colaborador' }

export function RedeDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const redeId = id ? parseInt(id, 10) : NaN

  const [rede, setRede] = useState<Awaited<ReturnType<typeof redes.get>> | null>(null)
  const [empresasList, setEmpresasList] = useState<Awaited<ReturnType<typeof empresas.list>>>([])
  const [funcionariosList, setFuncionariosList] = useState<Awaited<ReturnType<typeof redes.getFuncionarios>>>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const toastShownForLoadRef = useRef(false)
  const toastShownForInvalidIdRef = useRef(false)
  const [aba, setAba] = useState<Aba>('empresas')
  const [incluirInativos, setIncluirInativos] = useState(false)

  const [tiposNegocioList, setTiposNegocioList] = useState<Awaited<ReturnType<typeof tiposNegocio.list>>>([])
  const [modalEmpresa, setModalEmpresa] = useState(false)
  const [editingEmpresaId, setEditingEmpresaId] = useState<number | null>(null)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [cnpjCpfEmpresa, setCnpjCpfEmpresa] = useState('')
  const [tipoNegocioIdEmpresa, setTipoNegocioIdEmpresa] = useState<number | ''>('')
  const [razaoSocialEmpresa, setRazaoSocialEmpresa] = useState('')
  const [nomeFantasiaEmpresa, setNomeFantasiaEmpresa] = useState('')
  const [inscricaoEstadualEmpresa, setInscricaoEstadualEmpresa] = useState('')
  const [enderecoEmpresa, setEnderecoEmpresa] = useState('')
  const [numeroEmpresa, setNumeroEmpresa] = useState('')
  const [complementoEmpresa, setComplementoEmpresa] = useState('')
  const [bairroEmpresa, setBairroEmpresa] = useState('')
  const [cidadeEmpresa, setCidadeEmpresa] = useState('')
  const [estadoEmpresa, setEstadoEmpresa] = useState('')
  const [cepEmpresa, setCepEmpresa] = useState('')
  const [emailEmpresa, setEmailEmpresa] = useState('')
  const [telefoneEmpresa, setTelefoneEmpresa] = useState('')
  const [ativoEmpresa, setAtivoEmpresa] = useState(true)
  const [savingEmpresa, setSavingEmpresa] = useState(false)
  const [loadingCnpjEmpresa, setLoadingCnpjEmpresa] = useState(false)
  const [errorEmpresa, setErrorEmpresa] = useState('')

  function load() {
    if (!redeId || isNaN(redeId)) return
    setLoading(true)
    setLoadError(false)
    toastShownForLoadRef.current = false
    Promise.all([
      redes.get(redeId),
      empresas.list({ rede_id: redeId, incluir_inativos: incluirInativos }),
      redes.getFuncionarios(redeId, { incluir_inativos: incluirInativos }),
    ])
      .then(([r, e, f]) => {
        setRede(r)
        setEmpresasList(e)
        setFuncionariosList(f)
      })
      .catch((err) => {
        if (!toastShownForLoadRef.current) {
          toastShownForLoadRef.current = true
          toast.showWarning(err instanceof Error ? err.message : 'Rede não encontrada.')
        }
        setLoadError(true)
        navigate('/redes')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [redeId, incluirInativos])

  useEffect(() => {
    if (id && !isNaN(redeId)) return
    if (toastShownForInvalidIdRef.current) return
    toastShownForInvalidIdRef.current = true
    toast.showWarning('Rede inválida.')
    navigate('/redes')
  }, [id, redeId, navigate, toast])

  useEffect(() => {
    tiposNegocio.list().then(setTiposNegocioList)
  }, [])

  function openNovaEmpresa() {
    setEditingEmpresaId(null)
    setNomeEmpresa('')
    setCnpjCpfEmpresa('')
    setTipoNegocioIdEmpresa('')
    setRazaoSocialEmpresa('')
    setNomeFantasiaEmpresa('')
    setInscricaoEstadualEmpresa('')
    setEnderecoEmpresa('')
    setNumeroEmpresa('')
    setComplementoEmpresa('')
    setBairroEmpresa('')
    setCidadeEmpresa('')
    setEstadoEmpresa('')
    setCepEmpresa('')
    setEmailEmpresa('')
    setTelefoneEmpresa('')
    setAtivoEmpresa(true)
    setErrorEmpresa('')
    setModalEmpresa(true)
  }

  function openEditEmpresa(e: Awaited<ReturnType<typeof empresas.list>>[number]) {
    setEditingEmpresaId(e.id)
    setNomeEmpresa(e.nome)
    setCnpjCpfEmpresa(e.cnpj_cpf ? maskCnpjCpf(e.cnpj_cpf) : '')
    setTipoNegocioIdEmpresa(e.tipo_negocio_id ?? '')
    setRazaoSocialEmpresa(e.razao_social ?? '')
    setNomeFantasiaEmpresa(e.nome_fantasia ?? '')
    setInscricaoEstadualEmpresa(e.inscricao_estadual ?? '')
    setEnderecoEmpresa(e.endereco ?? '')
    setNumeroEmpresa(e.numero ?? '')
    setComplementoEmpresa(e.complemento ?? '')
    setBairroEmpresa(e.bairro ?? '')
    setCidadeEmpresa(e.cidade ?? '')
    setEstadoEmpresa(e.estado ?? '')
    setCepEmpresa(e.cep ?? '')
    setEmailEmpresa(e.email ?? '')
    setTelefoneEmpresa(e.telefone ?? '')
    setAtivoEmpresa(e.ativo)
    setErrorEmpresa('')
    setModalEmpresa(true)
  }

  async function handleConsultarCnpjEmpresa() {
    const d = digitsOnly(cnpjCpfEmpresa)
    if (!isCnpj(cnpjCpfEmpresa)) {
      toast.showWarning('Informe um CNPJ com 14 dígitos para consultar.')
      return
    }
    setLoadingCnpjEmpresa(true)
    setErrorEmpresa('')
    try {
      const data = await empresas.consultarCnpj(d)
      setRazaoSocialEmpresa(data.razao_social ?? '')
      setNomeFantasiaEmpresa(data.nome_fantasia ?? '')
      setNomeEmpresa(data.nome_fantasia || data.razao_social || nomeEmpresa)
      setEnderecoEmpresa(data.endereco ?? '')
      setNumeroEmpresa(data.numero ?? '')
      setComplementoEmpresa(data.complemento ?? '')
      setBairroEmpresa(data.bairro ?? '')
      setCidadeEmpresa(data.cidade ?? '')
      setEstadoEmpresa(data.estado ?? '')
      setCepEmpresa(data.cep ?? '')
      setEmailEmpresa(data.email ?? '')
      setTelefoneEmpresa(data.telefone ?? '')
      toast.showSuccess('Dados preenchidos.')
    } catch (err) {
      setErrorEmpresa(err instanceof Error ? err.message : 'Erro ao consultar CNPJ')
    } finally {
      setLoadingCnpjEmpresa(false)
    }
  }

  async function handleSubmitEmpresa(ev: React.FormEvent) {
    ev.preventDefault()
    setErrorEmpresa('')
    setSavingEmpresa(true)
    try {
      const payload = {
        rede_id: redeId,
        tipo_negocio_id: tipoNegocioIdEmpresa === '' ? null : Number(tipoNegocioIdEmpresa),
        nome: nomeEmpresa.trim(),
        cnpj_cpf: cnpjCpfEmpresa.replace(/\D/g, '') || null,
        razao_social: razaoSocialEmpresa.trim() || null,
        nome_fantasia: nomeFantasiaEmpresa.trim() || null,
        inscricao_estadual: inscricaoEstadualEmpresa.trim() || null,
        endereco: enderecoEmpresa.trim() || null,
        numero: numeroEmpresa.trim() || null,
        complemento: complementoEmpresa.trim() || null,
        bairro: bairroEmpresa.trim() || null,
        cidade: cidadeEmpresa.trim() || null,
        estado: estadoEmpresa.trim() || null,
        cep: cepEmpresa.replace(/\D/g, '') || null,
        email: emailEmpresa.trim() || null,
        telefone: telefoneEmpresa.trim() || null,
        ativo: ativoEmpresa,
      }
      if (editingEmpresaId) {
        await empresas.update(editingEmpresaId, payload)
      } else {
        await empresas.create(payload)
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
      toast.showWarning(err instanceof Error ? err.message : 'Erro ao excluir')
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
      toast.showWarning(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  if (!id || isNaN(redeId)) {
    return null
  }

  if (loading && !rede && !loadError) {
    return <p className="text-slate-500">Carregando...</p>
  }

  if (loadError || (!rede && !loading)) {
    return null
  }

  const linkVoltarRedes = (
    <Link
      to="/redes"
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-slate-500 transition-colors duration-150 hover:bg-slate-50/80 hover:text-slate-700 focus:outline-none focus:bg-slate-50/80 focus:text-slate-700"
    >
      <span aria-hidden>←</span>
      Voltar às redes
    </Link>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {modalEmpresa ? (
          <>
            <button
              type="button"
              onClick={() => setModalEmpresa(false)}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-slate-600 transition-colors duration-150 hover:bg-slate-50/80 hover:text-slate-900 focus:outline-none focus:bg-slate-50/80 focus:text-slate-900"
            >
              <span aria-hidden>←</span>
              Voltar
            </button>
            <span className="text-slate-300">|</span>
            {linkVoltarRedes}
          </>
        ) : (
          linkVoltarRedes
        )}
        <h1 className="text-2xl font-bold text-slate-800">{rede.nome}</h1>
      </div>

      {!modalEmpresa && (
        <div className="border-b border-slate-200">
          <nav className="flex gap-4">
            <button
              type="button"
              onClick={() => setAba('empresas')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${aba === 'empresas' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Empresas
            </button>
            <button
              type="button"
              onClick={() => setAba('funcionarios')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${aba === 'funcionarios' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Funcionários
            </button>
          </nav>
        </div>
      )}

      {aba === 'empresas' && modalEmpresa && (
        <Card title={editingEmpresaId ? 'Editar empresa' : 'Nova empresa'}>
              <form onSubmit={handleSubmitEmpresa} className="space-y-4">
                {errorEmpresa && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{errorEmpresa}</div>}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Tipo de negócio</label>
                  <select value={tipoNegocioIdEmpresa} onChange={(e) => setTipoNegocioIdEmpresa(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2">
                    <option value="">Selecione</option>
                    {tiposNegocioList.map((t) => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label className="mb-1 block text-sm font-medium text-slate-700">CNPJ / CPF</label>
                    <input type="text" inputMode="numeric" placeholder="00.000.000/0001-00" value={cnpjCpfEmpresa} onChange={(e) => setCnpjCpfEmpresa(maskCnpjCpf(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                  </div>
                  <Button type="button" variant="secondary" onClick={handleConsultarCnpjEmpresa} disabled={loadingCnpjEmpresa} className="shrink-0" aria-label="Consultar CNPJ">
                    {loadingCnpjEmpresa ? '...' : <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                  </Button>
                </div>
                <Input label="Nome *" value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} required />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input label="Razão social" value={razaoSocialEmpresa} onChange={(e) => setRazaoSocialEmpresa(e.target.value)} />
                  <Input label="Nome fantasia" value={nomeFantasiaEmpresa} onChange={(e) => setNomeFantasiaEmpresa(e.target.value)} />
                </div>
                <Input label="Inscrição estadual" value={inscricaoEstadualEmpresa} onChange={(e) => setInscricaoEstadualEmpresa(e.target.value)} />
                <Input label="Endereço" value={enderecoEmpresa} onChange={(e) => setEnderecoEmpresa(e.target.value)} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input label="Número" value={numeroEmpresa} onChange={(e) => setNumeroEmpresa(e.target.value)} />
                  <Input label="Complemento" value={complementoEmpresa} onChange={(e) => setComplementoEmpresa(e.target.value)} />
                  <Input label="Bairro" value={bairroEmpresa} onChange={(e) => setBairroEmpresa(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input label="Cidade" value={cidadeEmpresa} onChange={(e) => setCidadeEmpresa(e.target.value)} />
                  <Input label="UF" value={estadoEmpresa} onChange={(e) => setEstadoEmpresa(e.target.value)} placeholder="SP" maxLength={2} />
                  <Input label="CEP" value={cepEmpresa} onChange={(e) => setCepEmpresa(e.target.value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9))} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input label="E-mail" type="email" value={emailEmpresa} onChange={(e) => setEmailEmpresa(e.target.value)} />
                  <Input label="Telefone" value={telefoneEmpresa} onChange={(e) => setTelefoneEmpresa(e.target.value)} />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={ativoEmpresa} onChange={(e) => setAtivoEmpresa(e.target.checked)} className="rounded border-slate-300" />
                  Ativo
                </label>
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <Button type="submit" loading={savingEmpresa}>Salvar</Button>
                  <Button type="button" variant="secondary" onClick={() => setModalEmpresa(false)}>Cancelar</Button>
                </div>
              </form>
            </Card>
      )}

      {aba === 'empresas' && !modalEmpresa && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-800">Empresas da rede</h2>
            <div className="flex items-center gap-3">
              <FiltroInativos incluirInativos={incluirInativos} onChange={setIncluirInativos} />
              <Button onClick={openNovaEmpresa}>Nova empresa</Button>
            </div>
          </div>
          {loading && !empresasList.length ? (
            <p className="text-slate-500">Carregando...</p>
          ) : empresasList.length === 0 ? (
            <p className="text-slate-500">Nenhuma empresa nesta rede.</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {empresasList.map((e) => (
                <li
                  key={e.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openEditEmpresa(e)}
                  onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openEditEmpresa(e); } }}
                  className="flex cursor-pointer items-center justify-between rounded-lg py-3 px-2 -mx-2 transition-colors duration-150 hover:bg-slate-50/80 focus:outline-none focus:bg-slate-50/80"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`truncate font-medium ${e.ativo ? 'text-slate-800' : 'text-slate-400'}`}>{e.nome}</span>
                    {!e.ativo && <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600">Inativo</span>}
                  </div>
                  <div className="flex shrink-0 gap-1.5" onClick={(ev) => ev.stopPropagation()}>
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-800">Funcionários da rede</h2>
            <FiltroInativos incluirInativos={incluirInativos} onChange={setIncluirInativos} />
          </div>
          {loading && !funcionariosList.length ? (
            <p className="text-slate-500">Carregando...</p>
          ) : funcionariosList.length === 0 ? (
            <p className="text-slate-500">Nenhum funcionário vinculado a esta rede.</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {funcionariosList.map((f) => (
                <li
                  key={f.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openEditFuncionario(f.id)}
                  onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openEditFuncionario(f.id); } }}
                  className="flex cursor-pointer items-center justify-between rounded-lg py-3 px-2 -mx-2 transition-colors duration-150 hover:bg-slate-50/80 focus:outline-none focus:bg-slate-50/80"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-800">{f.nome}</span>
                    <span className="text-slate-500">{f.email}</span>
                    <span className="text-xs text-slate-400">({tipoLabel[f.tipo] ?? f.tipo})</span>
                    <span className="text-slate-500">— {f.vinculado_a}</span>
                  </div>
                  <div className="flex shrink-0 gap-1.5" onClick={(ev) => ev.stopPropagation()}>
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
    </div>
  )
}

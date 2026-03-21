import { useState, useEffect } from 'react'
import { empresas as apiEmpresas, redes, tiposNegocio, type Empresas, type Redes, type TiposNegocio } from '../api/client'
import { coletarTodasPaginas } from '../api/collectPages'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { IconPencil } from '../components/ui/IconPencil'
import { IconTrash } from '../components/ui/IconTrash'
import { useToast } from '../components/ui/Toast'
import { FiltroInativos } from '../components/ui/FiltroInativos'
import { SelectComPesquisa } from '../components/ui/SelectComPesquisa'
import { maskCnpjCpf, digitsOnly, isCnpj } from '../utils/maskCnpjCpf'
import { BarraBuscaPaginacao, PAGE_SIZE_PADRAO } from '../components/ui/BarraBuscaPaginacao'

export function Empresas() {
  const toast = useToast()
  const [list, setList] = useState<Empresas.Empresa[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [busca, setBusca] = useState('')
  const [debouncedBusca, setDebouncedBusca] = useState('')
  const [redesList, setRedesList] = useState<Redes.Rede[]>([])
  const [tiposList, setTiposList] = useState<TiposNegocio.Tipo[]>([])
  const [loading, setLoading] = useState(true)
  const [incluirInativos, setIncluirInativos] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [redeId, setRedeId] = useState<number | ''>('')
  const [tipoNegocioId, setTipoNegocioId] = useState<number | ''>('')
  const [nome, setNome] = useState('')
  const [cnpjCpf, setCnpjCpf] = useState('')
  const [razaoSocial, setRazaoSocial] = useState('')
  const [nomeFantasia, setNomeFantasia] = useState('')
  const [inscricaoEstadual, setInscricaoEstadual] = useState('')
  const [endereco, setEndereco] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [cep, setCep] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadingCnpj, setLoadingCnpj] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedBusca(busca.trim()), 400)
    return () => clearTimeout(t)
  }, [busca])

  useEffect(() => {
    setPage(1)
  }, [debouncedBusca, incluirInativos])

  function load() {
    setLoading(true)
    apiEmpresas
      .list({
        incluir_inativos: incluirInativos,
        busca: debouncedBusca || undefined,
        offset: (page - 1) * PAGE_SIZE_PADRAO,
        limit: PAGE_SIZE_PADRAO,
      })
      .then(({ items, total: t }) => {
        setList(items)
        setTotal(t)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [page, debouncedBusca, incluirInativos])

  useEffect(() => {
    coletarTodasPaginas((o, l) => redes.list({ incluir_inativos: true, offset: o, limit: l })).then(setRedesList)
    coletarTodasPaginas((o, l) => tiposNegocio.list({ incluir_inativos: true, offset: o, limit: l })).then(setTiposList)
  }, [])

  function openCreate() {
    setEditingId(null)
    const sorted = [...redesList].sort(
      (a, b) => (Date.parse(b.created_at ?? '') || 0) - (Date.parse(a.created_at ?? '') || 0),
    )
    setRedeId(sorted[0]?.id ?? '')
    setTipoNegocioId('')
    setNome('')
    setCnpjCpf('')
    setRazaoSocial('')
    setNomeFantasia('')
    setInscricaoEstadual('')
    setEndereco('')
    setNumero('')
    setComplemento('')
    setBairro('')
    setCidade('')
    setEstado('')
    setCep('')
    setEmail('')
    setTelefone('')
    setAtivo(true)
    setError('')
    setModalOpen(true)
  }

  function openEdit(e: Empresas.Empresa) {
    setEditingId(e.id)
    setRedeId(e.rede_id)
    setTipoNegocioId(e.tipo_negocio_id ?? '')
    setNome(e.nome)
    setCnpjCpf(e.cnpj_cpf ? maskCnpjCpf(e.cnpj_cpf) : '')
    setRazaoSocial(e.razao_social ?? '')
    setNomeFantasia(e.nome_fantasia ?? '')
    setInscricaoEstadual(e.inscricao_estadual ?? '')
    setEndereco(e.endereco ?? '')
    setNumero(e.numero ?? '')
    setComplemento(e.complemento ?? '')
    setBairro(e.bairro ?? '')
    setCidade(e.cidade ?? '')
    setEstado(e.estado ?? '')
    setCep(e.cep ?? '')
    setEmail(e.email ?? '')
    setTelefone(e.telefone ?? '')
    setAtivo(e.ativo)
    setError('')
    setModalOpen(true)
  }

  function handleCnpjCpfChange(value: string) {
    setCnpjCpf(maskCnpjCpf(value))
  }

  async function handleConsultarCnpj() {
    const d = digitsOnly(cnpjCpf)
    if (!isCnpj(cnpjCpf)) {
      toast.showWarning('Informe um CNPJ com 14 dígitos para consultar. CPF não possui consulta automática.')
      return
    }
    setLoadingCnpj(true)
    setError('')
    try {
      const data = await apiEmpresas.consultarCnpj(d)
      setRazaoSocial(data.razao_social ?? '')
      setNomeFantasia(data.nome_fantasia ?? '')
      setNome(data.nome_fantasia || data.razao_social || nome)
      setEndereco(data.endereco ?? '')
      setNumero(data.numero ?? '')
      setComplemento(data.complemento ?? '')
      setBairro(data.bairro ?? '')
      setCidade(data.cidade ?? '')
      setEstado(data.estado ?? '')
      setCep(data.cep ?? '')
      setEmail(data.email ?? '')
      setTelefone(data.telefone ?? '')
      toast.showSuccess('Dados preenchidos com sucesso.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar CNPJ')
      toast.showError(err instanceof Error ? err.message : 'Erro ao consultar CNPJ')
    } finally {
      setLoadingCnpj(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!redeId) return
    setError('')
    setSaving(true)
    try {
      const payload = {
        rede_id: Number(redeId),
        tipo_negocio_id: tipoNegocioId === '' ? null : Number(tipoNegocioId),
        nome: nome.trim(),
        cnpj_cpf: cnpjCpf.replace(/\D/g, '') || null,
        razao_social: razaoSocial.trim() || null,
        nome_fantasia: nomeFantasia.trim() || null,
        inscricao_estadual: inscricaoEstadual.trim() || null,
        endereco: endereco.trim() || null,
        numero: numero.trim() || null,
        complemento: complemento.trim() || null,
        bairro: bairro.trim() || null,
        cidade: cidade.trim() || null,
        estado: estado.trim() || null,
        cep: cep.replace(/\D/g, '') || null,
        email: email.trim() || null,
        telefone: telefone.trim() || null,
        ativo,
      }
      if (editingId) {
        await apiEmpresas.update(editingId, payload)
      } else {
        await apiEmpresas.create(payload)
      }
      setModalOpen(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir esta empresa?')) return
    try {
      await apiEmpresas.delete(id)
      load()
    } catch (err) {
      toast.showWarning(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Empresas</h1>
        <Button onClick={openCreate} disabled={modalOpen}>Nova empresa</Button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
          <Card title={editingId ? 'Editar empresa' : 'Nova empresa'} className="w-full max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectComPesquisa
                id="empresa-rede"
                label="Rede"
                value={redeId}
                onChange={(id) => setRedeId(id)}
                required
                items={redesList.map((r) => ({
                  id: r.id,
                  label: r.nome,
                  createdAt: r.created_at,
                }))}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Tipo de negócio</label>
                <select value={tipoNegocioId} onChange={(e) => setTipoNegocioId(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-3 py-2">
                  <option value="">Selecione</option>
                  {tiposList.map((t) => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">CNPJ / CPF</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="00.000.000/0001-00 ou 000.000.000-00"
                  value={cnpjCpf}
                  onChange={(e) => handleCnpjCpfChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <Button type="button" variant="secondary" onClick={handleConsultarCnpj} disabled={loadingCnpj} className="shrink-0 sm:w-auto" aria-label="Consultar CNPJ">
                {loadingCnpj ? '...' : (
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </Button>
            </div>

            <Input label="Nome (ex.: nome fantasia) *" value={nome} onChange={(e) => setNome(e.target.value)} required />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Razão social" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} />
              <Input label="Nome fantasia" value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} />
            </div>
            <Input label="Inscrição estadual" value={inscricaoEstadual} onChange={(e) => setInscricaoEstadual(e.target.value)} />

            <div className="border-t border-slate-200 pt-3 mt-2">
              <p className="mb-2 text-sm font-medium text-slate-700">Endereço</p>
              <div className="space-y-3">
                <Input label="Logradouro" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input label="Número" value={numero} onChange={(e) => setNumero(e.target.value)} />
                  <Input label="Complemento" value={complemento} onChange={(e) => setComplemento(e.target.value)} />
                  <Input label="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input label="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
                  <Input label="Estado (UF)" value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="SP" maxLength={2} />
                  <Input label="CEP" value={cep} onChange={(e) => setCep(e.target.value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9))} placeholder="00000-000" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input label="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} className="rounded border-slate-300" />
              Ativo
            </label>

            <div className="flex gap-2 pt-2 border-t border-slate-200">
              <Button type="submit" loading={saving}>Salvar</Button>
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            </div>
            </form>
          </Card>
        </div>
      )}

      {!modalOpen && (
        <Card>
          <BarraBuscaPaginacao
            busca={busca}
            onBuscaChange={setBusca}
            placeholder="Buscar por nome, razão social, CNPJ ou e-mail"
            page={page}
            total={total}
            onPageChange={setPage}
            disabled={loading}
            extra={<FiltroInativos incluirInativos={incluirInativos} onChange={setIncluirInativos} />}
          />
        {loading ? (
          <p className="text-slate-500">Carregando...</p>
        ) : list.length === 0 ? (
          <p className="text-slate-500">Nenhuma empresa encontrada.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {list.map((e) => (
              <li
                key={e.id}
                role="button"
                tabIndex={0}
                onClick={() => openEdit(e)}
                onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openEdit(e); } }}
                className="flex cursor-pointer items-center justify-between rounded-lg py-3 px-2 -mx-2 transition-colors duration-150 hover:bg-slate-50/80 focus:outline-none focus:bg-slate-50/80"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`truncate font-medium ${e.ativo ? 'text-slate-800' : 'text-slate-400'}`}>{e.nome}</span>
                  {!e.ativo && <span className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600">Inativo</span>}
                </div>
                <div className="flex gap-1.5 shrink-0" onClick={(ev) => ev.stopPropagation()}>
                  <Button variant="ghost" onClick={() => openEdit(e)} aria-label="Editar empresa">
                    <IconPencil ariaHidden={false} />
                  </Button>
                  <Button variant="ghost" onClick={() => handleDelete(e.id)} aria-label="Excluir empresa">
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

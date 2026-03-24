import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { empresas as apiEmpresas, redes, tiposNegocio, type Empresas } from '../api/client'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { maskCnpjCpf } from '../utils/maskCnpjCpf'

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  const v = value?.trim()
  return (
    <div className="grid grid-cols-1 gap-0.5 border-b border-slate-100 py-3 last:border-0 sm:grid-cols-[minmax(0,10rem)_1fr] sm:gap-6 sm:py-3.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="text-sm leading-relaxed text-slate-800">{v ? v : '—'}</dd>
    </div>
  )
}

export function EmpresaDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const empresaId = id ? parseInt(id, 10) : NaN

  const [empresa, setEmpresa] = useState<Empresas.Empresa | null>(null)
  const [redeNome, setRedeNome] = useState<string>('')
  const [tipoNegocioNome, setTipoNegocioNome] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!id || isNaN(empresaId)) {
      setLoading(false)
      setLoadError(true)
      return
    }
    let cancelled = false
    setLoading(true)
    setLoadError(false)
    apiEmpresas
      .get(empresaId)
      .then(async (e) => {
        if (cancelled) return
        setEmpresa(e)
        try {
          const r = await redes.get(e.rede_id)
          if (!cancelled) setRedeNome(r.nome)
        } catch {
          if (!cancelled) setRedeNome('—')
        }
        if (e.tipo_negocio_id != null) {
          try {
            const t = await tiposNegocio.get(e.tipo_negocio_id)
            if (!cancelled) setTipoNegocioNome(t.nome)
          } catch {
            if (!cancelled) setTipoNegocioNome('—')
          }
        } else if (!cancelled) setTipoNegocioNome('')
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true)
          setEmpresa(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, empresaId])

  useEffect(() => {
    if (!loadError || loading) return
    toast.showWarning('Empresa não encontrada.')
    navigate('/empresas', { replace: true })
  }, [loadError, loading, navigate, toast])

  function abrirEdicao() {
    if (!empresa) return
    navigate('/empresas', { state: { empresaEditId: empresa.id } })
  }

  async function handleExcluir() {
    if (!empresa || !confirm('Excluir esta empresa? Esta ação não pode ser desfeita.')) return
    try {
      await apiEmpresas.delete(empresa.id)
      toast.showSuccess('Empresa excluída.')
      navigate('/empresas', { replace: true })
    } catch (err) {
      toast.showWarning(err instanceof Error ? err.message : 'Não foi possível excluir.')
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-9 w-2/3 max-w-md animate-pulse rounded-lg bg-slate-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    )
  }

  if (!empresa) {
    return null
  }

  const doc = empresa.cnpj_cpf ? maskCnpjCpf(empresa.cnpj_cpf) : null
  const enderecoLinha = [empresa.endereco, empresa.numero, empresa.complemento].filter(Boolean).join(', ') || null
  const cidadeUf = [empresa.cidade, empresa.estado].filter(Boolean).join(' / ') || null
  const cepFmt = empresa.cep
    ? empresa.cep.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9)
    : null

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-10">
      <div>
        <Link
          to="/empresas"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
        >
          <span aria-hidden>←</span> Empresas
        </Link>
      </div>

      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{empresa.nome}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  empresa.ativo ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/15' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-300/60'
                }`}
              >
                {empresa.ativo ? 'Ativa' : 'Inativa'}
              </span>
              {doc ? (
                <span className="font-mono text-sm tabular-nums text-slate-600">{doc}</span>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate('/empresas')}>
              Voltar
            </Button>
            <Button onClick={abrirEdicao}>Editar</Button>
            <Button variant="danger" onClick={handleExcluir}>
              Excluir
            </Button>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Vínculos</h2>
        <dl>
          <div className="grid grid-cols-1 gap-0.5 border-b border-slate-100 py-3 sm:grid-cols-[minmax(0,10rem)_1fr] sm:gap-6 sm:py-3.5">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Rede</dt>
            <dd className="text-sm">
              {redeNome && redeNome !== '—' ? (
                <Link
                  to={`/redes/${empresa.rede_id}`}
                  className="font-medium text-slate-800 underline decoration-slate-300 underline-offset-2 transition-colors hover:text-slate-950 hover:decoration-slate-500"
                >
                  {redeNome}
                </Link>
              ) : (
                <span className="text-slate-800">—</span>
              )}
            </dd>
          </div>
          <DetailRow label="Tipo de negócio" value={tipoNegocioNome || undefined} />
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Dados cadastrais</h2>
        <dl>
          <DetailRow label="Razão social" value={empresa.razao_social} />
          <DetailRow label="Nome fantasia" value={empresa.nome_fantasia} />
          <DetailRow label="Inscrição estadual" value={empresa.inscricao_estadual} />
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Endereço</h2>
        <dl>
          <DetailRow label="Logradouro" value={enderecoLinha} />
          <DetailRow label="Bairro" value={empresa.bairro} />
          <DetailRow label="Cidade / UF" value={cidadeUf} />
          <DetailRow label="CEP" value={cepFmt} />
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Contato</h2>
        <dl>
          <DetailRow label="E-mail" value={empresa.email} />
          <DetailRow label="Telefone" value={empresa.telefone} />
        </dl>
      </section>
    </div>
  )
}

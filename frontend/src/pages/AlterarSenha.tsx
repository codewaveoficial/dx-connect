import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { atendentes } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-[0.9375rem] text-slate-900 shadow-inner placeholder:text-slate-400 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/25 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:placeholder:text-slate-500'

export function AlterarSenha() {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [senhaNova, setSenhaNova] = useState('')
  const [senhaConf, setSenhaConf] = useState('')
  const [loading, setLoading] = useState(false)
  const { refreshUser } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (senhaNova.length < 8) {
      toast.showError('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (senhaNova !== senhaConf) {
      toast.showError('A confirmação não coincide com a nova senha.')
      return
    }
    setLoading(true)
    try {
      await atendentes.trocarSenha(senhaAtual, senhaNova)
      await refreshUser()
      toast.showSuccess('Senha alterada com sucesso.')
      navigate('/', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível alterar a senha.'
      toast.showError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Definir nova senha</h1>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
        Por segurança, altere a senha temporária antes de continuar usando o sistema.
      </p>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="pwd-atual" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Senha atual
            </label>
            <input
              id="pwd-atual"
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              autoComplete="current-password"
              className={fieldClass}
              required
            />
          </div>
          <div>
            <label htmlFor="pwd-nova" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nova senha
            </label>
            <input
              id="pwd-nova"
              type="password"
              value={senhaNova}
              onChange={(e) => setSenhaNova(e.target.value)}
              autoComplete="new-password"
              className={fieldClass}
              minLength={8}
              required
            />
          </div>
          <div>
            <label htmlFor="pwd-conf" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirmar nova senha
            </label>
            <input
              id="pwd-conf"
              type="password"
              value={senhaConf}
              onChange={(e) => setSenhaConf(e.target.value)}
              autoComplete="new-password"
              className={fieldClass}
              minLength={8}
              required
            />
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            Salvar e continuar
          </Button>
        </form>
      </div>
    </div>
  )
}

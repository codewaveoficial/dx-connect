import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { IconEye } from '../components/ui/IconEye'
import { IconEyeOff } from '../components/ui/IconEyeOff'
import { useToast } from '../components/ui/Toast'

export function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { showError, showSuccess } = useToast()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !senha.trim()) {
      showError('Informe e-mail e senha.')
      return
    }
    if (!email.includes('@')) {
      showError('Informe um e-mail válido.')
      return
    }
    setLoading(true)
    try {
      await login(email.trim(), senha)
      showSuccess('Login realizado com sucesso. Redirecionando...')
      navigate('/', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha no login'
      showError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card title="Acesso ao sistema" className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            label="Senha"
            type={mostrarSenha ? 'text' : 'password'}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            endAdornment={
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {mostrarSenha ? (
                  <IconEyeOff className="size-5" ariaHidden />
                ) : (
                  <IconEye className="size-5" ariaHidden />
                )}
              </button>
            }
          />
          <Button type="submit" className="w-full" loading={loading}>
            Entrar
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">
          Use o usuário cadastrado pelo administrador.
        </p>
      </Card>
    </div>
  )
}

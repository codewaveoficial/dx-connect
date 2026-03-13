import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { atendentes, type Atendentes } from '../api/client'

interface AuthContextValue {
  user: Atendentes.Atendente | null
  loading: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Atendentes.Atendente | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const me = await atendentes.me()
      setUser(me)
    } catch {
      setUser(null)
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = useCallback(async (email: string, senha: string) => {
    const { auth } = await import('../api/client')
    const res = await auth.login(email, senha)
    localStorage.setItem('token', res.access_token)
    await refreshUser()
  }, [refreshUser])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  const value: AuthContextValue = {
    user,
    loading,
    login,
    logout,
    refreshUser,
    isAdmin: user?.role === 'admin',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

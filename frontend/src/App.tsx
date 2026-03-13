import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Tickets } from './pages/Tickets'
import { TicketNovo } from './pages/TicketNovo'
import { TicketDetalhe } from './pages/TicketDetalhe'
import { Redes } from './pages/Redes'
import { RedeDetalhe } from './pages/RedeDetalhe'
import { Empresas } from './pages/Empresas'
import { Setores } from './pages/Setores'
import { Atendentes } from './pages/Atendentes'
import { FuncionariosRede } from './pages/FuncionariosRede'
import { StatusTicketPage } from './pages/StatusTicket'
import { ToastProvider } from './components/ui/Toast'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-slate-500">Carregando...</span>
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="tickets/novo" element={<TicketNovo />} />
        <Route path="tickets/:id" element={<TicketDetalhe />} />
        <Route path="redes/:id" element={<RedeDetalhe />} />
        <Route path="redes" element={<Redes />} />
        <Route path="empresas" element={<Empresas />} />
        <Route path="setores" element={<Setores />} />
        <Route path="atendentes" element={<Atendentes />} />
        <Route path="funcionarios-rede" element={<FuncionariosRede />} />
        <Route path="status-ticket" element={<StatusTicketPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

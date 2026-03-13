import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Sidebar } from './Sidebar'

const menuIcon = (
  <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

export function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        expanded={sidebarExpanded}
        mobileOpen={sidebarMobileOpen}
        onMobileClose={() => setSidebarMobileOpen(false)}
        isAdmin={isAdmin ?? false}
        userNome={user?.nome ?? ''}
        userRole={user?.role ?? ''}
        onLogout={logout}
      />

      {/* Área principal: no mobile ocupa 100%; no desktop margem = largura do sidebar */}
      <div
        className={`min-h-screen transition-[margin-left] duration-200 ease-out ${
          sidebarExpanded ? 'md:ml-[280px]' : 'md:ml-[72px]'
        }`}
      >
          {/* Top bar: mobile-first, área de toque generosa */}
          <header className="sticky top-0 z-30 flex h-14 min-h-[56px] items-center gap-3 border-b border-slate-200 bg-white px-4 shadow-sm md:px-6">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth >= 768) {
                  setSidebarExpanded((e) => !e)
                } else {
                  setSidebarMobileOpen((o) => !o)
                }
              }}
              className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 touch-manipulation md:size-9"
              aria-label="Abrir ou recolher menu"
              aria-expanded={sidebarMobileOpen}
            >
              {menuIcon}
            </button>
            <div className="min-w-0 flex-1" />
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-medium text-slate-800">{user?.nome}</p>
              <p className="truncate text-xs text-slate-500">{user?.role}</p>
            </div>
          </header>

          <main className="p-4 md:p-6">
            <Outlet />
          </main>
      </div>
    </div>
  )
}

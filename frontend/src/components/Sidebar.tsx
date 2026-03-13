import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const icons: Record<string, React.ReactNode> = {
  dashboard: (
    <svg className="size-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  tickets: (
    <svg className="size-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  clientes: (
    <svg className="size-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  redes: (
    <svg className="size-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c9 0 0118 0" />
    </svg>
  ),
  empresas: (
    <svg className="size-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  funcionarios: (
    <svg className="size-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  configuracoes: (
    <svg className="size-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  setores: (
    <svg className="size-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  atendentes: (
    <svg className="size-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  status: (
    <svg className="size-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  logout: (
    <svg className="size-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  menu: (
    <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  chevronDown: (
    <svg className="size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  chevronRight: (
    <svg className="size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
}

interface NavLink {
  to: string
  label: string
  icon: string
}

interface NavGroup {
  type: 'group'
  id: string
  label: string
  icon: string
  adminOnly?: boolean
  children: NavLink[]
}

interface NavItemLink {
  type: 'link'
  to: string
  label: string
  icon: string
}

type NavItem = NavItemLink | NavGroup

const navStructure: NavItem[] = [
  { type: 'link', to: '/', label: 'Dashboard', icon: 'dashboard' },
  { type: 'link', to: '/tickets', label: 'Tickets', icon: 'tickets' },
  {
    type: 'group',
    id: 'clientes',
    label: 'Clientes',
    icon: 'clientes',
    adminOnly: true,
    children: [
      { to: '/redes', label: 'Redes', icon: 'redes' },
      { to: '/empresas', label: 'Empresas', icon: 'empresas' },
      { to: '/funcionarios-rede', label: 'Funcionários da rede', icon: 'funcionarios' },
    ],
  },
  {
    type: 'group',
    id: 'configuracoes',
    label: 'Configurações',
    icon: 'configuracoes',
    adminOnly: true,
    children: [
      { to: '/setores', label: 'Setores', icon: 'setores' },
      { to: '/atendentes', label: 'Atendentes', icon: 'atendentes' },
      { to: '/status-ticket', label: 'Status de ticket', icon: 'status' },
    ],
  },
]

function isPathInGroup(pathname: string, children: NavLink[]): boolean {
  return children.some(
    (c) => pathname === c.to || (c.to !== '/' && pathname.startsWith(c.to))
  )
}

interface SidebarProps {
  expanded: boolean
  mobileOpen: boolean
  onMobileClose: () => void
  isAdmin: boolean
  userNome: string
  userRole: string
  onLogout: () => void
}

export function Sidebar({
  expanded,
  mobileOpen,
  onMobileClose,
  isAdmin,
  userNome,
  userRole,
  onLogout,
}: SidebarProps) {
  const location = useLocation()
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [openFlyout, setOpenFlyout] = useState<string | null>(null)

  const items = navStructure.filter(
    (item) => item.type === 'link' || !('adminOnly' in item && item.adminOnly) || isAdmin
  ) as NavItem[]

  // Abrir grupo automaticamente quando a rota pertence a ele
  useEffect(() => {
    for (const item of navStructure) {
      if (item.type === 'group') {
        if (!item.adminOnly || isAdmin) {
          if (isPathInGroup(location.pathname, item.children)) {
            setOpenGroup(item.id)
            return
          }
        }
      }
    }
  }, [location.pathname, isAdmin])

  const linkClass = (to: string, base = '') =>
    `${base} flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors touch-manipulation min-h-[44px] ${
      location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
        ? 'bg-slate-200 text-slate-900'
        : 'text-slate-600 hover:bg-slate-100 active:bg-slate-200'
    } ${!expanded ? 'md:justify-center md:px-0 md:gap-0' : ''}`

  const isGroupOpen = (id: string) => openGroup === id
  const isFlyoutOpen = (id: string) => openFlyout === id

  const sidebarContent = (
    <>
      <div className={`flex h-14 shrink-0 items-center justify-center border-b border-slate-200 ${expanded ? 'px-3' : 'md:px-0'}`}>
        <Link
          to="/"
          onClick={onMobileClose}
          className={`flex items-center overflow-hidden rounded-lg ${expanded ? 'min-w-0 flex-1 gap-2' : 'md:w-full md:justify-center md:gap-0'}`}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white font-bold text-sm">
            DX
          </span>
          <span
            className={`truncate font-semibold text-slate-800 transition-all duration-200 ${
              expanded ? 'opacity-100 w-auto' : 'md:opacity-0 md:w-0 md:overflow-hidden md:max-w-0'
            }`}
          >
            DX Connect
          </span>
        </Link>
      </div>

      <nav className={`flex-1 overflow-y-auto py-3 px-2 ${!expanded ? 'md:px-0' : ''}`} aria-label="Menu principal">
        <ul className={`space-y-0.5 px-2 ${!expanded ? 'md:px-0' : ''}`}>
          {items.map((item) => {
            if (item.type === 'link') {
              return (
                <li key={item.to} className="w-full">
                  <Link
                    to={item.to}
                    onClick={onMobileClose}
                    className={linkClass(item.to)}
                  >
                    {icons[item.icon]}
                    <span
                      className={`truncate transition-all duration-200 ${
                        expanded ? 'opacity-100 w-auto' : 'md:opacity-0 md:w-0 md:overflow-hidden'
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              )
            }

            // Group
            const group = item
            const open = isGroupOpen(group.id)
            const active = isPathInGroup(location.pathname, group.children)

            return (
              <li key={group.id} className="w-full">
                {/* Desktop expandido: botão que expande/recolhe e mostra filhos abaixo */}
                {expanded ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setOpenGroup(open ? null : group.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors touch-manipulation min-h-[44px] ${
                        active ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      aria-expanded={open}
                      aria-controls={`nav-group-${group.id}`}
                    >
                      {icons[group.icon]}
                      <span className="truncate flex-1">{group.label}</span>
                      <span className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
                        {icons.chevronDown}
                      </span>
                    </button>
                    <ul
                      id={`nav-group-${group.id}`}
                      className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                      role="group"
                    >
                      {group.children.map((child) => (
                        <li key={child.to} className="pl-4">
                          <Link
                            to={child.to}
                            onClick={onMobileClose}
                            className={linkClass(child.to, 'flex')}
                          >
                            {icons[child.icon]}
                            <span className="truncate">{child.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  /* Desktop recolhido: ícone do grupo; ao clicar abre flyout */
                  <div className="relative w-full">
                    <button
                      type="button"
                      onClick={() => setOpenFlyout(isFlyoutOpen(group.id) ? null : group.id)}
                      className={`flex w-full items-center justify-center rounded-lg py-2.5 text-slate-600 hover:bg-slate-100 min-h-[44px] px-2 md:px-0 ${
                        active ? 'bg-slate-100 text-slate-900' : ''
                      }`}
                      aria-expanded={isFlyoutOpen(group.id)}
                      aria-haspopup="true"
                    >
                      {icons[group.icon]}
                    </button>
                    {isFlyoutOpen(group.id) && (
                      <>
                        <div
                          role="presentation"
                          className="fixed inset-0 z-40 md:left-[72px]"
                          onClick={() => setOpenFlyout(null)}
                        />
                        <ul
                          className="absolute left-full top-0 z-50 ml-1 min-w-[200px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                          role="menu"
                        >
                          {group.children.map((child) => (
                            <li key={child.to} role="none">
                              <Link
                                to={child.to}
                                onClick={() => {
                                  onMobileClose()
                                  setOpenFlyout(null)
                                }}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                role="menuitem"
                              >
                                {icons[child.icon]}
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      <div className={`border-t border-slate-200 p-2 ${!expanded ? 'md:px-0' : ''}`}>
        <div
          className={`flex items-center gap-3 px-3 py-2 text-slate-600 ${
            expanded ? 'opacity-100' : 'md:opacity-0 md:overflow-hidden md:w-0 md:px-0'
          }`}
        >
          <span className="size-8 shrink-0 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
            {userNome?.charAt(0)?.toUpperCase() ?? '?'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800">{userNome}</p>
            <p className="truncate text-xs text-slate-500">{userRole}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onMobileClose()
            onLogout()
          }}
          className={`mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 active:bg-slate-200 touch-manipulation min-h-[44px] ${
            expanded ? '' : 'md:justify-center md:px-0'
          }`}
        >
          {icons.logout}
          <span
            className={`truncate transition-all duration-200 ${
              expanded ? 'opacity-100 w-auto' : 'md:opacity-0 md:w-0 md:overflow-hidden'
            }`}
          >
            Sair
          </span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Overlay mobile: fecha ao tocar fora */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Fechar menu"
        onClick={onMobileClose}
        onKeyDown={(e) => e.key === 'Enter' && onMobileClose()}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 md:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Sidebar: drawer no mobile, fixo no desktop */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-[280px] flex-col bg-white shadow-xl transition-[transform,width] duration-200 ease-out md:translate-x-0 md:shadow-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${expanded ? 'md:w-[280px]' : 'md:w-[72px]'}`}
        aria-label="Menu lateral"
      >
        {sidebarContent}
      </aside>
    </>
  )
}

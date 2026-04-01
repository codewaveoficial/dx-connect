import { useTheme } from '../contexts/ThemeContext'

const iconSun = (
  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
)

const iconMoon = (
  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
)

/** Alterna tema claro/escuro; minimalista, adequado à barra superior. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolved, toggleLightDark } = useTheme()
  const isDark = resolved === 'dark'

  return (
    <button
      type="button"
      onClick={toggleLightDark}
      className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 dark:active:bg-slate-700 touch-manipulation md:size-9 ${className}`}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
    >
      {isDark ? iconSun : iconMoon}
    </button>
  )
}

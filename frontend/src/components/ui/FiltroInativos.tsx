/**
 * Filtro minimalista: Ativos | Todos (inclui inativos).
 * Uso: incluirInativos = true quando "Todos" está selecionado.
 */
export function FiltroInativos({
  incluirInativos,
  onChange,
  className = '',
}: {
  incluirInativos: boolean
  onChange: (incluir: boolean) => void
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label="Filtrar por status"
      className={`inline-flex rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 dark:border-slate-600 dark:bg-slate-800/60 ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          !incluirInativos
            ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-900 dark:text-slate-100 dark:shadow-none dark:ring-1 dark:ring-cyan-500/25'
            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        Ativos
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
          incluirInativos
            ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-900 dark:text-slate-100 dark:shadow-none dark:ring-1 dark:ring-cyan-500/25'
            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
        }`}
      >
        Todos
      </button>
    </div>
  )
}

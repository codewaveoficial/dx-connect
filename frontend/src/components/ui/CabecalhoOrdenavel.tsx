/** Cabeçalho de coluna clicável: 1º clique A→Z, mesmo cabeçalho de novo inverte. */
export function CabecalhoOrdenavel<T extends string>({
  coluna,
  rotulo,
  ordenarPor,
  ordem,
  aoOrdenar,
  className = '',
  scope = 'col',
}: {
  coluna: T
  rotulo: string
  ordenarPor: T | null
  ordem: 'asc' | 'desc'
  aoOrdenar: (c: T) => void
  className?: string
  scope?: 'col' | 'row'
}) {
  const ativo = ordenarPor === coluna
  return (
    <th
      scope={scope}
      aria-sort={ativo ? (ordem === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:px-6 dark:text-slate-400 ${className}`}
    >
      <button
        type="button"
        onClick={() => aoOrdenar(coluna)}
        className="group inline-flex max-w-full items-center gap-1 rounded-md text-left font-semibold text-inherit -outline-offset-2 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 dark:hover:text-slate-200 dark:focus-visible:ring-slate-500/40"
      >
        <span className="truncate">{rotulo}</span>
        <span
          className="inline-flex shrink-0 flex-col leading-none text-[10px] text-slate-400 opacity-70 group-hover:opacity-100 dark:text-slate-500"
          aria-hidden
        >
          <span className={ativo && ordem === 'asc' ? 'text-slate-700 dark:text-slate-200' : ''}>▲</span>
          <span className={`-mt-0.5 ${ativo && ordem === 'desc' ? 'text-slate-700 dark:text-slate-200' : ''}`}>▼</span>
        </span>
      </button>
    </th>
  )
}

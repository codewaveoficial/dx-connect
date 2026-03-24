import { useId, type ButtonHTMLAttributes } from 'react'

type OmitBase = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'role' | 'onClick' | 'children'>

export interface SwitchProps extends OmitBase {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  description?: string
  /** Sem caixa; só rótulo + interruptor */
  bare?: boolean
}

/**
 * Interruptor acessível (role="switch"), visual alinhado aos botões primary (slate-800).
 */
export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  bare = false,
  className = '',
  id: idProp,
  ...rest
}: SwitchProps) {
  const uid = useId()
  const id = idProp ?? `switch-${uid}`

  return (
    <div
      className={
        bare
          ? `flex w-full items-start justify-between gap-4 ${className}`
          : `flex w-full items-start justify-between gap-4 rounded-xl border border-slate-200/90 bg-slate-50/60 px-4 py-3 ${className}`
      }
    >
      <div className="min-w-0 flex-1 pt-0.5">
        <label
          htmlFor={id}
          className={`text-sm font-medium text-slate-800 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          {label}
        </label>
        {description ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        {...rest}
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={`
          relative inline-flex h-7 w-11 shrink-0 cursor-pointer rounded-full border border-slate-300/40 transition-colors duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-45
          ${checked ? 'border-slate-800 bg-slate-800' : 'bg-slate-200'}
        `}
      >
        <span
          aria-hidden
          className={`
            pointer-events-none absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-md ring-1 ring-slate-900/5 transition-transform duration-200 ease-out
            ${checked ? 'translate-x-[22px]' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  )
}

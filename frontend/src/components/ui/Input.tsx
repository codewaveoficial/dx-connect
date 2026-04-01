import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  /** Conteúdo à direita (ex.: botão de mostrar senha). O campo ganha padding extra. */
  endAdornment?: ReactNode
}

const inputToneClass = `
            w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900
            placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500
            disabled:bg-slate-50 disabled:text-slate-500
            dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder:text-slate-500
            dark:focus:border-cyan-500/60 dark:focus:ring-cyan-500/40
            dark:disabled:bg-slate-900/30 dark:disabled:text-slate-500
          `

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, endAdornment, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')
    const field = (
      <input
        ref={ref}
        id={inputId}
        className={`
            ${inputToneClass}
            ${endAdornment ? 'pr-10' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
        title={error || props.title}
        {...props}
      />
    )
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        {endAdornment ? (
          <div className="relative">
            {field}
            <div className="absolute inset-y-0 right-0 z-10 flex items-center pr-1.5">{endAdornment}</div>
          </div>
        ) : (
          field
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'

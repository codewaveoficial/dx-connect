import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  /** Conteúdo à direita (ex.: botão de mostrar senha). O campo ganha padding extra. */
  endAdornment?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, endAdornment, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')
    const field = (
      <input
        ref={ref}
        id={inputId}
        className={`
            w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900
            placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500
            disabled:bg-slate-50 disabled:text-slate-500
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
          <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-slate-700">
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
  }
)
Input.displayName = 'Input'

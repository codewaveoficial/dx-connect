import { type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-slate-800 text-white hover:bg-slate-700 focus:ring-slate-500',
  secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-400',
}

export function Button({ variant = 'primary', loading, className = '', disabled, children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
        focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Aguarde...
        </>
      ) : (
        children
      )}
    </button>
  )
}

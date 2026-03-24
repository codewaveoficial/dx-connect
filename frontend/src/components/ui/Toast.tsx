import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

function textoParaToast(input: unknown): string {
  if (typeof input === 'string') {
    const t = input.trim()
    if (t && t !== '[object Object]') return t
  }
  if (input instanceof Error && input.message && input.message !== '[object Object]') {
    return input.message
  }
  if (input !== null && typeof input === 'object') {
    const o = input as Record<string, unknown>
    if (typeof o.detail === 'string' && o.detail.trim()) return o.detail.trim()
    if (typeof o.message === 'string' && o.message.trim()) return o.message.trim()
  }
  return 'Não foi possível concluir a ação. Tente novamente.'
}

interface ToastContextValue {
  showSuccess: (message: unknown) => void
  showError: (message: unknown) => void
  showWarning: (message: unknown) => void
  showInfo: (message: unknown) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((type: ToastType, message: unknown) => {
    const id = Date.now() + Math.random()
    const text = textoParaToast(message)
    setToasts((current) => [...current, { id, type, message: text }])
    // Remover automaticamente após 4s
    setTimeout(() => remove(id), 4000)
  }, [remove])

  const value: ToastContextValue = {
    showSuccess: (message) => show('success', message),
    showError: (message) => show('error', message),
    showWarning: (message) => show('warning', message),
    showInfo: (message) => show('info', message),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => {
          let bg = 'bg-slate-800'
          let text = 'text-white'
          if (toast.type === 'success') {
            bg = 'bg-emerald-50 border border-emerald-200'
            text = 'text-emerald-900'
          }
          if (toast.type === 'error') {
            bg = 'bg-red-50 border border-red-200'
            text = 'text-red-900'
          }
          if (toast.type === 'warning') {
            bg = 'bg-amber-50 border border-amber-200'
            text = 'text-amber-900'
          }

          return (
            <div
              key={toast.id}
              className={`${bg} pointer-events-auto flex min-w-[260px] max-w-sm items-start gap-3 rounded-lg px-4 py-3 text-sm ${text} shadow-lg`}
            >
              <span className="mt-0.5">
                {toast.type === 'success' && '✓'}
                {toast.type === 'error' && '!'}
                {toast.type === 'warning' && '!'}
                {toast.type === 'info' && 'ℹ'}
              </span>
              <p className="flex-1 leading-snug">{toast.message}</p>
              <button
                type="button"
                onClick={() => remove(toast.id)}
                className="ml-2 text-base leading-none opacity-70 hover:opacity-100"
                aria-label="Fechar aviso"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast deve ser usado dentro de ToastProvider')
  }
  return ctx
}


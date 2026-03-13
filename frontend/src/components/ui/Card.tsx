import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
}

export function Card({ title, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
      {...props}
    >
      {title && (
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}

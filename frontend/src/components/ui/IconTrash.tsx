interface IconTrashProps {
  className?: string
  ariaHidden?: boolean
}

export function IconTrash({ className = 'size-5', ariaHidden = true }: IconTrashProps) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden={ariaHidden}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.7}
        d="M10 4h4m-7 4h10m-9 0v9a2 2 0 002 2h4a2 2 0 002-2V8"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.7}
        d="M10 11v5m4-5v5"
      />
    </svg>
  )
}


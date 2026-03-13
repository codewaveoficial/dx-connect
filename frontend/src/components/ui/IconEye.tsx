interface IconEyeProps {
  className?: string
  ariaHidden?: boolean
}

export function IconEye({ className = 'size-5', ariaHidden = true }: IconEyeProps) {
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
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7S3.732 16.057 2.458 12z"
      />
      <circle cx="12" cy="12" r="3" strokeWidth={2} />
    </svg>
  )
}


type Props = { label?: string }

export function LoadingSpinner({ label = 'Loading…' }: Props) {
  return (
    <div
      className="flex min-h-[200px] items-center justify-center"
      role="status"
      aria-label={label}
    >
      <svg
        className="h-8 w-8 animate-spin text-platform-primary"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  )
}

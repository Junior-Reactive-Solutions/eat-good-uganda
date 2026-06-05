type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-platform-primary text-white font-bold hover:bg-platform-primary-hover active:bg-platform-primary-hover focus-visible:ring-2 focus-visible:ring-platform-primary shadow-lg hover:shadow-xl transition-all duration-200 uppercase tracking-wide',
  secondary:
    'bg-platform-accent text-platform-fg font-bold border-2 border-platform-primary hover:bg-platform-accent-dark focus-visible:ring-2 focus-visible:ring-platform-primary transition-all duration-200',
  ghost:
    'bg-transparent text-platform-fg hover:bg-platform-accent hover:text-platform-fg font-semibold focus-visible:ring-2 focus-visible:ring-platform-primary border-2 border-platform-primary hover:border-platform-primary transition-all duration-200',
  danger: 'bg-platform-error text-white font-bold hover:bg-red-700 active:bg-red-700 focus-visible:ring-2 focus-visible:ring-platform-error shadow-lg hover:shadow-xl transition-all duration-200 uppercase tracking-wide',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-3 text-base',
  lg: 'px-6 py-4 text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}

import { forwardRef } from 'react'

type InputType = 'text' | 'email' | 'tel' | 'password' | 'search' | 'number'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string | undefined
  type?: InputType | undefined
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  error?: string | undefined
}

const inputBase =
  'w-full rounded-lg border bg-platform-surface px-3 py-2 text-sm text-platform-fg placeholder:text-platform-fg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-platform-primary focus:ring-offset-1 disabled:opacity-50'

const inputBorder = (error?: string) =>
  error ? 'border-platform-error' : 'border-platform-border'

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, id, type = 'text', className = '', ...props },
  ref,
) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-platform-fg">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        type={type}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={[inputBase, inputBorder(error), className].join(' ')}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-platform-error">
          {error}
        </p>
      )}
    </div>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, id, className = '', ...props },
  ref,
) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-platform-fg">
        {label}
      </label>
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={[inputBase, inputBorder(error), 'min-h-[100px] resize-y', className].join(' ')}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-platform-error">
          {error}
        </p>
      )}
    </div>
  )
})

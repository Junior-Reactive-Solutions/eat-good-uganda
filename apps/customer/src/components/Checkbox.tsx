import { forwardRef } from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement>

export const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox(
  { id, className = '', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      id={id}
      type="checkbox"
      className={[
        'h-4 w-4 rounded border-platform-border text-platform-primary',
        'focus:ring-2 focus:ring-platform-primary focus:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'cursor-pointer',
        className,
      ].join(' ')}
      {...props}
    />
  )
})

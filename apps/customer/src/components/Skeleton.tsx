type Props = { className?: string }

export function Skeleton({ className = '' }: Props) {
  return (
    <div
      aria-hidden="true"
      className={['animate-pulse rounded-md bg-platform-accent-dark', className].join(' ')}
    />
  )
}

type Props = React.HTMLAttributes<HTMLDivElement> & {
  as?: 'div' | 'article' | 'section'
}

export function Card({ as: Tag = 'div', className = '', children, ...props }: Props) {
  return (
    <Tag
      className={[
        'rounded-xl border border-platform-border bg-platform-surface shadow-sm',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </Tag>
  )
}

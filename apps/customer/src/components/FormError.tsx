type Props = { message?: string | null | undefined }

export function FormError({ message }: Props) {
  if (!message) return null
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-platform-error">
      {message}
    </div>
  )
}

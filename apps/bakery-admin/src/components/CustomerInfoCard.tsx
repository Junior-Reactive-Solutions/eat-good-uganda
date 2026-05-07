interface CustomerInfoCardProps {
  name: string | null
  email: string
  phone: string | null
}

export function CustomerInfoCard({ name, email, phone }: CustomerInfoCardProps) {
  return (
    <div className="rounded-lg border border-platform-border bg-white p-4">
      <h3 className="text-sm font-semibold text-platform-fg mb-3">Customer Information</h3>
      <div className="space-y-2 text-sm">
        {name && (
          <div>
            <p className="text-platform-fg-muted">Name</p>
            <p className="text-platform-fg font-medium">{name}</p>
          </div>
        )}
        <div>
          <p className="text-platform-fg-muted">Email</p>
          <p className="text-platform-fg font-medium truncate">
            <a href={`mailto:${email}`} className="hover:underline">
              {email}
            </a>
          </p>
        </div>
        {phone && (
          <div>
            <p className="text-platform-fg-muted">Phone</p>
            <p className="text-platform-fg font-medium">
              <a href={`tel:${phone}`} className="hover:underline">
                {phone}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

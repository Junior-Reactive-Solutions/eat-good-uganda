export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-platform-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 border-4 border-platform-border border-t-platform-fg rounded-full animate-spin" />
        <p className="text-platform-fg-muted">Loading...</p>
      </div>
    </div>
  )
}

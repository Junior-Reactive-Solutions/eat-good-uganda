import { useParams } from 'react-router-dom'

export default function BakeryPage() {
  const { slug } = useParams()
  return <div className="mx-auto max-w-6xl px-4 py-8"><p className="text-platform-fg-muted">Bakery: {slug} — coming in Prompt 07</p></div>
}

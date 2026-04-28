type Entry<T> = { value: T; expiresAt: number }

export class TtlCache<K, V> {
  private readonly map = new Map<K, Entry<V>>()
  private readonly maxSize: number
  private readonly ttlMs: number

  constructor({ maxSize, ttlMs }: { maxSize: number; ttlMs: number }) {
    this.maxSize = maxSize
    this.ttlMs = ttlMs
  }

  get(key: K): V | undefined {
    const entry = this.map.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.map.delete(key)
      return undefined
    }
    // Re-insert to mark as recently used
    this.map.delete(key)
    this.map.set(key, entry)
    return entry.value
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key)
    } else if (this.map.size >= this.maxSize) {
      const oldest = this.map.keys().next().value
      if (oldest !== undefined) this.map.delete(oldest)
    }
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs })
  }
}

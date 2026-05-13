import type { Database } from '@eatgood/db'
import type { AnyToken } from '@eatgood/shared'
import type { PoolClient } from 'pg'

declare global {
  namespace Express {
    interface Request {
      auth: AnyToken | null
      bakeryId?: string
      dbClient?: PoolClient
      db?: Database
      bakery?: {
        id: string
      }
      customer?: {
        id: string
        bakery_id: string
      }
    }
  }
}

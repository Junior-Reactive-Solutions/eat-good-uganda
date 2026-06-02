import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg'

import type { SqlFragment } from './sql'

const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URL_DIRECT

export type Database = Pool | PoolClient

// Lazy initialization of pool to allow tests to run without DATABASE_URL
let poolInstance: Pool | null = null

function getPool(): Pool {
  if (!poolInstance) {
    if (!connectionString) {
      throw new Error('DATABASE_URL or DATABASE_URL_DIRECT must be set')
    }
    poolInstance = new Pool({ connectionString })
  }
  return poolInstance
}

export const pool = new Proxy({} as Pool, {
  get(target, prop) {
    return (getPool() as any)[prop]
  },
})

export async function query<T extends QueryResultRow>(
  db: Database,
  fragment: SqlFragment,
): Promise<QueryResult<T>> {
  return db.query<T>(fragment.text, fragment.values)
}

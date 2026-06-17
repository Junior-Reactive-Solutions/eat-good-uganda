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

// Create a lazy-loaded pool wrapper
class LazyPool {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<T>> {
    return getPool().query<T>(text, values)
  }

  async connect(): Promise<PoolClient> {
    return getPool().connect()
  }

  end(): Promise<void> {
    if (poolInstance) {
      return poolInstance.end()
    }
    return Promise.resolve()
  }

  on(
    event: 'error' | 'release' | 'connect' | 'acquire' | 'remove',
    listener: (...args: unknown[]) => void,
  ): this {
    getPool().on(event, listener)
    return this
  }

  emit(event: string, ...args: unknown[]): boolean {
    return getPool().emit(event, ...args)
  }
}

export const pool = new LazyPool() as unknown as Pool

export async function query<T extends QueryResultRow>(
  db: Database,
  fragment: SqlFragment,
): Promise<QueryResult<T>> {
  return db.query<T>(fragment.text, fragment.values)
}

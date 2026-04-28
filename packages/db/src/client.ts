import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg'

import type { SqlFragment } from './sql'

const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URL_DIRECT

if (!connectionString) {
  throw new Error('DATABASE_URL or DATABASE_URL_DIRECT must be set')
}

export type Database = Pool | PoolClient

export const pool = new Pool({ connectionString })

export async function query<T extends QueryResultRow>(
  db: Database,
  fragment: SqlFragment,
): Promise<QueryResult<T>> {
  return db.query<T>(fragment.text, fragment.values)
}

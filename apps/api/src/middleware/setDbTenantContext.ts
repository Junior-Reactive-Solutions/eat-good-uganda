 
import { pool } from '@eatgood/db'
import type { RequestHandler } from 'express'

export const setDbTenantContext: RequestHandler = async (req, res, next) => {
  if (req.auth?.kind !== 'bakery_user' || !req.bakeryId) {
    next()
    return
  }

  const client = await pool.connect()

  try {
    await client.query(
      `SELECT set_config('app.bakery_id', $1, true),
              set_config('app.role', $2, true)`,
      [req.bakeryId, req.auth.role],
    )

    req.dbClient = client

    res.on('finish', () => {
      client.release()
    })

    next()
  } catch (error) {
    client.release()
    next(error)
  }
}

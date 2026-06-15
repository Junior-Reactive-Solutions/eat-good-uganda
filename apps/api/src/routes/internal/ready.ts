import express from 'express'

import { pool } from '@eatgood/db'

const router = express.Router()

/**
 * Readiness check endpoint.
 *
 * Verifies that the API is ready to serve traffic by checking database connectivity.
 * Returns 200 if ready, 503 if the database is unavailable.
 *
 * Used by orchestration platforms (Kubernetes, Render) to determine if the service
 * should receive traffic. Includes a 500ms timeout to prevent slow database
 * responses from blocking the readiness check.
 */
router.get('/', async (_req, res) => {
  const timeoutPromise = new Promise<'timeout'>((resolve) => {
    const timer = setTimeout(() => {
      resolve('timeout')
    }, 500)
    return () => clearTimeout(timer)
  })

  try {
    // Race between the database query and the timeout
    const queryPromise = (async () => {
      try {
        await pool.query('SELECT 1')
        return 'ok' as const
      } catch {
        return 'error' as const
      }
    })()

    const result = await Promise.race([queryPromise, timeoutPromise])

    if (result === 'timeout' || result === 'error') {
      return res.status(503).json({
        status: 'not_ready',
        reason: result === 'timeout' ? 'database_timeout' : 'database_error',
      })
    }

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    })
  } catch {
    res.status(503).json({
      status: 'not_ready',
      reason: 'internal_error',
    })
  }
})

export const internalReadyRouter = router

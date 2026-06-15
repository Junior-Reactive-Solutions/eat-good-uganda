import express from 'express'

const router = express.Router()

/**
 * Keep-alive health check endpoint.
 *
 * Returns a lightweight response without touching the database. Used by:
 * - GitHub Actions scheduled workflow (every 14 minutes)
 * - Render platform health checks
 *
 * Deliberately does NOT query the database. The keep-alive ping should not add
 * database load. A separate /ready endpoint exists for readiness checks.
 */
router.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime_seconds: Math.round(process.uptime()),
    version: process.env.GIT_SHA ?? 'dev',
    timestamp: new Date().toISOString(),
  })
})

export const internalHealthRouter = router

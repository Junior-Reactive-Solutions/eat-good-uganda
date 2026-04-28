import pino from 'pino'

export const logger = pino({
  redact: {
    paths: ['password', '*.password', '*.token', '*.secret', '*.credentials'],
    remove: true,
  },
  level: process.env.LOG_LEVEL ?? 'info',
})

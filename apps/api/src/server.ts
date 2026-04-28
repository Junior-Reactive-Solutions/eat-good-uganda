import { app } from './app'
import { env } from './env'
import { startJobs } from './jobs/start-jobs'
import { logger } from './lib/logger'

startJobs()

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'api server started')
})

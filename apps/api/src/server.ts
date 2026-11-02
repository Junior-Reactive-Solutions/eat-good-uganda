// `./env` must load (and call dotenv.config()) before `./app`, which transitively
// imports `@eatgood/db` and reads DATABASE_URL at module-evaluation time.
import { env } from './env'
// eslint-disable-next-line import/order
import { app } from './app'
import { startJobs } from './jobs/start-jobs'
import { logger } from './lib/logger'

startJobs()

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'api server started')
})

import restify from 'restify'
import os from 'os'
import bootstrap from './bootstrap'
import {
  auth, logger, cors, requestLogger
} from './middlewares'

global.Promise = require('bluebird')

const APP_NAME = process.env.npm_package_name
const ENV = process.env.NODE_ENV || 'default'

const PORT = process.env.PORT || 5000

const server = restify.createServer({
  name: APP_NAME,
  version: process.env.npm_package_version
})

const log = (level = 'info', message, ...args) => {
  logger[level](message, ...args)
}

server.pre(requestLogger)
server.pre(cors.preflight)
server.use(cors.actual)
server.use(restify.plugins.fullResponse())
server.use(restify.plugins.acceptParser(server.acceptable))
server.use(restify.plugins.queryParser({ mapParams: true }))
server.use(restify.plugins.bodyParser({ mapParams: true }))
server.use(restify.plugins.authorizationParser())
server.use(auth);

(async () => {
  await bootstrap({ log, server })
  const message = `Application starting in ${ENV} environment on http://${os.hostname()}:${PORT}`
  server.listen(PORT, () => logger.info(message))
})()

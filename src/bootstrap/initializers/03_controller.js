import util from 'util'
import path from 'path'
import { omit } from 'lodash'
import {
  createProxy,
  readDirPromise
} from 'utils'

export default function initializeControllers(self) {
  const app = path.join(__dirname, '..', '..', 'app')
  const proxyHandler = (targetValue, { prototype, target }, ...args) => {
    const { log } = self
    const class_name = target.constructor.name
    const [req, res] = args
    if (req.authenticated) {
      const omit_params = ['base64string']
      log('info', '%s - %s [Params: %s]', class_name, prototype, util.inspect(omit(req.params, omit_params)))
      return targetValue.apply(target, args)
        .then((response) => {
          if (response !== undefined) {
            res.send(200, response)
          }
        })
        .catch((err) => {
          if (err.success === false) {
            log('warn', '%s - %s [Error: %s]', class_name, prototype, err.message)
            return res.send(400, { code: 'BadRequest', message: err.message })
          } if (err.status === 404) {
            log('warn', '%s - %s [Error: %s]', class_name, prototype, err.message)
            return res.send(404, { code: 'NotFound', message: 'Resource not found' })
          }
          log('error', '%s - %s [Error: %s]', class_name, prototype, util.inspect(err))
          return res.send(500, { code: 'InternalServer', message: util.inspect(err) })
        })
    }
    log('warn', '%s - %s [Error: %s]', class_name, prototype, util.inspect(req.auth_error))
    return res.send(401, { code: 'Unauthorized', message: util.inspect(req.auth_error) })
  }

  const { server } = self
  const initRoutes = (module_name) => {
    const routes = require(path.join(app, module_name, 'routes')).default //eslint-disable-line
    let controller = new (require(path.join(app, module_name, 'controller')).default)(self) // eslint-disable-line
    controller = createProxy(controller, proxyHandler)
    Object.entries(routes).forEach(([verb, handlers]) => {
      handlers.forEach(({ url, handler }) => {
        server[verb](url, controller[handler])
      })
    })
  }
  return readDirPromise(app)
    .filter(module_name => module_name !== 'base')
    .map(initRoutes)
    .then(() => initRoutes('base'))
}

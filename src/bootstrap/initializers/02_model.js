import path from 'path'
import fs from 'fs'
import {
  createProxy,
  readDirPromise,
  serviceLocator
} from 'utils'

export default async function initializeModels(self) {
  const app_path = path.join(__dirname, '..', '..', 'app')
  self.Model = {}
  serviceLocator.registerService('Model', self.Model)
  const initModels = async (module_name) => {
    const service_path = path.join(app_path, module_name, 'model.js')
    if (fs.existsSync(service_path)) {
      const service = new (require(service_path).default)(self) // eslint-disable-line
      self.Model[module_name] = createProxy(service)
    }
  }
  return readDirPromise(app_path)
    .map(initModels)
}

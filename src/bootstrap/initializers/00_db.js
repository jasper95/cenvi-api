
import {
  SchemaBuilder,
  QueryWrapper
} from 'knex-wrapper'
import util from 'util'
import {
  schema,
  database
} from 'config'
import {
  createProxy,
  serviceLocator
} from 'utils'

export default async function initializeDB(self) {
  const { database: db_name, port, host } = database.connection
  const query_wrapper = createProxy(new QueryWrapper(schema, database))
  self.DB = query_wrapper
  self.knex = query_wrapper.knex
  const schema_builder = new SchemaBuilder(schema, query_wrapper)
  serviceLocator.registerService('DB', query_wrapper)
  serviceLocator.registerService('knex', query_wrapper.knex)
  return schema_builder.setupSchema()
    .then(() => self.log('info', 'Connected to Database [Connection: %s:%s, Name: %s]', host, port, db_name))
    .catch(err => self.log('error', 'Error setting up schema [Error: %s]', util.inspect(err)))
}

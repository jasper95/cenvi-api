import { views, functions } from 'config/sql'
import {
  serviceLocator
} from 'utils'
import util from 'util'

export default async function initializeViews(self) {
  const knex = serviceLocator.get('knex')
  await Promise
    .mapSeries(views, (e) => {
      self.log('info', 'Initialize View  [name: %s]', e.name)
      return knex.raw(getViewQuery(e))
    })
    .then(() => self.log('info', 'Views successfully initialized'))
    .catch(err => self.log('error', 'Error initializing views [Error: %s]', util.inspect(err)))

  await Promise
    .mapSeries(functions, (e) => {
      self.log('info', 'Initialize Function  [signature: %s]', e.param_signature)
      const q = getFunctionQuery(e)
      return knex.raw(q)
    })
    .then(() => self.log('info', 'Functions successfully initialized'))
    .catch(err => self.log('error', 'Error initializing functions [Error: %s]', util.inspect(err)))
}

function getViewQuery({ name, query }) {
  return `create or replace view ${name} as ${query}`
}
function getFunctionQuery({ return_signature, query, param_signature }) {
  return `
    create or replace function ${param_signature}
    returns ${return_signature} AS $$
      ${query}
    $$ LANGUAGE sql STABLE;
  `
}

import util from 'util'
import {
  seeds
} from 'config'

export default function insertSeeds({ DB, log }) {
  return Promise.mapSeries(seeds, ({ table_name, data }) => DB.upsert(table_name, data))
    .then(() => log('info', 'Seed data successfully added [Tables: %s]', seeds.map(e => e.table_name)))
    .catch(err => log('error', 'Error adding seed data [Error: %s]', util.inspect(err)))
}

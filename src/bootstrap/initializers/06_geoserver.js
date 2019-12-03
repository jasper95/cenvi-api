import { geoServerClient } from 'utils'

const WORKSPACE_URL = `workspaces/${process.env.GEOSERVER_WORKSPACE}`
const STORE_URL = `${WORKSPACE_URL}/datastores/${process.env.GEOSERVER_STORE}`

export default async function initGeoserver() {
  // get workspace
  const workspace = await geoServerClient.request({
    url: WORKSPACE_URL
  }).catch(() => null)

  // check if geoserver workspace exists already
  if (!workspace) {
    // create geoserver wokspace
    await geoServerClient({
      url: '/workspaces?default=true',
      data: { workspace: { name: process.env.GEOSERVER_WORKSPACE } },
      method: 'POST'
    })
  }

  // get store
  const data_store = await geoServerClient.request({
    url: STORE_URL
  }).catch(() => null)
  if (!data_store) {
    await geoServerClient.request({
      method: 'POST',
      url: `${WORKSPACE_URL}/datastores`,
      data: {
        dataStore: {
          name: process.env.GEOSERVER_STORE,
          connectionParameters: {
            entry: [
              { '@key': 'host', $: process.env.DB_HOST },
              { '@key': 'port', $: process.env.DB_PORT },
              { '@key': 'database', $: process.env.DB_NAME },
              { '@key': 'user', $: process.env.DB_USER },
              { '@key': 'passwd', $: process.env.DB_PASSWORD },
              { '@key': 'dbtype', $: 'postgis' }
            ]
          }
        }
      }
    })
  }
}

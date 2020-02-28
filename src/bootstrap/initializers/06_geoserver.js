import { geoServerClient } from 'utils'

const WORKSPACE_URL = `/workspaces/${process.env.GEOSERVER_WORKSPACE}`

export default async function initGeoserver() {
  // get workspace
  const workspace = await geoServerClient.request({
    url: `${WORKSPACE_URL}?quietOnNotFound=true`
  }).catch((err) => {
    if (err.response.status === 404) {
      return null
    }
    throw err
  })

  // check if geoserver workspace exists already
  if (!workspace) {
    // create geoserver wokspace
    await geoServerClient({
      url: '/workspaces?default=true',
      data: { workspace: { name: process.env.GEOSERVER_WORKSPACE, enabled: true } },
      method: 'POST'
    })
  }
}

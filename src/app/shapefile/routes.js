const routes = {
  get: [
    {
      url: '/shapefile/:id/bbox',
      handler: 'getBoundingBox'
    }
  ],
  post: [
    {
      url: '/shapefile',
      handler: 'createShapefile'
    }
  ],
  put: [
    {
      url: '/shapefile',
      handler: 'updateShapefile'
    }
  ]
}
export default routes

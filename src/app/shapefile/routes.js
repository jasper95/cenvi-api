const routes = {
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

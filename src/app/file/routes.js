const routes = {
  get: [
    {
      url: '/file/shapefile/:id',
      handler: 'getShapefileGeodata'
    },
    {
      url: '/file/download',
      handler: 'downloadFile'
    }
  ],
  post: [
    {
      url: '/file/upload',
      handler: 'uploadFile'
    },
    {
      url: '/file/upload/simple',
      handler: 'simpleUpload'
    },
    {
      url: '/file/upload/shapefile',
      handler: 'uploadShapefile'
    },
    {
      url: '/file/validate/geodata',
      handler: 'validateGeodata'
    }
  ]
}
export default routes

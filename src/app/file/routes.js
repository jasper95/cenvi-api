const routes = {
  get: [
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
    }
  ]
}
export default routes

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
      handler: 'uploadFile2'
    }
  ]
}
export default routes

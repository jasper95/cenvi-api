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
    }
  ]
}
export default routes

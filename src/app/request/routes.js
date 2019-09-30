const routes = {
  post: [
    {
      url: '/request/accept',
      handler: 'acceptRequest'
    },
    {
      url: '/request',
      handler: 'createRequest'
    }
  ],
  del: [
    {
      url: '/request/:id',
      handler: 'deleteRequest'
    }
  ]
}
export default routes

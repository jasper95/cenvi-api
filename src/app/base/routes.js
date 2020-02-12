const routes = {
  get: [
    {
      url: '/base/:node/:id',
      handler: 'getNodeDetails'
    },
    {
      url: '/base/:node',
      handler: 'getNodeList'
    }
  ],
  post: [
    {
      url: '/base/:node',
      handler: 'createNode'
    }
  ],
  put: [
    {
      url: '/base/:node',
      handler: 'updateNode'
    }
  ],
  del: [
    {
      url: '/base/:node/:id',
      handler: 'deleteNode'
    }
  ]
}
export default routes

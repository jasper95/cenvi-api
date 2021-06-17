const routes = {
  get: [
    {
      url: '/session',
      handler: 'getSession'
    },
    {
      url: '/validate-token',
      handler: 'validateToken'
    }
  ],
  post: [
    {
      url: '/user',
      handler: 'createUser'
    },
    {
      url: '/signup',
      handler: 'signup'
    },
    {
      url: '/login',
      handler: 'login'
    },
    {
      url: '/forgot-password',
      handler: 'forgotPassword'
    },
    {
      url: '/logout',
      handler: 'logout'
    }
  ],
  put: [
    {
      url: '/reset-password',
      handler: 'resetPassword'
    },
    {
      url: '/verify-account',
      handler: 'verifyAccount'
    }
  ],
  del: []
}
export default routes

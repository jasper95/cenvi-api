import jwt from 'jsonwebtoken'
import pathToRegexp from 'path-to-regexp'
import {
  serviceLocator
} from 'utils'

const public_routes = {
  GET: [
    '/file/download'
  ],
  POST: [],
  PUT: [],
  DELETE: []
}

const basic_auth_routes = {
  GET: [
    '/job/:id',
    '/job_category',
    '/company/:id'
  ],
  POST: [
    '/signup',
    '/login',
    '/forgot-password'
  ],
  PUT: [
    '/user',
    '/reset-password',
    '/verify-account'
  ],
  DELETE: []
}

function matchRoutes(routes, req) {
  return routes[req.method].some(pathname => pathToRegexp(pathname).test(req.getPath()))
}

export default async function authMiddleware(req, res, next) {
  const DB = serviceLocator.get('DB')
  req.authenticated = true
  const { authorization } = req.headers
  if (matchRoutes(public_routes, req)) {
    return next()
  }
  const token = authorization && authorization.includes('Bearer')
    ? authorization.replace('Bearer ', '') : ''
  if (token) {
    try {
      const { id, user_id } = jwt.verify(token, process.env.AUTH_SECRET)
      const [session, user] = await Promise.all([DB.find('user_session', id), DB.find('user', user_id)])
      if (!session || session.status !== 'Online') {
        req.auth_error = 'Invalid token'
        req.authenticated = false
      } else if (session) {
        req.user = user
        req.session = session
      }
    } catch (err) {
      req.authenticated = false
      req.auth_error = 'Invalid access token'
    }
  } else if (matchRoutes(basic_auth_routes, req)) {
    if (req.username !== process.env.BASIC_USERNAME
      || req.authorization.basic.password !== process.env.BASIC_PASSWORD) {
      req.auth_error = 'Invalid credentials'
      req.authenticated = false
    }
  } else {
    req.auth_error = 'Authentication is required'
    req.authenticated = false
  }
  return next()
}

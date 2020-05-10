import crypto from 'crypto'
import fs from 'fs'
import util from 'util'
import path from 'path'
import slugify from 'slugify'
import fetch from 'node-fetch'
import axios from 'axios'

require('dotenv').config()


global.Promise = require('bluebird')

global.fs = Promise.promisifyAll(fs)
fetch.Promise = global.Promise
global.fetch = fetch

const geoServerClient = axios.create({
  headers: {
    Authorization: `Basic ${Buffer.from(`${process.env.GEOSERVER_USERNAME}:${process.env.GEOSERVER_PASSWORD}`).toString('base64')}`
  },
  baseURL: `${process.env.GEOSERVER_URL}/rest`
})
geoServerClient.interceptors.response.use(response => response.data, err => Promise.reject(err))

export { geoServerClient }

export const serviceLocator = {
  services: {},
  registerService(service_name, service) {
    if (!this.services[service_name]) {
      this.services[service_name] = service
    }
  },
  get(service_name) {
    return this.services[service_name]
  }
}

export const generateSalt = (length = 16) => crypto
  .randomBytes(Math.ceil(length / 2))
  .toString('hex')
  .slice(0, length)

export const generateHash = (password, salt) => crypto
  .createHmac('sha512', salt)
  .update(password)
  .digest('hex')

const proxyHandler = (targetValue, { prototype, target }, ...args) => {
  const log = serviceLocator.get('logger')
  if (!prototype.includes('_')) {
    log('info', '%s - %s Params: %s', target.constructor.name, prototype, util.inspect(args))
  }
  return targetValue.apply(target, args)
}

export const selectJsonObject = (fields, alias) => {
  const object = `json_build_object(${fields.map(field => `'${field}', ${alias}.${field}`).join(', ')})`
  return `${object} as ${alias}`
}

export const selectJsonArray = (fields, alias, join_column, result_alias) => {
  const object = `json_build_object(${fields.map(field => `'${field}', ${alias}.${field}`).join(', ')})`
  const array = `json_agg(${object})`
  const filtered_array = `COALESCE(${array} FILTER (WHERE ${alias}.${join_column} IS NOT NULL), '[]')`
  return `${filtered_array} as ${result_alias}`
}

export const selectFields = (fields, alias) => fields.map(field => `${alias}.${field}`)

export const createProxy = (object, cb = proxyHandler) => {
  const handler = {
    get(target, prototype, receiver) {
      const targetValue = Reflect.get(target, prototype, receiver)
      if (prototype in Object.getPrototypeOf(target) && typeof targetValue === 'function') {
        return (...args) => cb(targetValue, { target, prototype }, ...args)
      }
      return targetValue
    }
  }
  return new Proxy(object, handler)
}

export const formatHTML = async (template_name, content) => {
  const file_path = path.join(process.cwd(), 'resources', 'html-templates', `${template_name}.html`)
  const html = await fs.readFileAsync(file_path, 'utf-8')
  return Object.entries(content)
    .reduce((acc, [key, value]) => {
      acc = acc.replace(new RegExp(`\\\${\\s*${key}\\s*}`, 'g'), value)
      return acc
    }, html)
}

export const uploadToS3 = (buffer, file_path, options = {}) => {
  const s3 = serviceLocator.get('s3')
  const log = serviceLocator.get('logger')
  const bucket = process.env.AWS_BUCKET
  log('info', 'Uploading File to s3 [bucket: %s, path: %s]', bucket, file_path)
  return new Promise((resolve, reject) => {
    s3.upload({
      Bucket: bucket,
      Key: file_path,
      Body: buffer,
      ...options.encoding && { ContentEncoding: options.encoding },
      ...options.content_type && { ContentType: options.content_type }
    }, (err, response) => {
      if (err) {
        reject(err)
      }
      resolve(response)
    })
  })
}

export const generateSlug = (...args) => slugify([
  ...args,
  Math.floor(Math.random() * 90000) + 10000
].join(' ')).toLowerCase()

export const isUuid = string => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(string)

export const whereAnd = (query, filters) => {
  const [first, ...rest] = filters
  const transformArgs = (filter) => {
    if (filter.type === 'raw') {
      return [filter.value]
    }
    return [filter.key, filter.op, filter.value]
  }
  return rest
    .reduce((q, el) => {
      q = q.andWhere(...transformArgs(el))
      return q
    }, query.where(...transformArgs(first)))
}

export function getPortaLink(headers) {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  return `${protocol}://${headers.referer.split('/')[2]}`
}

import path from 'path'
import util from 'util'
import sendgrid from '@sendgrid/mail'
import S3Client from 'aws-sdk/clients/s3'
import {
  readDirPromise,
  serviceLocator
} from 'utils'

require('dotenv').config()

export default async ({ server, log }) => {
  const dir = path.join(__dirname, './initializers')

  sendgrid.setApiKey(process.env.SEND_GRID_API_KEY)

  serviceLocator.registerService('sendgrid', sendgrid)
  serviceLocator.registerService('logger', log)
  serviceLocator.registerService('s3', new S3Client({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }))

  const context = { server, log, serviceLocator }
  return readDirPromise(dir)
    .then(files => files.sort())
    .mapSeries(async (file) => {
      const { default: initializer } = require(`${dir}/${file}`) // eslint-disable-line
      await initializer(context)
      return null
    })
    .catch(err => log('error', util.inspect(err)))
}

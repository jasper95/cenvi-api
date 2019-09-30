import path from 'path'
import mime from 'mime-types'
import {
  uploadToS3
} from 'utils'

export default class JobController {
  constructor(dependency) {
    const {
      DB, knex, Model, serviceLocator
    } = dependency
    this.DB = DB
    this.knex = knex
    this.Model = Model
    this.serviceLocator = serviceLocator
  }

  async downloadFile({ params }, res) {
    const {
      node, id, type, attachment
    } = params
    const record = await this.DB.find(node, id)
    if (!record || !record[type]) {
      throw { status: 404 }
    }
    const filename = record[type]
    const file_path = path.join(node, id, type, filename)
    const s3 = this.serviceLocator.get('s3')
    if (attachment) {
      res.header('Content-disposition', `attachment; filename=${filename}`)
    }
    res.header('Content-Type', mime.lookup(filename))
    const stream = s3.getObject({
      Bucket: process.env.AWS_BUCKET,
      Key: file_path
    }).createReadStream()
    stream.on('error', () => {
      res.writeHead(404);
      res.end();
    });
    stream.pipe(res)
  }

  async uploadFile({ params }) {
    const {
      node, id, base64string, filename, type
    } = params
    const file_path = path.join(node, id, type, filename)
    await uploadToS3(
      Buffer.from(base64string.split(';').pop().replace('base64,', ''), 'base64'),
      file_path
    )
    return this.DB.updateById(
      node,
      { id, [type]: filename }
    )
  }
}

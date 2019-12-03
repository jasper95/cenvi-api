import path from 'path'
import mime from 'mime-types'
import generateUUID from 'uuid/v4'

export default class FileController {
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

  async simpleUpload({ files, params }) {
    const { file } = files
    const { file_path } = params
    await this.Model.file.moveUploadedFile(file, file_path)
    return {
      file_path
    }
  }

  async uploadShapefile({ files, params }) {
    const { file } = files
<<<<<<< HEAD
    const { extension, id } = params
    await this.Model.file.uploadGeoData(file.path, id, extension)
=======
    const { extension } = params
    await this.Model.file.uploadGeoData(file.path, generateUUID(), extension)
>>>>>>> d353f0dab81f8818e4ee57c504c535eed00184a2
    return {
      uploaded: true
    }
  }

  async uploadFile({ files, params }) {
    const {
      uuid, partindex, totalparts, filename
    } = params
    const { file } = files
    file.name = filename;
    const response = {
      success: false
    };
    await this.Model.file.storeChunk(file.path, uuid, partindex, totalparts)
    if (partindex >= totalparts - 1) {
      const file_path = await this.Model.file.combineChunks(filename, uuid)
      response.file_path = file_path
      response.id = uuid
      await this.DB.insert('photo', {
        id: uuid,
        file_path
      })
    }
    response.success = true;
    return response
  }
}

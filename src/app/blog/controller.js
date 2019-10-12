import uuid from 'uuid/v4'

export default class BlogController {
  constructor(dependency) {
    const {
      DB, knex, Model, serviceLocator
    } = dependency
    this.DB = DB
    this.knex = knex
    this.Model = Model
    this.serviceLocator = serviceLocator
  }

  async upsertBlog({ files, params }) {
    if (files.file) {
      params.image_url = await this.Model.file.moveUploadedFile(files.file, uuid())
      delete params.files
    }
    return this.DB.upsert('blog', params)
  }
}

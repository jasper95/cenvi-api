import { getPortaLink } from 'utils'

export default class PostController {
  constructor({ DB, knex, Model }) {
    this.DB = DB
    this.knex = knex
    this.Model = Model
  }

  async createPost({ params, headers }) {
    const response = await this.DB.insert('post', params)
    await this.Model.post.createFacebookPost(response, getPortaLink(headers))
    return response
  }
}

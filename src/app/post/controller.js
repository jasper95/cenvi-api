import { getPortaLink } from 'utils'

export default class PostController {
  constructor({ DB, knex, Model }) {
    this.DB = DB
    this.knex = knex
    this.Model = Model
  }

  async createPost({ params, headers, user }) {
    const response = await this.DB.insert('post', {
      ...params,
      user_id: user.id
    })
    await this.Model.post.createFacebookPost(response, getPortaLink(headers))
    return response
  }
}

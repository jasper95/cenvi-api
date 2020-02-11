import { getPortaLink } from 'utils'
import slugify from 'slugify'

export default class PostController {
  constructor({ DB, knex, Model }) {
    this.DB = DB
    this.knex = knex
    this.Model = Model
  }

  async createPost({ params, headers, user }) {
    const slug = `${slugify(params.title)}-${new Date().getTime()}`.toLowerCase()
    const response = await this.DB.insert('post', {
      ...params,
      slug,
      user_id: user.id
    })
    await this.Model.post.createFacebookPost(response, getPortaLink(headers))
    return response
  }
}

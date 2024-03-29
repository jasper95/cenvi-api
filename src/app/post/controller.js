import slugify from 'slugify'
import dayjs from 'dayjs'
import {
  getPortalLink
} from 'utils'

export default class PostController {
  constructor({ DB, knex, Model }) {
    this.DB = DB
    this.knex = knex
    this.Model = Model
  }

  async createPost({ params, user, headers }) {
    const slug = `${slugify(params.name)}-${new Date().getTime()}`.toLowerCase()
    const response = await this.DB.insert('post', {
      ...params,
      slug,
      user_id: user.id,
      is_posted: params.status === 'Published' || dayjs(params.published_date).isSame(new Date().toISOString(), 'date')
    })
    if (response.is_posted) {
      await this.Model.post.createFacebookPost(response, [getPortalLink(headers), 'api'].join('/'))
    }
    return response
  }

  async updatePost({ params, headers }) {
    const old = await this.DB.find('post', params.id)
    const response = await this.DB.updateById('post', {
      ...params,
      is_posted: params.status === 'Published' || dayjs(params.published_date).isSame(new Date().toISOString(), 'date')
    })
    if (params.is_posted && !old.is_posted) {
      await this.Model.post.createFacebookPost(response, [getPortalLink(headers), 'api'].join('/'))
    }
    return response
  }
}

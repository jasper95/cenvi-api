import { isUuid } from 'utils'

export default class BaseController {
  constructor({ DB, knex, Model }) {
    this.DB = DB
    this.knex = knex
    this.Model = Model
  }

  async getNodeList({ params }) {
    const { node, fields = [], ...other_params } = params
    return this.DB.filter(node, other_params, fields)
  }

  async getNodeDetails({ params }) {
    const { node, id } = params
    const record = await this.DB.find(node, id, [], isUuid(id) ? 'id' : 'slug')
    if (!record) {
      throw { status: 404 }
    }
    return record
  }

  async createNode({ params, user }) {
    const { node } = params
    params.user_id = user.id
    return this.DB.insert(node, params)
  }

  async updateNode({ params }) {
    const { node } = params
    return this.DB.updateById(node, params)
  }

  async deleteNode({ params }) {
    const { node, id } = params
    if (id === 'bulk') {
      const { ids } = params
      return this.DB.deleteByFilter(node, q => q.whereIn('id', ids))
    }
    return this.DB.deleteById(node, params)
  }
}

import difference from 'lodash/difference'

export default class CommentController {
  constructor({ DB, knex, Model }) {
    this.DB = DB
    this.knex = knex
    this.Model = Model
  }

  async createComment({ params, session }) {
    const { body } = params
    const response = await this.DB.insert('comment', {
      ...params,
      user_id: session.user_id
    })
    const risk = await this.DB.find('risk', params.risk_id)
    const { type: risk_type } = risk
    let users = await this.knex('user')
      .select('id', 'srmp_business_units', 'ormp_business_units', 'prmp_business_units', 'role')
      .where({ [`${risk_type}_role`]: 'TEAM_LEADER' })
      .orWhere({ role: 'ADMIN' })
      .orWhere({ id: risk.user_id })

    // TODO: transfer to sql query filter
    users = users.filter((e) => {
      if (e.id === session.user_id) {
        return false
      }

      if (e.role !== 'ADMIN') {
        return e[`${risk_type}_business_units`].includes(risk.business_unit_id)
      }
      return true
    })

    const tagged_users = Object.values(body.entityMap)
      .filter(e => e.type === 'mention')
      .map(e => e.data.mention.id)

    await this.DB.insert('notification', {
      user_id: session.user_id,
      receivers: difference(users.map(e => e.id), tagged_users),
      risk_id: params.risk_id,
      business_unit_id: risk.business_unit_id,
      details: {
        action: 'comment'
      }
    })

    if (tagged_users.length) {
      await this.DB.insert('notification', {
        user_id: session.user_id,
        receivers: tagged_users,
        risk_id: params.risk_id,
        business_unit_id: risk.business_unit_id,
        details: {
          action: 'tag'
        }
      })
    }
    return response
  }
}
